/**
 * Demo Seed Script
 *
 * Seeds the database with demo data for the DLH Demo tenant.
 * Safe to run multiple times (idempotent).
 *
 * Usage:
 *   pnpm run db:seed          (from repo root)
 *   npx ts-node src/database/seeds/demo.seed.ts  (from apps/api)
 */

import { Client } from 'pg';
import * as bcrypt from 'bcrypt';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const DB_CONFIG = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  user: process.env.DATABASE_USER || 'buzzr',
  password: process.env.DATABASE_PASSWORD || 'buzzr_secret',
  database: process.env.DATABASE_NAME || 'buzzr',
};

const TENANT = {
  name: 'DLH Demo',
  slug: 'dlh-demo',
  schema_name: 'dlh_demo',
};

const BCRYPT_ROUNDS = 10;
const DEMO_PASSWORD = 'demo1234';

// ---------------------------------------------------------------------------
// Seed Data Definitions
// ---------------------------------------------------------------------------

interface AreaDef {
  name: string;
  level: number;
  children?: AreaDef[];
}

const AREAS: AreaDef[] = [
  {
    name: 'DKI Jakarta',
    level: 1, // Provinsi
    children: [
      {
        name: 'Jakarta Selatan',
        level: 2, // Kota
        children: [
          {
            name: 'Kebayoran Baru',
            level: 3, // Kecamatan
            children: [
              { name: 'Senayan', level: 4 },
              { name: 'Gunung', level: 4 },
              { name: 'Melawai', level: 4 },
            ],
          },
          {
            name: 'Pasar Minggu',
            level: 3, // Kecamatan
            children: [
              { name: 'Cilandak', level: 4 },
              { name: 'Ragunan', level: 4 },
            ],
          },
        ],
      },
    ],
  },
];

interface UserDef {
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  area_name: string; // resolved to area_id at insert time
}

const USERS: UserDef[] = [
  {
    name: 'Super Admin',
    email: 'admin@buzzr.id',
    phone: null,
    role: 'super_admin',
    area_name: 'DKI Jakarta',
  },
  {
    name: 'Admin DLH Jakarta',
    email: 'dlh@demo.buzzr.id',
    phone: null,
    role: 'dlh_admin',
    area_name: 'Jakarta Selatan',
  },
  {
    name: 'Budi Santoso',
    email: 'budi@demo.buzzr.id',
    phone: null,
    role: 'driver',
    area_name: 'Kebayoran Baru',
  },
  {
    name: 'Ahmad Petugas',
    email: 'ahmad@demo.buzzr.id',
    phone: null,
    role: 'sweeper',
    area_name: 'Senayan',
  },
  {
    name: 'Siti Operator',
    email: 'siti@demo.buzzr.id',
    phone: null,
    role: 'tps_operator',
    area_name: 'Senayan',
  },
  {
    name: 'Rudi Pengepul',
    email: null,
    phone: '081234567890',
    role: 'collector',
    area_name: 'Kebayoran Baru',
  },
  {
    name: 'Wawan TPST',
    email: 'wawan@demo.buzzr.id',
    phone: null,
    role: 'tpst_operator',
    area_name: 'Ragunan',
  },
  {
    name: 'Andi Warga',
    email: null,
    phone: '081234567891',
    role: 'citizen',
    area_name: 'Melawai',
  },
];

interface TpsDef {
  name: string;
  type: string;
  address: string;
  latitude: number;
  longitude: number;
  capacity_tons: number;
  area_name: string;
}

const TPS_LOCATIONS: TpsDef[] = [
  {
    name: 'TPS Senayan',
    type: 'tps',
    address: 'Jl. Asia Afrika, Senayan, Jakarta Selatan',
    latitude: -6.2256,
    longitude: 106.8025,
    capacity_tons: 5.0,
    area_name: 'Senayan',
  },
  {
    name: 'TPS Kebayoran',
    type: 'tps',
    address: 'Jl. Kyai Maja, Kebayoran Baru, Jakarta Selatan',
    latitude: -6.2443,
    longitude: 106.7968,
    capacity_tons: 8.0,
    area_name: 'Gunung',
  },
  {
    name: 'TPS Melawai',
    type: 'tps',
    address: 'Jl. Melawai Raya, Melawai, Jakarta Selatan',
    latitude: -6.2402,
    longitude: 106.7965,
    capacity_tons: 4.0,
    area_name: 'Melawai',
  },
  {
    name: 'TPS Ragunan',
    type: 'tps',
    address: 'Jl. Harsono RM, Ragunan, Jakarta Selatan',
    latitude: -6.3085,
    longitude: 106.8217,
    capacity_tons: 10.0,
    area_name: 'Ragunan',
  },
  {
    name: 'TPS Cilandak',
    type: 'tps',
    address: 'Jl. Cilandak KKO, Cilandak, Jakarta Selatan',
    latitude: -6.287,
    longitude: 106.7982,
    capacity_tons: 6.0,
    area_name: 'Cilandak',
  },
];

interface VehicleDef {
  plate_number: string;
  type: string;
  capacity_tons: number;
  driver_name: string; // resolved to driver_id at insert time
}

const VEHICLES: VehicleDef[] = [
  {
    plate_number: 'DLH-001',
    type: 'truck',
    capacity_tons: 5.0,
    driver_name: 'Budi Santoso',
  },
  {
    plate_number: 'DLH-002',
    type: 'motorcycle',
    capacity_tons: 0.5,
    driver_name: 'Budi Santoso',
  },
];

interface ScheduleDef {
  vehicle_plate: string;
  driver_name: string;
  route_name: string;
  schedule_type: string;
  recurring_days: number[];
  start_time: string;
  stop_tps_names: string[];
}

const SCHEDULES: ScheduleDef[] = [
  {
    vehicle_plate: 'DLH-001',
    driver_name: 'Budi Santoso',
    route_name: 'Rute Kebayoran Baru',
    schedule_type: 'recurring',
    recurring_days: [1, 3, 5], // Mon, Wed, Fri
    start_time: '07:00',
    stop_tps_names: ['TPS Senayan', 'TPS Kebayoran', 'TPS Melawai'],
  },
  {
    vehicle_plate: 'DLH-002',
    driver_name: 'Budi Santoso',
    route_name: 'Rute Pasar Minggu',
    schedule_type: 'recurring',
    recurring_days: [2, 4, 6], // Tue, Thu, Sat
    start_time: '08:00',
    stop_tps_names: ['TPS Ragunan', 'TPS Cilandak'],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(msg: string): void {
  console.log(`[seed] ${msg}`);
}

function logError(msg: string): void {
  console.error(`[seed] ERROR: ${msg}`);
}

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function seed(): Promise<void> {
  const client = new Client(DB_CONFIG);

  try {
    await client.connect();
    log(`Connected to database "${DB_CONFIG.database}" at ${DB_CONFIG.host}:${DB_CONFIG.port}`);

    // ------------------------------------------------------------------
    // 1. Create / verify demo tenant
    // ------------------------------------------------------------------
    log('Creating demo tenant...');
    const tenantResult = await client.query(
      `INSERT INTO public.tenants (name, slug, schema_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [TENANT.name, TENANT.slug, TENANT.schema_name],
    );
    const tenantId = tenantResult.rows[0].id;
    log(`Tenant ready: ${TENANT.name} (id=${tenantId})`);

    // ------------------------------------------------------------------
    // 2. Create tenant schema (idempotent — uses CREATE SCHEMA IF NOT EXISTS)
    // ------------------------------------------------------------------
    log('Ensuring tenant schema exists...');
    await client.query(`SELECT create_tenant_schema($1)`, [TENANT.schema_name]);
    log(`Schema "${TENANT.schema_name}" ready`);

    // Set search_path for all subsequent operations
    await client.query(`SET search_path TO ${TENANT.schema_name}, public`);

    // ------------------------------------------------------------------
    // 3. Seed areas
    // ------------------------------------------------------------------
    log('Seeding areas...');
    const areaIdMap: Record<string, string> = {};

    async function insertAreas(
      areas: AreaDef[],
      parentId: string | null,
    ): Promise<void> {
      for (const area of areas) {
        const result = await client.query(
          `INSERT INTO areas (name, level, parent_id)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING
           RETURNING id`,
          [area.name, area.level, parentId],
        );

        let areaId: string;
        if (result.rows.length > 0) {
          areaId = result.rows[0].id;
          log(`  Area created: ${area.name} (level ${area.level})`);
        } else {
          // Already exists — look it up
          const existing = await client.query(
            `SELECT id FROM areas WHERE name = $1 AND level = $2`,
            [area.name, area.level],
          );
          areaId = existing.rows[0].id;
          log(`  Area exists:  ${area.name} (level ${area.level})`);
        }

        areaIdMap[area.name] = areaId;

        if (area.children) {
          await insertAreas(area.children, areaId);
        }
      }
    }

    await insertAreas(AREAS, null);
    log(`Areas seeded: ${Object.keys(areaIdMap).length} total`);

    // ------------------------------------------------------------------
    // 4. Seed users
    // ------------------------------------------------------------------
    log('Seeding users...');
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);
    const userIdMap: Record<string, string> = {};

    for (const user of USERS) {
      const areaId = areaIdMap[user.area_name];
      if (!areaId) {
        logError(`Area "${user.area_name}" not found for user "${user.name}" — skipping`);
        continue;
      }

      // Build conflict target based on which identifier is set
      let result;
      if (user.email) {
        result = await client.query(
          `INSERT INTO users (name, email, phone, password_hash, role, area_id)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [user.name, user.email, user.phone, passwordHash, user.role, areaId],
        );
      } else {
        result = await client.query(
          `INSERT INTO users (name, email, phone, password_hash, role, area_id)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [user.name, user.email, user.phone, passwordHash, user.role, areaId],
        );
      }

      userIdMap[user.name] = result.rows[0].id;
      log(`  User: ${user.name} (${user.role})`);
    }
    log(`Users seeded: ${Object.keys(userIdMap).length} total`);

    // ------------------------------------------------------------------
    // 5. Seed TPS locations
    // ------------------------------------------------------------------
    log('Seeding TPS locations...');
    const tpsIdMap: Record<string, string> = {};

    for (const tps of TPS_LOCATIONS) {
      const areaId = areaIdMap[tps.area_name];
      if (!areaId) {
        logError(`Area "${tps.area_name}" not found for TPS "${tps.name}" — skipping`);
        continue;
      }

      const result = await client.query(
        `INSERT INTO tps_locations (name, type, address, coordinates, capacity_tons, area_id, qr_code)
         VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6, $7, $8)
         ON CONFLICT (qr_code) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [
          tps.name,
          tps.type,
          tps.address,
          tps.longitude,
          tps.latitude,
          tps.capacity_tons,
          areaId,
          `QR-${tps.name.replace(/\s+/g, '-').toUpperCase()}`,
        ],
      );

      tpsIdMap[tps.name] = result.rows[0].id;
      log(`  TPS: ${tps.name} (${tps.latitude}, ${tps.longitude})`);
    }
    log(`TPS locations seeded: ${Object.keys(tpsIdMap).length} total`);

    // ------------------------------------------------------------------
    // 6. Seed vehicles
    // ------------------------------------------------------------------
    log('Seeding vehicles...');
    const vehicleIdMap: Record<string, string> = {};

    for (const vehicle of VEHICLES) {
      const driverId = userIdMap[vehicle.driver_name] || null;

      const result = await client.query(
        `INSERT INTO vehicles (plate_number, type, capacity_tons, driver_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (plate_number) DO UPDATE SET type = EXCLUDED.type
         RETURNING id`,
        [vehicle.plate_number, vehicle.type, vehicle.capacity_tons, driverId],
      );

      vehicleIdMap[vehicle.plate_number] = result.rows[0].id;
      log(`  Vehicle: ${vehicle.plate_number} (${vehicle.type}, ${vehicle.capacity_tons}t)`);
    }
    log(`Vehicles seeded: ${Object.keys(vehicleIdMap).length} total`);

    // ------------------------------------------------------------------
    // 7. Seed schedules with stops
    // ------------------------------------------------------------------
    log('Seeding schedules...');

    for (const schedule of SCHEDULES) {
      const vehicleId = vehicleIdMap[schedule.vehicle_plate];
      const driverId = userIdMap[schedule.driver_name];

      if (!vehicleId || !driverId) {
        logError(
          `Vehicle or driver not found for schedule "${schedule.route_name}" — skipping`,
        );
        continue;
      }

      // Check if schedule already exists by route_name + vehicle_id
      const existing = await client.query(
        `SELECT id FROM schedules WHERE route_name = $1 AND vehicle_id = $2`,
        [schedule.route_name, vehicleId],
      );

      let scheduleId: string;
      if (existing.rows.length > 0) {
        scheduleId = existing.rows[0].id;
        log(`  Schedule exists: ${schedule.route_name}`);
      } else {
        const result = await client.query(
          `INSERT INTO schedules (vehicle_id, driver_id, route_name, schedule_type, recurring_days, start_time)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [
            vehicleId,
            driverId,
            schedule.route_name,
            schedule.schedule_type,
            schedule.recurring_days,
            schedule.start_time,
          ],
        );
        scheduleId = result.rows[0].id;
        log(`  Schedule created: ${schedule.route_name} (days: ${schedule.recurring_days.join(',')})`);
      }

      // Insert schedule stops
      for (let i = 0; i < schedule.stop_tps_names.length; i++) {
        const tpsName = schedule.stop_tps_names[i];
        const tpsId = tpsIdMap[tpsName];
        if (!tpsId) {
          logError(`TPS "${tpsName}" not found for schedule stop — skipping`);
          continue;
        }

        // Check if stop already exists
        const stopExists = await client.query(
          `SELECT id FROM schedule_stops WHERE schedule_id = $1 AND tps_id = $2`,
          [scheduleId, tpsId],
        );

        if (stopExists.rows.length === 0) {
          await client.query(
            `INSERT INTO schedule_stops (schedule_id, tps_id, stop_order)
             VALUES ($1, $2, $3)`,
            [scheduleId, tpsId, i + 1],
          );
          log(`    Stop ${i + 1}: ${tpsName}`);
        }
      }
    }

    // ------------------------------------------------------------------
    // 8. Create wallets for all users
    // ------------------------------------------------------------------
    log('Seeding wallets...');
    for (const [userName, userId] of Object.entries(userIdMap)) {
      await client.query(
        `INSERT INTO wallets (user_id, balance)
         VALUES ($1, 0)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId],
      );
    }
    log(`Wallets seeded for ${Object.keys(userIdMap).length} users`);

    // ------------------------------------------------------------------
    // Done
    // ------------------------------------------------------------------
    log('');
    log('=== Demo seed complete ===');
    log(`Tenant:     ${TENANT.name} (${TENANT.slug})`);
    log(`Schema:     ${TENANT.schema_name}`);
    log(`Areas:      ${Object.keys(areaIdMap).length}`);
    log(`Users:      ${Object.keys(userIdMap).length}`);
    log(`TPS:        ${Object.keys(tpsIdMap).length}`);
    log(`Vehicles:   ${Object.keys(vehicleIdMap).length}`);
    log(`Schedules:  ${SCHEDULES.length}`);
    log('');
    log('Login credentials (all users):');
    log(`  Password: ${DEMO_PASSWORD}`);
    log('');
    log('Accounts:');
    for (const user of USERS) {
      const identifier = user.email || user.phone || 'N/A';
      log(`  ${user.role.padEnd(15)} ${user.name.padEnd(20)} ${identifier}`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logError(message);
    if (err instanceof Error && err.stack) {
      console.error(err.stack);
    }
    process.exit(1);
  } finally {
    await client.end();
    log('Database connection closed');
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
seed();
