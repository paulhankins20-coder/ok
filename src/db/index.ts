import { Pool, PoolConfig } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, desc, ilike, or } from 'drizzle-orm';
import * as schema from './schema.ts';
import { DataRecord, CreateRecordInput, DbStatusResponse } from '../types.ts';

// Configure connection options using standard PostgreSQL environment variables
function getPoolConfig(): PoolConfig {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      max: 10,
      connectionTimeoutMillis: 3000,
      idleTimeoutMillis: 10000,
    };
  }

  return {
    host: process.env.PGHOST || process.env.SQL_HOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || process.env.SQL_USER || 'postgres',
    password: process.env.PGPASSWORD || process.env.SQL_PASSWORD || 'postgres',
    database: process.env.PGDATABASE || process.env.SQL_DB_NAME || 'app_db',
    max: 10,
    connectionTimeoutMillis: 3000,
    idleTimeoutMillis: 10000,
  };
}

// Global connection pool instance
declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

export function getPool(): Pool {
  if (!global._pgPool) {
    global._pgPool = new Pool(getPoolConfig());

    global._pgPool.on('error', (err) => {
      console.warn('[PostgreSQL Pool Warning]', err.message);
    });
  }
  return global._pgPool;
}

export const pool = getPool();
export const db = drizzle(pool, { schema });

// In-memory fallback dataset for environments without an active Postgres instance
let memoryRecords: DataRecord[] = [
  {
    id: 1,
    title: 'Initialize Docker Container Target',
    description: 'Configure multi-stage Dockerfile and docker-compose.yml for plain container deployment.',
    category: 'DevOps',
    status: 'completed',
    priority: 'high',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 2,
    title: 'Establish PostgreSQL Connection & Drizzle ORM',
    description: 'Standard connection pool via pg with Drizzle schema and migrations.',
    category: 'Database',
    status: 'in_progress',
    priority: 'high',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 3,
    title: 'Verify Isolation from Firestore',
    description: 'Ensure no Firebase/Firestore client or credentials are used; pure relational SQL stack.',
    category: 'Architecture',
    status: 'completed',
    priority: 'medium',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 4,
    title: 'Container Port 3000 Ingress Verification',
    description: 'Ensure production image exposes port 3000 and runs without Cloud Run dependencies.',
    category: 'Deployment',
    status: 'active',
    priority: 'low',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let nextMemoryId = 5;
let tableInitialized = false;

// Auto-initialize schema in PostgreSQL if connected
async function ensureTableInitialized(): Promise<boolean> {
  if (tableInitialized) return true;
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS records (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT DEFAULT '',
          category TEXT NOT NULL DEFAULT 'General',
          status TEXT NOT NULL DEFAULT 'active',
          priority TEXT NOT NULL DEFAULT 'medium',
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      tableInitialized = true;
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    return false;
  }
}

// Check database connection and metrics
export async function checkDatabaseStatus(): Promise<DbStatusResponse> {
  const config = getPoolConfig();
  const host = (config.host as string) || (config.connectionString ? 'Docker/URL Configured' : 'localhost');
  const port = config.port || 5432;
  const database = (config.database as string) || 'app_db';

  const startTime = Date.now();
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1 as ping');
      const latencyMs = Date.now() - startTime;
      await ensureTableInitialized();

      const countResult = await client.query('SELECT COUNT(*)::int as count FROM records');
      const count = countResult.rows[0]?.count || 0;

      return {
        connected: true,
        driver: 'pg (node-postgres v8)',
        orm: 'Drizzle ORM (drizzle-orm v0.45)',
        host: String(host),
        port,
        database: String(database),
        totalRecords: count,
        latencyMs,
        message: 'Successfully connected to PostgreSQL database container',
        source: 'postgresql',
        dockerTarget: 'plain-container (docker-compose / Dockerfile)',
      };
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      driver: 'pg (node-postgres v8)',
      orm: 'Drizzle ORM (drizzle-orm v0.45)',
      host: String(host),
      port,
      database: String(database),
      totalRecords: memoryRecords.length,
      latencyMs: null,
      message: `PostgreSQL connection pending (${message}). Serving from resilient local replica. Run 'docker compose up' for live DB.`,
      source: 'in_memory_fallback',
      dockerTarget: 'plain-container (docker-compose / Dockerfile)',
    };
  }
}

// Fetch records with optional search / filter
export async function getRecords(search?: string, status?: string): Promise<{ data: DataRecord[]; source: 'postgresql' | 'in_memory_fallback' }> {
  try {
    const isReady = await ensureTableInitialized();
    if (isReady) {
      let query = db.select().from(schema.records).orderBy(desc(schema.records.createdAt));
      
      const conditions = [];
      if (status && status !== 'all') {
        conditions.push(eq(schema.records.status, status));
      }
      if (search) {
        conditions.push(
          or(
            ilike(schema.records.title, `%${search}%`),
            ilike(schema.records.description, `%${search}%`),
            ilike(schema.records.category, `%${search}%`)
          )
        );
      }

      const rows = conditions.length > 0 ? await db.select().from(schema.records).where(conditions[0]).orderBy(desc(schema.records.createdAt)) : await query;

      const formatted: DataRecord[] = rows.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description || '',
        category: r.category,
        status: r.status as DataRecord['status'],
        priority: r.priority as DataRecord['priority'],
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }));

      return { data: formatted, source: 'postgresql' };
    }
  } catch (err) {
    console.warn('[Postgres Query fallback]', err);
  }

  // Fallback to in-memory store
  let filtered = [...memoryRecords];
  if (status && status !== 'all') {
    filtered = filtered.filter((r) => r.status === status);
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
    );
  }

  return { data: filtered, source: 'in_memory_fallback' };
}

// Create a record
export async function createRecord(input: CreateRecordInput): Promise<{ record: DataRecord; source: 'postgresql' | 'in_memory_fallback' }> {
  try {
    const isReady = await ensureTableInitialized();
    if (isReady) {
      const inserted = await db
        .insert(schema.records)
        .values({
          title: input.title,
          description: input.description || '',
          category: input.category || 'General',
          status: input.status || 'active',
          priority: input.priority || 'medium',
        })
        .returning();

      const r = inserted[0];
      const record: DataRecord = {
        id: r.id,
        title: r.title,
        description: r.description || '',
        category: r.category,
        status: r.status as DataRecord['status'],
        priority: r.priority as DataRecord['priority'],
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      };
      return { record, source: 'postgresql' };
    }
  } catch (err) {
    console.warn('[Postgres Insert fallback]', err);
  }

  const record: DataRecord = {
    id: nextMemoryId++,
    title: input.title,
    description: input.description || '',
    category: input.category || 'General',
    status: input.status || 'active',
    priority: input.priority || 'medium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  memoryRecords.unshift(record);
  return { record, source: 'in_memory_fallback' };
}

// Update a record
export async function updateRecord(id: number, input: Partial<CreateRecordInput>): Promise<{ record: DataRecord | null; source: 'postgresql' | 'in_memory_fallback' }> {
  try {
    const isReady = await ensureTableInitialized();
    if (isReady) {
      const updateData: Partial<typeof schema.records.$inferInsert> = {
        updatedAt: new Date(),
      };
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.priority !== undefined) updateData.priority = input.priority;

      const updated = await db
        .update(schema.records)
        .set(updateData)
        .where(eq(schema.records.id, id))
        .returning();

      if (updated.length > 0) {
        const r = updated[0];
        const record: DataRecord = {
          id: r.id,
          title: r.title,
          description: r.description || '',
          category: r.category,
          status: r.status as DataRecord['status'],
          priority: r.priority as DataRecord['priority'],
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        };
        return { record, source: 'postgresql' };
      }
    }
  } catch (err) {
    console.warn('[Postgres Update fallback]', err);
  }

  const index = memoryRecords.findIndex((r) => r.id === id);
  if (index === -1) return { record: null, source: 'in_memory_fallback' };

  const existing = memoryRecords[index];
  const updated: DataRecord = {
    ...existing,
    ...input,
    updatedAt: new Date().toISOString(),
  };
  memoryRecords[index] = updated;
  return { record: updated, source: 'in_memory_fallback' };
}

// Delete a record
export async function deleteRecord(id: number): Promise<{ success: boolean; source: 'postgresql' | 'in_memory_fallback' }> {
  try {
    const isReady = await ensureTableInitialized();
    if (isReady) {
      const res = await db.delete(schema.records).where(eq(schema.records.id, id)).returning();
      return { success: res.length > 0, source: 'postgresql' };
    }
  } catch (err) {
    console.warn('[Postgres Delete fallback]', err);
  }

  const prevLen = memoryRecords.length;
  memoryRecords = memoryRecords.filter((r) => r.id !== id);
  return { success: memoryRecords.length < prevLen, source: 'in_memory_fallback' };
}

// Seed test dataset into PostgreSQL
export async function seedDatabase(): Promise<{ count: number; source: 'postgresql' | 'in_memory_fallback' }> {
  const seeds = [
    {
      title: 'Docker Multi-Stage Build Optimization',
      description: 'Streamline final container image size using alpine runtime and caching node_modules.',
      category: 'DevOps',
      status: 'completed',
      priority: 'high',
    },
    {
      title: 'PostgreSQL Index & Connection Pool Tuning',
      description: 'Tune max client connections, idle timeouts, and index frequent lookup columns with Drizzle.',
      category: 'Database',
      status: 'in_progress',
      priority: 'high',
    },
    {
      title: 'Container Healthcheck Integration',
      description: 'Ensure pg_isready is checked before web application boots in plain docker-compose.',
      category: 'Deployment',
      status: 'active',
      priority: 'medium',
    },
    {
      title: 'Data Migration Pipeline with Drizzle Kit',
      description: 'Define schema migrations with drizzle-kit push and versioned SQL scripts.',
      category: 'Database',
      status: 'active',
      priority: 'medium',
    },
  ];

  try {
    const isReady = await ensureTableInitialized();
    if (isReady) {
      await db.insert(schema.records).values(seeds);
      return { count: seeds.length, source: 'postgresql' };
    }
  } catch (err) {
    console.warn('[Postgres Seed fallback]', err);
  }

  for (const s of seeds) {
    memoryRecords.push({
      id: nextMemoryId++,
      title: s.title,
      description: s.description,
      category: s.category,
      status: s.status as DataRecord['status'],
      priority: s.priority as DataRecord['priority'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  return { count: seeds.length, source: 'in_memory_fallback' };
}
