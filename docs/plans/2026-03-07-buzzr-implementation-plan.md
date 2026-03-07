# Buzzr Platform Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a multi-tenant waste management platform (Buzzr) for Indonesian DLH, covering waste tracking, fleet management, payments, and citizen engagement.

**Architecture:** NestJS monolith modular with schema-per-tenant PostgreSQL + PostGIS, React admin dashboard, React Native (Expo) mobile app. All in a Turborepo monorepo.

**Tech Stack:** NestJS, PostgreSQL/PostGIS, Redis, BullMQ, MinIO, React/Vite/Ant Design, React Native/Expo, Midtrans/Xendit, FCM

**Design doc:** `docs/plans/2026-03-07-buzzr-platform-design.md`

---

## Phase 1: Foundation & Monorepo Setup

### Task 1: Initialize Turborepo Monorepo

**Files:**
- Create: `package.json`
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `.nvmrc`

**Step 1: Initialize root package.json**

```bash
node -v  # Verify Node.js 20+
```

Create `package.json`:
```json
{
  "name": "buzzr",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "db:migrate": "turbo run db:migrate --filter=@buzzr/api",
    "db:seed": "turbo run db:seed --filter=@buzzr/api"
  },
  "devDependencies": {
    "turbo": "^2.4.0",
    "typescript": "^5.7.0"
  },
  "packageManager": "pnpm@9.15.0",
  "engines": {
    "node": ">=20.0.0"
  }
}
```

**Step 2: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "lint": {
      "outputs": []
    },
    "db:migrate": {
      "cache": false
    },
    "db:seed": {
      "cache": false
    }
  }
}
```

**Step 3: Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@buzzr/shared-types": ["packages/shared-types/src"],
      "@buzzr/constants": ["packages/constants/src"],
      "@buzzr/validators": ["packages/validators/src"]
    }
  }
}
```

**Step 4: Create .gitignore, .env.example, .nvmrc**

`.gitignore`:
```
node_modules/
dist/
.env
.env.local
*.log
.turbo/
coverage/
.DS_Store
```

`.env.example`:
```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=buzzr
DATABASE_PASSWORD=buzzr_secret
DATABASE_NAME=buzzr

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# JWT
JWT_ACCESS_SECRET=change-me-access-secret
JWT_REFRESH_SECRET=change-me-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OTP Provider (Fonnte)
OTP_PROVIDER_URL=https://api.fonnte.com/send
OTP_PROVIDER_TOKEN=your-fonnte-token

# Payment Gateway (Xendit)
XENDIT_SECRET_KEY=your-xendit-secret
XENDIT_WEBHOOK_TOKEN=your-webhook-token

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# App
APP_PORT=3000
APP_ENV=development
```

`.nvmrc`:
```
20
```

**Step 5: Install dependencies and verify**

```bash
pnpm install
```

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: initialize turborepo monorepo"
```

---

### Task 2: Create Shared Packages

**Files:**
- Create: `packages/shared-types/package.json`
- Create: `packages/shared-types/tsconfig.json`
- Create: `packages/shared-types/src/index.ts`
- Create: `packages/shared-types/src/roles.ts`
- Create: `packages/shared-types/src/waste.ts`
- Create: `packages/shared-types/src/complaint.ts`
- Create: `packages/shared-types/src/payment.ts`
- Create: `packages/constants/package.json`
- Create: `packages/constants/tsconfig.json`
- Create: `packages/constants/src/index.ts`
- Create: `packages/constants/src/roles.ts`
- Create: `packages/constants/src/waste-categories.ts`
- Create: `packages/constants/src/complaint-status.ts`
- Create: `packages/constants/src/payment-status.ts`
- Create: `packages/validators/package.json`
- Create: `packages/validators/tsconfig.json`
- Create: `packages/validators/src/index.ts`
- Create: `packages/validators/src/auth.validators.ts`
- Create: `packages/validators/src/tps.validators.ts`

**Step 1: Create shared-types package**

`packages/shared-types/package.json`:
```json
{
  "name": "@buzzr/shared-types",
  "version": "0.0.1",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc",
    "lint": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.7.0"
  }
}
```

`packages/shared-types/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

`packages/shared-types/src/roles.ts`:
```typescript
export enum UserRole {
  CITIZEN = 'citizen',
  SWEEPER = 'sweeper',
  TPS_OPERATOR = 'tps_operator',
  COLLECTOR = 'collector',
  DRIVER = 'driver',
  TPST_OPERATOR = 'tpst_operator',
  DLH_ADMIN = 'dlh_admin',
  SUPER_ADMIN = 'super_admin',
}

export const OTP_ROLES = [UserRole.CITIZEN, UserRole.COLLECTOR] as const;
export const PASSWORD_ROLES = [
  UserRole.SWEEPER,
  UserRole.TPS_OPERATOR,
  UserRole.DRIVER,
  UserRole.TPST_OPERATOR,
  UserRole.DLH_ADMIN,
  UserRole.SUPER_ADMIN,
] as const;
```

`packages/shared-types/src/waste.ts`:
```typescript
export enum WasteCategory {
  ORGANIC = 'organic',
  INORGANIC = 'inorganic',
  B3 = 'b3',
  RECYCLABLE = 'recyclable',
}

export enum TpsStatus {
  ACTIVE = 'active',
  FULL = 'full',
  MAINTENANCE = 'maintenance',
}

export enum TpsType {
  TPS = 'tps',
  TPS3R = 'tps3r',
  BANK_SAMPAH = 'bank_sampah',
}

export enum TransferStatus {
  PENDING = 'pending',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  VERIFIED = 'verified',
}
```

`packages/shared-types/src/complaint.ts`:
```typescript
export enum ComplaintCategory {
  ILLEGAL_DUMPING = 'illegal_dumping',
  TPS_FULL = 'tps_full',
  MISSED_PICKUP = 'missed_pickup',
  OTHER = 'other',
}

export enum ComplaintStatus {
  SUBMITTED = 'submitted',
  VERIFIED = 'verified',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}
```

`packages/shared-types/src/payment.ts`:
```typescript
export enum PaymentType {
  RETRIBUTION = 'retribution',
  BANK_SAMPAH_BUY = 'bank_sampah_buy',
  BANK_SAMPAH_SELL = 'bank_sampah_sell',
  REWARD_REDEEM = 'reward_redeem',
  PAYOUT = 'payout',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  EXPIRED = 'expired',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  QRIS = 'qris',
  VA_BCA = 'va_bca',
  VA_BNI = 'va_bni',
  VA_MANDIRI = 'va_mandiri',
  EWALLET_OVO = 'ewallet_ovo',
  EWALLET_GOPAY = 'ewallet_gopay',
  EWALLET_DANA = 'ewallet_dana',
}
```

`packages/shared-types/src/index.ts`:
```typescript
export * from './roles';
export * from './waste';
export * from './complaint';
export * from './payment';
```

**Step 2: Create constants package**

`packages/constants/package.json`:
```json
{
  "name": "@buzzr/constants",
  "version": "0.0.1",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@buzzr/shared-types": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.7.0"
  }
}
```

`packages/constants/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

`packages/constants/src/roles.ts`:
```typescript
import { UserRole } from '@buzzr/shared-types';

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.CITIZEN]: 'Masyarakat',
  [UserRole.SWEEPER]: 'Petugas Kebersihan',
  [UserRole.TPS_OPERATOR]: 'Operator TPS / Bank Sampah',
  [UserRole.COLLECTOR]: 'Pemulung / Pengepul',
  [UserRole.DRIVER]: 'Driver Truk',
  [UserRole.TPST_OPERATOR]: 'Operator TPST',
  [UserRole.DLH_ADMIN]: 'Admin DLH',
  [UserRole.SUPER_ADMIN]: 'Super Admin',
};
```

`packages/constants/src/waste-categories.ts`:
```typescript
import { WasteCategory } from '@buzzr/shared-types';

export const WASTE_CATEGORY_LABELS: Record<WasteCategory, string> = {
  [WasteCategory.ORGANIC]: 'Organik',
  [WasteCategory.INORGANIC]: 'Anorganik',
  [WasteCategory.B3]: 'B3 (Bahan Berbahaya & Beracun)',
  [WasteCategory.RECYCLABLE]: 'Daur Ulang',
};
```

`packages/constants/src/complaint-status.ts`:
```typescript
import { ComplaintStatus } from '@buzzr/shared-types';

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  [ComplaintStatus.SUBMITTED]: 'Dilaporkan',
  [ComplaintStatus.VERIFIED]: 'Diverifikasi',
  [ComplaintStatus.ASSIGNED]: 'Ditugaskan',
  [ComplaintStatus.IN_PROGRESS]: 'Dalam Proses',
  [ComplaintStatus.RESOLVED]: 'Selesai',
  [ComplaintStatus.REJECTED]: 'Ditolak',
};
```

`packages/constants/src/payment-status.ts`:
```typescript
import { PaymentStatus } from '@buzzr/shared-types';

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'Menunggu Pembayaran',
  [PaymentStatus.PAID]: 'Lunas',
  [PaymentStatus.FAILED]: 'Gagal',
  [PaymentStatus.EXPIRED]: 'Kadaluarsa',
  [PaymentStatus.REFUNDED]: 'Dikembalikan',
};
```

`packages/constants/src/index.ts`:
```typescript
export * from './roles';
export * from './waste-categories';
export * from './complaint-status';
export * from './payment-status';
```

**Step 3: Create validators package**

`packages/validators/package.json`:
```json
{
  "name": "@buzzr/validators",
  "version": "0.0.1",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@buzzr/shared-types": "workspace:*",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.2.0",
    "@types/jest": "^29.5.0"
  }
}
```

`packages/validators/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

`packages/validators/src/auth.validators.ts`:
```typescript
import { z } from 'zod';
import { UserRole } from '@buzzr/shared-types';

export const loginOtpRequestSchema = z.object({
  phone: z.string().regex(/^08\d{8,12}$/, 'Nomor HP tidak valid (format: 08xxxxxxxxxx)'),
});

export const verifyOtpSchema = z.object({
  phone: z.string().regex(/^08\d{8,12}$/),
  code: z.string().length(6, 'Kode OTP harus 6 digit'),
});

export const loginPasswordSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
});

export const registerUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().optional(),
  phone: z.string().regex(/^08\d{8,12}$/).optional(),
  role: z.nativeEnum(UserRole),
  areaId: z.string().uuid().optional(),
});

export type LoginOtpRequest = z.infer<typeof loginOtpRequestSchema>;
export type VerifyOtpRequest = z.infer<typeof verifyOtpSchema>;
export type LoginPasswordRequest = z.infer<typeof loginPasswordSchema>;
export type RegisterUserRequest = z.infer<typeof registerUserSchema>;
```

`packages/validators/src/tps.validators.ts`:
```typescript
import { z } from 'zod';
import { TpsType, TpsStatus, WasteCategory } from '@buzzr/shared-types';

export const createTpsSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.nativeEnum(TpsType),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().min(5).max(500),
  areaId: z.string().uuid(),
  capacityTons: z.number().positive(),
});

export const recordWasteSchema = z.object({
  tpsId: z.string().uuid(),
  category: z.nativeEnum(WasteCategory),
  volumeKg: z.number().positive(),
  notes: z.string().max(500).optional(),
});

export type CreateTpsRequest = z.infer<typeof createTpsSchema>;
export type RecordWasteRequest = z.infer<typeof recordWasteSchema>;
```

`packages/validators/src/index.ts`:
```typescript
export * from './auth.validators';
export * from './tps.validators';
```

**Step 4: Install all dependencies**

```bash
pnpm install
```

**Step 5: Verify packages compile**

```bash
pnpm run lint
```

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add shared-types, constants, and validators packages"
```

---

### Task 3: Docker Development Environment

**Files:**
- Create: `docker/docker-compose.dev.yml`
- Create: `docker/postgres/init.sql`

**Step 1: Create docker-compose.dev.yml**

```yaml
services:
  postgres:
    image: postgis/postgis:16-3.4
    container_name: buzzr-postgres
    environment:
      POSTGRES_USER: buzzr
      POSTGRES_PASSWORD: buzzr_secret
      POSTGRES_DB: buzzr
    ports:
      - "5432:5432"
    volumes:
      - buzzr_pgdata:/var/lib/postgresql/data
      - ./postgres/init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7-alpine
    container_name: buzzr-redis
    ports:
      - "6379:6379"
    volumes:
      - buzzr_redis:/data

  minio:
    image: minio/minio:latest
    container_name: buzzr-minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - buzzr_minio:/data

volumes:
  buzzr_pgdata:
  buzzr_redis:
  buzzr_minio:
```

**Step 2: Create init.sql**

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Public schema: tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    schema_name VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to create tenant schema with base tables
CREATE OR REPLACE FUNCTION create_tenant_schema(tenant_schema VARCHAR)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', tenant_schema);

    -- Users table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(100) NOT NULL,
            email VARCHAR(255) UNIQUE,
            phone VARCHAR(20) UNIQUE,
            password_hash VARCHAR(255),
            role VARCHAR(20) NOT NULL,
            area_id UUID,
            is_active BOOLEAN DEFAULT true,
            reward_points INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    ', tenant_schema);

    -- Areas table (hierarchical)
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.areas (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(100) NOT NULL,
            level VARCHAR(20) NOT NULL,
            parent_id UUID REFERENCES %I.areas(id),
            geometry GEOMETRY(MultiPolygon, 4326),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    ', tenant_schema, tenant_schema);

    -- TPS locations
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.tps_locations (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(100) NOT NULL,
            type VARCHAR(20) NOT NULL,
            status VARCHAR(20) DEFAULT ''active'',
            address TEXT,
            area_id UUID,
            coordinates GEOMETRY(Point, 4326),
            capacity_tons DECIMAL(10,2),
            current_load_tons DECIMAL(10,2) DEFAULT 0,
            qr_code VARCHAR(100) UNIQUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    ', tenant_schema);

    -- Vehicles
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.vehicles (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            plate_number VARCHAR(20) NOT NULL UNIQUE,
            type VARCHAR(20) NOT NULL,
            capacity_tons DECIMAL(10,2),
            driver_id UUID,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    ', tenant_schema);

    -- Schedules
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.schedules (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            vehicle_id UUID,
            driver_id UUID,
            route_name VARCHAR(100),
            schedule_type VARCHAR(20) NOT NULL,
            recurring_days INTEGER[],
            scheduled_date DATE,
            start_time TIME,
            status VARCHAR(20) DEFAULT ''pending'',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    ', tenant_schema);

    -- Schedule TPS stops (ordered stops in a route)
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.schedule_stops (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            schedule_id UUID,
            tps_id UUID,
            stop_order INTEGER NOT NULL,
            estimated_arrival TIME
        )
    ', tenant_schema);

    -- Transfer records (waste movement)
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.transfer_records (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            schedule_id UUID,
            source_tps_id UUID,
            destination_tps_id UUID,
            vehicle_id UUID,
            driver_id UUID,
            operator_id UUID,
            category VARCHAR(20) NOT NULL,
            volume_kg DECIMAL(10,2) NOT NULL,
            status VARCHAR(20) DEFAULT ''pending'',
            photo_url TEXT,
            notes TEXT,
            checkpoint_at TIMESTAMP WITH TIME ZONE,
            verified_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    ', tenant_schema);

    -- GPS tracking logs
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.gps_logs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            vehicle_id UUID,
            driver_id UUID,
            coordinates GEOMETRY(Point, 4326),
            speed DECIMAL(5,2),
            recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    ', tenant_schema);

    -- Transactions (payments)
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.transactions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID,
            type VARCHAR(30) NOT NULL,
            amount DECIMAL(15,2) NOT NULL,
            status VARCHAR(20) DEFAULT ''pending'',
            payment_method VARCHAR(30),
            external_id VARCHAR(255),
            reference_id VARCHAR(100),
            description TEXT,
            paid_at TIMESTAMP WITH TIME ZONE,
            expired_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    ', tenant_schema);

    -- Bank sampah accounts (wallet per user)
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.wallets (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID UNIQUE,
            balance DECIMAL(15,2) DEFAULT 0,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    ', tenant_schema);

    -- Complaints
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.complaints (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            reporter_id UUID,
            category VARCHAR(30) NOT NULL,
            status VARCHAR(20) DEFAULT ''submitted'',
            description TEXT,
            latitude DECIMAL(10,8),
            longitude DECIMAL(11,8),
            address TEXT,
            assigned_to UUID,
            resolved_at TIMESTAMP WITH TIME ZONE,
            rating INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    ', tenant_schema);

    -- Complaint attachments
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.complaint_attachments (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            complaint_id UUID,
            file_url TEXT NOT NULL,
            file_type VARCHAR(10),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    ', tenant_schema);

    -- Audit log
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.audit_logs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID,
            action VARCHAR(50) NOT NULL,
            entity_type VARCHAR(50),
            entity_id UUID,
            old_value JSONB,
            new_value JSONB,
            ip_address INET,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    ', tenant_schema);

    -- Notifications
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.notifications (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID,
            title VARCHAR(200) NOT NULL,
            body TEXT,
            type VARCHAR(50),
            is_read BOOLEAN DEFAULT false,
            data JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    ', tenant_schema);
END;
$$ LANGUAGE plpgsql;

-- Create a demo tenant
INSERT INTO public.tenants (name, slug, schema_name) VALUES ('DLH Demo', 'dlh-demo', 'dlh_demo');
SELECT create_tenant_schema('dlh_demo');
```

**Step 3: Start Docker services and verify**

```bash
cd /opt/buzzr && docker compose -f docker/docker-compose.dev.yml up -d
```

Wait for services, then verify:

```bash
docker exec buzzr-postgres psql -U buzzr -d buzzr -c "SELECT slug FROM public.tenants;"
docker exec buzzr-postgres psql -U buzzr -d buzzr -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'dlh_demo' ORDER BY table_name;"
```

Expected: tenant `dlh-demo` exists, and all tables in `dlh_demo` schema are listed.

**Step 4: Commit**

```bash
git add docker/
git commit -m "feat: add Docker dev environment with PostgreSQL/PostGIS, Redis, MinIO"
```

---

### Task 4: Scaffold NestJS API App

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/tsconfig.build.json`
- Create: `apps/api/nest-cli.json`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/src/config/app.config.ts`
- Create: `apps/api/src/config/database.config.ts`
- Create: `apps/api/src/database/database.module.ts`
- Create: `apps/api/src/database/tenant.middleware.ts`
- Create: `apps/api/src/common/decorators/tenant.decorator.ts`
- Create: `apps/api/test/jest-e2e.json`

**Step 1: Create package.json for API**

```json
{
  "name": "@buzzr/api",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "nest build",
    "dev": "nest start --watch",
    "start": "node dist/main",
    "start:prod": "node dist/main",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:e2e": "jest --config test/jest-e2e.json",
    "lint": "eslint \"{src,test}/**/*.ts\" --fix"
  },
  "dependencies": {
    "@buzzr/shared-types": "workspace:*",
    "@buzzr/constants": "workspace:*",
    "@buzzr/validators": "workspace:*",
    "@nestjs/common": "^10.4.0",
    "@nestjs/core": "^10.4.0",
    "@nestjs/platform-express": "^10.4.0",
    "@nestjs/config": "^3.3.0",
    "@nestjs/typeorm": "^10.0.0",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/bullmq": "^10.2.0",
    "@nestjs/websockets": "^10.4.0",
    "@nestjs/platform-socket.io": "^10.4.0",
    "typeorm": "^0.3.20",
    "pg": "^8.13.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "bcrypt": "^5.1.1",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "bullmq": "^5.30.0",
    "ioredis": "^5.4.0",
    "minio": "^8.0.0",
    "zod": "^3.24.0",
    "rxjs": "^7.8.0",
    "reflect-metadata": "^0.2.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.4.0",
    "@nestjs/schematics": "^10.2.0",
    "@nestjs/testing": "^10.4.0",
    "@types/bcrypt": "^5.0.0",
    "@types/express": "^5.0.0",
    "@types/jest": "^29.5.0",
    "@types/node": "^22.0.0",
    "@types/passport-jwt": "^4.0.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.2.0",
    "typescript": "^5.7.0",
    "source-map-support": "^0.5.21"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": { "^.+\\.ts$": "ts-jest" },
    "collectCoverageFrom": ["**/*.ts", "!**/index.ts", "!main.ts"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node",
    "moduleNameMapper": {
      "^@/(.*)$": "<rootDir>/$1"
    }
  }
}
```

**Step 2: Create tsconfig files**

`apps/api/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "module": "commonjs",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "paths": {
      "@/*": ["src/*"],
      "@buzzr/shared-types": ["../../packages/shared-types/src"],
      "@buzzr/constants": ["../../packages/constants/src"],
      "@buzzr/validators": ["../../packages/validators/src"]
    }
  },
  "include": ["src"],
  "exclude": ["dist", "node_modules"]
}
```

`apps/api/tsconfig.build.json`:
```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "dist", "test", "**/*spec.ts"]
}
```

`apps/api/nest-cli.json`:
```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

**Step 3: Create config files**

`apps/api/src/config/app.config.ts`:
```typescript
export const appConfig = () => ({
  port: parseInt(process.env.APP_PORT || '3000', 10),
  env: process.env.APP_ENV || 'development',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'change-me',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
});
```

`apps/api/src/config/database.config.ts`:
```typescript
export const databaseConfig = () => ({
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'buzzr',
    password: process.env.DATABASE_PASSWORD || 'buzzr_secret',
    name: process.env.DATABASE_NAME || 'buzzr',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
});
```

**Step 4: Create database module with tenant middleware**

`apps/api/src/database/database.module.ts`:
```typescript
import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('database.host'),
        port: config.get('database.port'),
        username: config.get('database.username'),
        password: config.get('database.password'),
        database: config.get('database.name'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
```

`apps/api/src/database/tenant.middleware.ts`:
```typescript
import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';

declare global {
  namespace Express {
    interface Request {
      tenantSchema?: string;
      tenantId?: string;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly dataSource: DataSource) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const tenantSlug = req.headers['x-tenant-slug'] as string;

    if (!tenantSlug) {
      throw new BadRequestException('Missing X-Tenant-Slug header');
    }

    const result = await this.dataSource.query(
      'SELECT id, schema_name FROM public.tenants WHERE slug = $1 AND is_active = true',
      [tenantSlug],
    );

    if (!result.length) {
      throw new BadRequestException(`Tenant "${tenantSlug}" not found`);
    }

    req.tenantId = result[0].id;
    req.tenantSchema = result[0].schema_name;

    await this.dataSource.query(`SET search_path TO '${result[0].schema_name}', public`);

    next();
  }
}
```

`apps/api/src/common/decorators/tenant.decorator.ts`:
```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const TenantSchema = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantSchema;
  },
);

export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantId;
  },
);
```

**Step 5: Create app.module.ts and main.ts**

`apps/api/src/app.module.ts`:
```typescript
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './config/app.config';
import { databaseConfig } from './config/database.config';
import { DatabaseModule } from './database/database.module';
import { TenantMiddleware } from './database/tenant.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      envFilePath: '../../.env',
    }),
    DatabaseModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude('health', 'api/v1/auth/super-admin/(.*)')
      .forRoutes('*');
  }
}
```

`apps/api/src/main.ts`:
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.APP_PORT || 3000;
  await app.listen(port);
  console.log(`Buzzr API running on port ${port}`);
}
bootstrap();
```

**Step 6: Create e2e test config**

`apps/api/test/jest-e2e.json`:
```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": { "^.+\\.ts$": "ts-jest" },
  "moduleNameMapper": {
    "^@/(.*)$": "<rootDir>/../src/$1"
  }
}
```

**Step 7: Install dependencies and verify build**

```bash
cd /opt/buzzr && pnpm install && pnpm run build --filter=@buzzr/api
```

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold NestJS API with multi-tenant middleware"
```

---

## Phase 2: Auth Module

### Task 5: Auth Module — JWT & Password Login

**Files:**
- Create: `apps/api/src/modules/auth/auth.module.ts`
- Create: `apps/api/src/modules/auth/auth.controller.ts`
- Create: `apps/api/src/modules/auth/auth.service.ts`
- Create: `apps/api/src/modules/auth/strategies/jwt.strategy.ts`
- Create: `apps/api/src/modules/auth/guards/jwt-auth.guard.ts`
- Create: `apps/api/src/modules/auth/guards/roles.guard.ts`
- Create: `apps/api/src/modules/auth/decorators/roles.decorator.ts`
- Create: `apps/api/src/modules/auth/dto/login.dto.ts`
- Test: `apps/api/src/modules/auth/auth.service.spec.ts`

**Step 1: Write the failing test**

`apps/api/src/modules/auth/auth.service.spec.ts`:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let dataSource: Partial<DataSource>;
  let jwtService: Partial<JwtService>;

  beforeEach(async () => {
    dataSource = {
      query: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DataSource, useValue: dataSource },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                'jwt.accessSecret': 'test-secret',
                'jwt.refreshSecret': 'test-refresh',
                'jwt.accessExpiresIn': '15m',
                'jwt.refreshExpiresIn': '7d',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('loginWithPassword', () => {
    it('should return tokens for valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      (dataSource.query as jest.Mock).mockResolvedValue([
        { id: 'user-1', name: 'Admin', email: 'admin@test.com', role: 'dlh_admin', password_hash: hashedPassword },
      ]);

      const result = await service.loginWithPassword('dlh_demo', 'admin@test.com', 'password123');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('admin@test.com');
    });

    it('should throw for invalid credentials', async () => {
      (dataSource.query as jest.Mock).mockResolvedValue([]);

      await expect(
        service.loginWithPassword('dlh_demo', 'wrong@test.com', 'password'),
      ).rejects.toThrow('Email atau password salah');
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd /opt/buzzr && pnpm --filter @buzzr/api test -- --testPathPattern=auth.service.spec
```
Expected: FAIL — `Cannot find module './auth.service'`

**Step 3: Write DTOs**

`apps/api/src/modules/auth/dto/login.dto.ts`:
```typescript
import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class LoginPasswordDto {
  @IsEmail({}, { message: 'Email tidak valid' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  password: string;
}

export class RequestOtpDto {
  @Matches(/^08\d{8,12}$/, { message: 'Nomor HP tidak valid' })
  phone: string;
}

export class VerifyOtpDto {
  @Matches(/^08\d{8,12}$/)
  phone: string;

  @IsString()
  @MinLength(6)
  code: string;
}
```

**Step 4: Write auth.service.ts**

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async loginWithPassword(tenantSchema: string, email: string, password: string) {
    const users = await this.dataSource.query(
      `SELECT id, name, email, role, password_hash FROM "${tenantSchema}".users WHERE email = $1 AND is_active = true`,
      [email],
    );

    if (!users.length) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau password salah');
    }

    return this.generateTokens(user, tenantSchema);
  }

  async generateTokens(user: { id: string; name: string; email?: string; phone?: string; role: string }, tenantSchema: string) {
    const payload = { sub: user.id, role: user.role, tenant: tenantSchema };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.accessSecret'),
        expiresIn: this.configService.get('jwt.accessExpiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiresIn'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    };
  }
}
```

**Step 5: Run test to verify it passes**

```bash
cd /opt/buzzr && pnpm --filter @buzzr/api test -- --testPathPattern=auth.service.spec
```
Expected: PASS

**Step 6: Write JWT strategy, guards, and decorators**

`apps/api/src/modules/auth/strategies/jwt.strategy.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.accessSecret'),
    });
  }

  async validate(payload: { sub: string; role: string; tenant: string }) {
    return { userId: payload.sub, role: payload.role, tenantSchema: payload.tenant };
  }
}
```

`apps/api/src/modules/auth/guards/jwt-auth.guard.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

`apps/api/src/modules/auth/guards/roles.guard.ts`:
```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@buzzr/shared-types';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

`apps/api/src/modules/auth/decorators/roles.decorator.ts`:
```typescript
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@buzzr/shared-types';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

**Step 7: Write auth.controller.ts**

```typescript
import { Controller, Post, Body, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginPasswordDto } from './dto/login.dto';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async loginWithPassword(@Body() dto: LoginPasswordDto, @Req() req: Request) {
    return this.authService.loginWithPassword(req.tenantSchema!, dto.email, dto.password);
  }
}
```

**Step 8: Write auth.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

**Step 9: Register AuthModule in AppModule**

Add to `apps/api/src/app.module.ts` imports:
```typescript
import { AuthModule } from './modules/auth/auth.module';
// Add AuthModule to imports array
```

**Step 10: Run all tests**

```bash
cd /opt/buzzr && pnpm --filter @buzzr/api test
```
Expected: All PASS

**Step 11: Commit**

```bash
git add -A
git commit -m "feat: add auth module with JWT login and RBAC"
```

---

### Task 6: Auth Module — OTP Login

**Files:**
- Create: `apps/api/src/modules/auth/otp.service.ts`
- Create: `apps/api/src/modules/auth/otp.service.spec.ts`

**Step 1: Write the failing test**

`apps/api/src/modules/auth/otp.service.spec.ts`:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { OtpService } from './otp.service';
import Redis from 'ioredis';

describe('OtpService', () => {
  let service: OtpService;
  let redis: Record<string, jest.Mock>;

  beforeEach(async () => {
    redis = {
      set: jest.fn().mockResolvedValue('OK'),
      get: jest.fn(),
      del: jest.fn().mockResolvedValue(1),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: 'REDIS_CLIENT', useValue: redis },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
  });

  describe('generateOtp', () => {
    it('should generate a 6-digit OTP and store in Redis', async () => {
      const code = await service.generateOtp('08123456789');

      expect(code).toMatch(/^\d{6}$/);
      expect(redis.set).toHaveBeenCalledWith(
        'otp:08123456789',
        expect.any(String),
        'EX',
        300,
      );
    });
  });

  describe('verifyOtp', () => {
    it('should return true for valid OTP', async () => {
      redis.get.mockResolvedValue('123456');

      const result = await service.verifyOtp('08123456789', '123456');

      expect(result).toBe(true);
      expect(redis.del).toHaveBeenCalledWith('otp:08123456789');
    });

    it('should return false for invalid OTP', async () => {
      redis.get.mockResolvedValue('123456');

      const result = await service.verifyOtp('08123456789', '000000');

      expect(result).toBe(false);
    });

    it('should return false for expired OTP', async () => {
      redis.get.mockResolvedValue(null);

      const result = await service.verifyOtp('08123456789', '123456');

      expect(result).toBe(false);
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd /opt/buzzr && pnpm --filter @buzzr/api test -- --testPathPattern=otp.service.spec
```
Expected: FAIL

**Step 3: Write OTP service**

`apps/api/src/modules/auth/otp.service.ts`:
```typescript
import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class OtpService {
  private readonly OTP_TTL_SECONDS = 300; // 5 minutes

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async generateOtp(phone: string): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redis.set(`otp:${phone}`, code, 'EX', this.OTP_TTL_SECONDS);
    return code;
  }

  async verifyOtp(phone: string, code: string): Promise<boolean> {
    const stored = await this.redis.get(`otp:${phone}`);

    if (!stored || stored !== code) {
      return false;
    }

    await this.redis.del(`otp:${phone}`);
    return true;
  }
}
```

**Step 4: Run test to verify it passes**

```bash
cd /opt/buzzr && pnpm --filter @buzzr/api test -- --testPathPattern=otp.service.spec
```
Expected: PASS

**Step 5: Add OTP endpoints to auth controller and service**

Add to `auth.service.ts`:
```typescript
async requestOtp(phone: string): Promise<{ message: string }> {
  const code = await this.otpService.generateOtp(phone);
  // TODO: Send via Fonnte/Zenziva SMS gateway
  console.log(`OTP for ${phone}: ${code}`); // Dev only
  return { message: 'Kode OTP telah dikirim' };
}

async loginWithOtp(tenantSchema: string, phone: string, code: string) {
  const isValid = await this.otpService.verifyOtp(phone, code);
  if (!isValid) {
    throw new UnauthorizedException('Kode OTP tidak valid atau sudah kadaluarsa');
  }

  let users = await this.dataSource.query(
    `SELECT id, name, phone, role FROM "${tenantSchema}".users WHERE phone = $1 AND is_active = true`,
    [phone],
  );

  if (!users.length) {
    // Auto-register citizen
    const result = await this.dataSource.query(
      `INSERT INTO "${tenantSchema}".users (name, phone, role) VALUES ($1, $2, 'citizen') RETURNING id, name, phone, role`,
      [`User ${phone}`, phone],
    );
    users = result;
  }

  return this.generateTokens(users[0], tenantSchema);
}
```

Add to `auth.controller.ts`:
```typescript
@Post('otp/request')
async requestOtp(@Body() dto: RequestOtpDto) {
  return this.authService.requestOtp(dto.phone);
}

@Post('otp/verify')
async verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: Request) {
  return this.authService.loginWithOtp(req.tenantSchema!, dto.phone, dto.code);
}
```

**Step 6: Run all tests**

```bash
cd /opt/buzzr && pnpm --filter @buzzr/api test
```
Expected: All PASS

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add OTP authentication for citizens"
```

---

## Phase 3: Core Domain Modules

### Task 7: Tenant Module

**Files:**
- Create: `apps/api/src/modules/tenant/tenant.module.ts`
- Create: `apps/api/src/modules/tenant/tenant.controller.ts`
- Create: `apps/api/src/modules/tenant/tenant.service.ts`
- Create: `apps/api/src/modules/tenant/tenant.service.spec.ts`
- Create: `apps/api/src/modules/tenant/dto/create-tenant.dto.ts`

**Step 1: Write the failing test**

`apps/api/src/modules/tenant/tenant.service.spec.ts`:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { TenantService } from './tenant.service';
import { DataSource } from 'typeorm';

describe('TenantService', () => {
  let service: TenantService;
  let dataSource: { query: jest.Mock };

  beforeEach(async () => {
    dataSource = { query: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
  });

  describe('createTenant', () => {
    it('should create a tenant and its schema', async () => {
      dataSource.query
        .mockResolvedValueOnce([{ id: 'tenant-1', name: 'DLH Bekasi', slug: 'dlh-bekasi', schema_name: 'dlh_bekasi' }])
        .mockResolvedValueOnce(undefined);

      const result = await service.createTenant({ name: 'DLH Bekasi', slug: 'dlh-bekasi' });

      expect(result.slug).toBe('dlh-bekasi');
      expect(dataSource.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('listTenants', () => {
    it('should return all active tenants', async () => {
      dataSource.query.mockResolvedValue([
        { id: '1', name: 'DLH Bekasi', slug: 'dlh-bekasi', is_active: true },
      ]);

      const result = await service.listTenants();

      expect(result).toHaveLength(1);
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd /opt/buzzr && pnpm --filter @buzzr/api test -- --testPathPattern=tenant.service.spec
```

**Step 3: Write implementation**

`apps/api/src/modules/tenant/dto/create-tenant.dto.ts`:
```typescript
import { IsString, Matches, MinLength, MaxLength } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug hanya boleh huruf kecil, angka, dan strip' })
  @MinLength(3)
  @MaxLength(50)
  slug: string;
}
```

`apps/api/src/modules/tenant/tenant.service.ts`:
```typescript
import { Injectable, ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateTenantDto } from './dto/create-tenant.dto';

@Injectable()
export class TenantService {
  constructor(private readonly dataSource: DataSource) {}

  async createTenant(dto: CreateTenantDto) {
    const schemaName = dto.slug.replace(/-/g, '_');

    try {
      const result = await this.dataSource.query(
        `INSERT INTO public.tenants (name, slug, schema_name) VALUES ($1, $2, $3) RETURNING *`,
        [dto.name, dto.slug, schemaName],
      );

      await this.dataSource.query(`SELECT create_tenant_schema($1)`, [schemaName]);

      return result[0];
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException('Tenant dengan slug ini sudah ada');
      }
      throw error;
    }
  }

  async listTenants() {
    return this.dataSource.query(
      'SELECT id, name, slug, is_active, created_at FROM public.tenants ORDER BY name',
    );
  }
}
```

`apps/api/src/modules/tenant/tenant.controller.ts`:
```typescript
import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@buzzr/shared-types';

@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  create(@Body() dto: CreateTenantDto) {
    return this.tenantService.createTenant(dto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  list() {
    return this.tenantService.listTenants();
  }
}
```

`apps/api/src/modules/tenant/tenant.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';

@Module({
  controllers: [TenantController],
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}
```

**Step 4: Run test to verify it passes**

```bash
cd /opt/buzzr && pnpm --filter @buzzr/api test -- --testPathPattern=tenant.service.spec
```

**Step 5: Register TenantModule in AppModule and commit**

```bash
git add -A
git commit -m "feat: add tenant management module"
```

---

### Task 8: User Module

**Files:**
- Create: `apps/api/src/modules/user/user.module.ts`
- Create: `apps/api/src/modules/user/user.controller.ts`
- Create: `apps/api/src/modules/user/user.service.ts`
- Create: `apps/api/src/modules/user/user.service.spec.ts`
- Create: `apps/api/src/modules/user/dto/create-user.dto.ts`

Follow TDD pattern: write failing test → implement → verify → commit.

Key behaviors:
- CRUD users within tenant schema
- Hash password on creation for PASSWORD_ROLES
- Filter by role, area
- Super admin can create DLH admins

**Commit message:** `feat: add user management module`

---

### Task 9: Area Module

**Files:**
- Create: `apps/api/src/modules/area/area.module.ts`
- Create: `apps/api/src/modules/area/area.controller.ts`
- Create: `apps/api/src/modules/area/area.service.ts`
- Create: `apps/api/src/modules/area/area.service.spec.ts`
- Create: `apps/api/src/modules/area/dto/create-area.dto.ts`

Key behaviors:
- CRUD hierarchical areas (provinsi → kota → kecamatan → kelurahan → rw/rt)
- Query children by parent_id
- GeoJSON support for area boundaries via PostGIS

**Commit message:** `feat: add area hierarchy module`

---

### Task 10: TPS Module

**Files:**
- Create: `apps/api/src/modules/tps/tps.module.ts`
- Create: `apps/api/src/modules/tps/tps.controller.ts`
- Create: `apps/api/src/modules/tps/tps.service.ts`
- Create: `apps/api/src/modules/tps/tps.service.spec.ts`
- Create: `apps/api/src/modules/tps/dto/create-tps.dto.ts`
- Create: `apps/api/src/modules/tps/dto/record-waste.dto.ts`

Key behaviors:
- CRUD TPS locations with GPS coordinates
- Record waste in/out per category
- Auto-update current_load_tons
- Generate unique QR code per TPS
- Query nearby TPS via PostGIS `ST_DWithin`
- Alert when current_load approaches capacity

**Commit message:** `feat: add TPS and bank sampah module`

---

## Phase 4: Operations Modules

### Task 11: Fleet Module

**Files:**
- Create: `apps/api/src/modules/fleet/fleet.module.ts`
- Create: `apps/api/src/modules/fleet/fleet.controller.ts`
- Create: `apps/api/src/modules/fleet/fleet.service.ts`
- Create: `apps/api/src/modules/fleet/fleet.service.spec.ts`
- Create: `apps/api/src/modules/fleet/dto/create-vehicle.dto.ts`

Key behaviors:
- CRUD vehicles (truk, gerobak, motor)
- Assign/unassign driver to vehicle
- Vehicle availability status

**Commit message:** `feat: add fleet management module`

---

### Task 12: Schedule Module

**Files:**
- Create: `apps/api/src/modules/schedule/schedule.module.ts`
- Create: `apps/api/src/modules/schedule/schedule.controller.ts`
- Create: `apps/api/src/modules/schedule/schedule.service.ts`
- Create: `apps/api/src/modules/schedule/schedule.service.spec.ts`
- Create: `apps/api/src/modules/schedule/dto/create-schedule.dto.ts`

Key behaviors:
- Create recurring schedules (recurring_days: [1,3,5] = Mon/Wed/Fri)
- Create on-demand schedules
- Add ordered TPS stops to schedule
- Query today's schedules for a driver
- BullMQ job to generate daily schedule instances from recurring templates

**Commit message:** `feat: add schedule and route management module`

---

### Task 13: GPS Tracking Module (WebSocket)

**Files:**
- Create: `apps/api/src/modules/tracking/tracking.module.ts`
- Create: `apps/api/src/modules/tracking/tracking.gateway.ts`
- Create: `apps/api/src/modules/tracking/tracking.service.ts`
- Create: `apps/api/src/modules/tracking/tracking.service.spec.ts`

Key behaviors:
- WebSocket gateway for real-time GPS updates from drivers
- Store GPS logs in database
- Publish to Redis pub/sub for dashboard subscribers
- REST endpoint for GPS history by vehicle/date range
- Rate limit GPS updates to 1 per 5 seconds per vehicle

**Commit message:** `feat: add real-time GPS tracking via WebSocket`

---

### Task 14: Transfer & Manifest Module

**Files:**
- Create: `apps/api/src/modules/transfer/transfer.module.ts`
- Create: `apps/api/src/modules/transfer/transfer.controller.ts`
- Create: `apps/api/src/modules/transfer/transfer.service.ts`
- Create: `apps/api/src/modules/transfer/transfer.service.spec.ts`
- Create: `apps/api/src/modules/transfer/dto/create-transfer.dto.ts`
- Create: `apps/api/src/modules/transfer/dto/checkpoint.dto.ts`

Key behaviors:
- Create transfer record when driver picks up waste at TPS (checkpoint)
- Record: source TPS, volume, category, photo, timestamp
- Create manifest for entire trip (group of transfer records)
- TPST operator verifies manifest on arrival
- Update TPS current_load on pickup
- Status flow: pending → in_transit → delivered → verified

**Commit message:** `feat: add waste transfer and manifest module`

---

## Phase 5: Financial Modules

### Task 15: Payment Module — Retribusi

**Files:**
- Create: `apps/api/src/modules/payment/payment.module.ts`
- Create: `apps/api/src/modules/payment/payment.controller.ts`
- Create: `apps/api/src/modules/payment/payment.service.ts`
- Create: `apps/api/src/modules/payment/payment.service.spec.ts`
- Create: `apps/api/src/modules/payment/xendit.service.ts`
- Create: `apps/api/src/modules/payment/dto/create-invoice.dto.ts`

Key behaviors:
- Generate monthly retribution invoices (BullMQ cron job)
- Create payment via Xendit (VA, QRIS, e-wallet)
- Webhook endpoint to receive payment confirmation
- Webhook signature verification
- Idempotency key per transaction
- Query payment status, overdue invoices

**Commit message:** `feat: add retribution payment module with Xendit`

---

### Task 16: Bank Sampah & Wallet Module

**Files:**
- Create: `apps/api/src/modules/payment/wallet.service.ts`
- Create: `apps/api/src/modules/payment/wallet.service.spec.ts`
- Create: `apps/api/src/modules/payment/bank-sampah.controller.ts`

Key behaviors:
- Each user has a wallet (balance)
- TPS operator records waste sale → credit wallet
- User requests payout → debit wallet → trigger Xendit disbursement
- Transaction history per user
- Master price list for recyclable categories (per kg)

**Commit message:** `feat: add bank sampah wallet and payout`

---

### Task 17: Reward Points Module

**Files:**
- Create: `apps/api/src/modules/payment/reward.service.ts`
- Create: `apps/api/src/modules/payment/reward.service.spec.ts`

Key behaviors:
- Award points for: complaint resolved, waste bank participation, on-time retribution
- Configurable point values per action
- Redeem points to wallet balance
- Points history per user

**Commit message:** `feat: add reward points system`

---

## Phase 6: Community & Notification

### Task 18: Complaint Module

**Files:**
- Create: `apps/api/src/modules/complaint/complaint.module.ts`
- Create: `apps/api/src/modules/complaint/complaint.controller.ts`
- Create: `apps/api/src/modules/complaint/complaint.service.ts`
- Create: `apps/api/src/modules/complaint/complaint.service.spec.ts`
- Create: `apps/api/src/modules/complaint/dto/create-complaint.dto.ts`

Key behaviors:
- Citizen creates complaint with photo + GPS
- Upload photo to MinIO, store URL
- Admin assigns to nearest petugas
- Status workflow: submitted → verified → assigned → in_progress → resolved
- Citizen rates resolution (1-5)
- Award reward points on resolution

**Commit message:** `feat: add complaint reporting and workflow module`

---

### Task 19: Notification Module

**Files:**
- Create: `apps/api/src/modules/notification/notification.module.ts`
- Create: `apps/api/src/modules/notification/notification.service.ts`
- Create: `apps/api/src/modules/notification/notification.controller.ts`
- Create: `apps/api/src/modules/notification/fcm.service.ts`

Key behaviors:
- Store in-app notifications in DB
- Send push via FCM
- Mark as read
- Query unread count
- BullMQ consumer for async notification dispatch

**Commit message:** `feat: add notification module with FCM push`

---

## Phase 7: Reporting & Dashboard API

### Task 20: Report Module

**Files:**
- Create: `apps/api/src/modules/report/report.module.ts`
- Create: `apps/api/src/modules/report/report.controller.ts`
- Create: `apps/api/src/modules/report/report.service.ts`

Key behaviors:
- Daily/monthly waste volume aggregation by zone, TPS, category
- Driver performance: trips completed, on-time rate
- Petugas performance: tasks completed
- Retribution collection rate, overdue amount
- Complaint resolution rate, average resolution time
- Heatmap data: waste volume per coordinate
- Export to Excel (using exceljs)

**Commit message:** `feat: add reporting and analytics API`

---

## Phase 8: Admin Web Dashboard

### Task 21: Scaffold React Admin App

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/index.html`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/App.tsx`
- Create: `apps/web/src/services/api.ts`
- Create: `apps/web/src/stores/auth.store.ts`

**Step 1: Create package.json**

```json
{
  "name": "@buzzr/web",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@buzzr/shared-types": "workspace:*",
    "@buzzr/constants": "workspace:*",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0",
    "antd": "^5.23.0",
    "@ant-design/icons": "^5.6.0",
    "axios": "^1.7.0",
    "zustand": "^5.0.0",
    "dayjs": "^1.11.0",
    "recharts": "^2.15.0",
    "leaflet": "^1.9.0",
    "react-leaflet": "^5.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/leaflet": "^1.9.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0"
  }
}
```

**Step 2: Setup Vite, main entry, API client with Axios interceptor for auth + tenant header**

**Step 3: Setup Zustand auth store with login/logout/token refresh**

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: scaffold React admin dashboard"
```

---

### Task 22: Admin Dashboard Pages

Build these pages using Ant Design:

1. **Login page** — email/password form
2. **Dashboard page** — summary cards (total waste today, active drivers, pending complaints, collection rate) + charts (Recharts)
3. **TPS Management** — table with CRUD, map view (Leaflet)
4. **Fleet Management** — vehicle list, driver assignment
5. **Schedule Management** — calendar view, route editor
6. **Live Tracking** — real-time map with driver positions (WebSocket)
7. **Complaints** — list with status filters, assign to petugas
8. **Payments** — retribution list, overdue filters, collection stats
9. **Users** — user management per role
10. **Reports** — date range picker, export Excel/PDF

Each page is a separate commit:
```bash
git commit -m "feat(web): add [page-name] page"
```

---

## Phase 9: Mobile App

### Task 23: Scaffold React Native (Expo) App

**Files:**
- Create: `apps/mobile/package.json`
- Create: `apps/mobile/app.json`
- Create: `apps/mobile/tsconfig.json`
- Create: `apps/mobile/App.tsx`
- Create: `apps/mobile/src/navigation/RootNavigator.tsx`
- Create: `apps/mobile/src/services/api.ts`
- Create: `apps/mobile/src/stores/auth.store.ts`

**Step 1: Initialize Expo project**

```bash
cd /opt/buzzr/apps && npx create-expo-app@latest mobile --template blank-typescript
```

**Step 2: Install dependencies**

```bash
cd /opt/buzzr/apps/mobile && npx expo install react-native-maps expo-location expo-camera expo-image-picker expo-secure-store @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context
pnpm add axios zustand
```

**Step 3: Setup role-based navigation**

```typescript
// Based on user.role, show different tab navigators:
// citizen → Home, Report, Payments, Profile
// driver → Schedule, Tracking, Manifest, Profile
// sweeper → Tasks, Attendance, Profile
// tps_operator → Waste In/Out, Bank Sampah, Profile
// collector → Deposit, Wallet, Profile
// tpst_operator → Receive, Verify, Profile
```

**Step 4: Setup API client with secure token storage (expo-secure-store)**

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: scaffold React Native mobile app with role-based navigation"
```

---

### Task 24: Mobile — Citizen Screens

Build screens:
1. **Home** — jadwal angkut, notifikasi terbaru, poin reward
2. **Lapor** — camera + GPS + category picker → submit complaint
3. **Pembayaran** — tagihan retribusi, riwayat bayar, bayar via deep link
4. **Profil** — data diri, poin reward, riwayat laporan

**Commit message:** `feat(mobile): add citizen screens`

---

### Task 25: Mobile — Driver Screens

Build screens:
1. **Jadwal Hari Ini** — list of scheduled routes with TPS stops
2. **Tracking** — start/stop GPS tracking, auto-send location
3. **Checkpoint** — scan QR at TPS, record volume, take photo
4. **Manifest** — view current trip manifest, submit to TPST

**Commit message:** `feat(mobile): add driver screens`

---

### Task 26: Mobile — TPS Operator Screens

Build screens:
1. **Sampah Masuk** — record incoming waste by category + weight
2. **Sampah Keluar** — record outgoing waste to truck
3. **Bank Sampah** — buy recyclables from pemulung, update wallet
4. **Status TPS** — current load, capacity bar

**Commit message:** `feat(mobile): add TPS operator screens`

---

### Task 27: Mobile — Other Role Screens

Build remaining role screens:
1. **Sweeper** — daily task checklist, GPS attendance, volume recording
2. **Collector** — deposit waste at bank sampah, wallet balance, payout request
3. **TPST Operator** — receive manifest, verify delivery, record volume

**Commit message:** `feat(mobile): add sweeper, collector, and TPST operator screens`

---

## Phase 10: Integration & Polish

### Task 28: File Upload Service (MinIO)

**Files:**
- Create: `apps/api/src/modules/upload/upload.module.ts`
- Create: `apps/api/src/modules/upload/upload.controller.ts`
- Create: `apps/api/src/modules/upload/upload.service.ts`

Key behaviors:
- Upload file to MinIO bucket (per tenant)
- Validate file type (images only for complaints/checkpoints)
- Max file size 5MB
- Return presigned URL for download
- Used by complaint and transfer modules

**Commit message:** `feat: add file upload service with MinIO`

---

### Task 29: Seed Data & Demo Setup

**Files:**
- Create: `apps/api/src/database/seeds/demo.seed.ts`

Key behaviors:
- Create demo tenant (dlh-demo)
- Seed sample areas (Jakarta hierarchy)
- Seed sample TPS locations with coordinates
- Seed sample users for each role
- Seed sample vehicles and schedules
- Script: `pnpm run db:seed`

**Commit message:** `feat: add seed data for demo environment`

---

### Task 30: Health Check & Production Config

**Files:**
- Create: `apps/api/src/health/health.controller.ts`
- Create: `docker/docker-compose.yml` (production)
- Create: `docker/nginx/nginx.conf`
- Create: `docker/api/Dockerfile`
- Create: `docker/web/Dockerfile`

Key behaviors:
- `/health` endpoint checking DB, Redis, MinIO connectivity
- Production Docker Compose with Nginx reverse proxy
- API served behind `/api/v1`
- Web dashboard served at `/`
- Nginx handles SSL termination

**Commit message:** `feat: add health check and production Docker setup`

---

## Running the Project

### Development

```bash
# Start infrastructure
docker compose -f docker/docker-compose.dev.yml up -d

# Install dependencies
pnpm install

# Run API
pnpm run dev --filter=@buzzr/api

# Run Web dashboard
pnpm run dev --filter=@buzzr/web

# Run Mobile app
cd apps/mobile && npx expo start

# Run all tests
pnpm run test

# Run single test file
pnpm --filter @buzzr/api test -- --testPathPattern=<pattern>
```

### Key API Headers

All tenant-scoped requests require:
```
X-Tenant-Slug: dlh-demo
Authorization: Bearer <jwt-token>
```

---

## Task Dependency Graph

```
Task 1 (Monorepo) → Task 2 (Packages) → Task 3 (Docker) → Task 4 (NestJS scaffold)
  → Task 5 (Auth JWT) → Task 6 (Auth OTP)
  → Task 7 (Tenant) → Task 8 (User) → Task 9 (Area) → Task 10 (TPS)
  → Task 11 (Fleet) → Task 12 (Schedule) → Task 13 (GPS Tracking) → Task 14 (Transfer)
  → Task 15 (Payment) → Task 16 (Wallet) → Task 17 (Reward)
  → Task 18 (Complaint) → Task 19 (Notification)
  → Task 20 (Report)
  → Task 21 (Web scaffold) → Task 22 (Web pages)
  → Task 23 (Mobile scaffold) → Task 24-27 (Mobile screens)
  → Task 28 (Upload) → Task 29 (Seed) → Task 30 (Production)
```

Tasks 11-14 can be parallelized. Tasks 15-17 can be parallelized. Tasks 24-27 can be parallelized.
