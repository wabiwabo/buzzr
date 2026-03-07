-- Buzzr Platform - Database Initialization Script
-- Multi-tenant waste management system
-- Each tenant (DLH instance) gets its own PostgreSQL schema

-- =============================================================================
-- 1. Enable Extensions
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =============================================================================
-- 2. Public Tenants Table
-- =============================================================================
CREATE TABLE public.tenants (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255) NOT NULL,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    schema_name VARCHAR(100) NOT NULL UNIQUE,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 3. Function: create_tenant_schema
--    Creates a new schema with all required tables for a tenant
-- =============================================================================
CREATE OR REPLACE FUNCTION create_tenant_schema(tenant_schema VARCHAR)
RETURNS VOID AS $$
BEGIN
    -- Create the schema
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', tenant_schema);

    -- -------------------------------------------------------------------------
    -- areas
    -- -------------------------------------------------------------------------
    EXECUTE format('
        CREATE TABLE %I.areas (
            id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name        VARCHAR(255) NOT NULL,
            level       INTEGER NOT NULL,
            parent_id   UUID REFERENCES %I.areas(id),
            geometry    geometry(MultiPolygon, 4326),
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )', tenant_schema, tenant_schema);

    -- -------------------------------------------------------------------------
    -- users
    -- -------------------------------------------------------------------------
    EXECUTE format('
        CREATE TABLE %I.users (
            id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name           VARCHAR(255) NOT NULL,
            email          VARCHAR(255) UNIQUE,
            phone          VARCHAR(50) UNIQUE,
            password_hash  VARCHAR(255) NOT NULL,
            role           VARCHAR(50) NOT NULL,
            area_id        UUID REFERENCES %I.areas(id),
            is_active      BOOLEAN NOT NULL DEFAULT TRUE,
            reward_points  INTEGER NOT NULL DEFAULT 0,
            created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )', tenant_schema, tenant_schema);

    -- -------------------------------------------------------------------------
    -- tps_locations
    -- -------------------------------------------------------------------------
    EXECUTE format('
        CREATE TABLE %I.tps_locations (
            id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name            VARCHAR(255) NOT NULL,
            type            VARCHAR(50) NOT NULL,
            status          VARCHAR(50) NOT NULL DEFAULT ''active'',
            address         TEXT,
            area_id         UUID REFERENCES %I.areas(id),
            coordinates     geometry(Point, 4326),
            capacity_tons   NUMERIC(10,2),
            current_load_tons NUMERIC(10,2) NOT NULL DEFAULT 0,
            qr_code         VARCHAR(255) UNIQUE,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )', tenant_schema, tenant_schema);

    -- -------------------------------------------------------------------------
    -- vehicles
    -- -------------------------------------------------------------------------
    EXECUTE format('
        CREATE TABLE %I.vehicles (
            id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            plate_number   VARCHAR(20) NOT NULL UNIQUE,
            type           VARCHAR(50) NOT NULL,
            capacity_tons  NUMERIC(10,2) NOT NULL,
            driver_id      UUID REFERENCES %I.users(id),
            is_active      BOOLEAN NOT NULL DEFAULT TRUE,
            created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )', tenant_schema, tenant_schema);

    -- -------------------------------------------------------------------------
    -- schedules
    -- -------------------------------------------------------------------------
    EXECUTE format('
        CREATE TABLE %I.schedules (
            id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            vehicle_id      UUID REFERENCES %I.vehicles(id),
            driver_id       UUID REFERENCES %I.users(id),
            route_name      VARCHAR(255) NOT NULL,
            schedule_type   VARCHAR(50) NOT NULL,
            recurring_days  INTEGER[],
            scheduled_date  DATE,
            start_time      TIME,
            status          VARCHAR(50) NOT NULL DEFAULT ''pending'',
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )', tenant_schema, tenant_schema, tenant_schema);

    -- -------------------------------------------------------------------------
    -- schedule_stops
    -- -------------------------------------------------------------------------
    EXECUTE format('
        CREATE TABLE %I.schedule_stops (
            id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            schedule_id         UUID REFERENCES %I.schedules(id),
            tps_id              UUID REFERENCES %I.tps_locations(id),
            stop_order          INTEGER NOT NULL,
            estimated_arrival   TIME
        )', tenant_schema, tenant_schema, tenant_schema);

    -- -------------------------------------------------------------------------
    -- transfer_records
    -- -------------------------------------------------------------------------
    EXECUTE format('
        CREATE TABLE %I.transfer_records (
            id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            schedule_id         UUID REFERENCES %I.schedules(id),
            source_tps_id       UUID REFERENCES %I.tps_locations(id),
            destination_tps_id  UUID REFERENCES %I.tps_locations(id),
            vehicle_id          UUID REFERENCES %I.vehicles(id),
            driver_id           UUID REFERENCES %I.users(id),
            operator_id         UUID REFERENCES %I.users(id),
            category            VARCHAR(100),
            volume_kg           NUMERIC(10,2),
            status              VARCHAR(50) NOT NULL DEFAULT ''pending'',
            photo_url           TEXT,
            notes               TEXT,
            checkpoint_at       TIMESTAMPTZ,
            verified_at         TIMESTAMPTZ,
            created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )', tenant_schema, tenant_schema, tenant_schema, tenant_schema, tenant_schema, tenant_schema, tenant_schema);

    -- -------------------------------------------------------------------------
    -- gps_logs
    -- -------------------------------------------------------------------------
    EXECUTE format('
        CREATE TABLE %I.gps_logs (
            id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            vehicle_id   UUID REFERENCES %I.vehicles(id),
            driver_id    UUID REFERENCES %I.users(id),
            coordinates  geometry(Point, 4326),
            speed        NUMERIC(6,2),
            recorded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )', tenant_schema, tenant_schema, tenant_schema);

    -- -------------------------------------------------------------------------
    -- transactions
    -- -------------------------------------------------------------------------
    EXECUTE format('
        CREATE TABLE %I.transactions (
            id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id         UUID REFERENCES %I.users(id),
            type            VARCHAR(50) NOT NULL,
            amount          NUMERIC(12,2) NOT NULL,
            status          VARCHAR(50) NOT NULL DEFAULT ''pending'',
            payment_method  VARCHAR(50),
            external_id     VARCHAR(255),
            reference_id    VARCHAR(255),
            description     TEXT,
            paid_at         TIMESTAMPTZ,
            expired_at      TIMESTAMPTZ,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )', tenant_schema, tenant_schema);

    -- -------------------------------------------------------------------------
    -- wallets
    -- -------------------------------------------------------------------------
    EXECUTE format('
        CREATE TABLE %I.wallets (
            id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id     UUID NOT NULL UNIQUE REFERENCES %I.users(id),
            balance     NUMERIC(12,2) NOT NULL DEFAULT 0,
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )', tenant_schema, tenant_schema);

    -- -------------------------------------------------------------------------
    -- complaints
    -- -------------------------------------------------------------------------
    EXECUTE format('
        CREATE TABLE %I.complaints (
            id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            reporter_id  UUID REFERENCES %I.users(id),
            category     VARCHAR(100) NOT NULL,
            status       VARCHAR(50) NOT NULL DEFAULT ''open'',
            description  TEXT NOT NULL,
            latitude     DOUBLE PRECISION,
            longitude    DOUBLE PRECISION,
            address      TEXT,
            assigned_to  UUID REFERENCES %I.users(id),
            resolved_at  TIMESTAMPTZ,
            rating       INTEGER,
            created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )', tenant_schema, tenant_schema, tenant_schema);

    -- -------------------------------------------------------------------------
    -- complaint_attachments
    -- -------------------------------------------------------------------------
    EXECUTE format('
        CREATE TABLE %I.complaint_attachments (
            id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            complaint_id  UUID REFERENCES %I.complaints(id),
            file_url      TEXT NOT NULL,
            file_type     VARCHAR(50),
            created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )', tenant_schema, tenant_schema);

    -- -------------------------------------------------------------------------
    -- audit_logs
    -- -------------------------------------------------------------------------
    EXECUTE format('
        CREATE TABLE %I.audit_logs (
            id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id      UUID REFERENCES %I.users(id),
            action       VARCHAR(100) NOT NULL,
            entity_type  VARCHAR(100),
            entity_id    UUID,
            old_value    JSONB,
            new_value    JSONB,
            ip_address   INET,
            created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )', tenant_schema, tenant_schema);

    -- -------------------------------------------------------------------------
    -- notifications
    -- -------------------------------------------------------------------------
    EXECUTE format('
        CREATE TABLE %I.notifications (
            id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id     UUID REFERENCES %I.users(id),
            title       VARCHAR(255) NOT NULL,
            body        TEXT,
            type        VARCHAR(50),
            is_read     BOOLEAN NOT NULL DEFAULT FALSE,
            data        JSONB,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )', tenant_schema, tenant_schema);

END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 4. Insert Demo Tenant
-- =============================================================================
INSERT INTO public.tenants (name, slug, schema_name)
VALUES ('DLH Demo', 'dlh-demo', 'dlh_demo');

-- =============================================================================
-- 5. Create Demo Tenant Schema
-- =============================================================================
SELECT create_tenant_schema('dlh_demo');
