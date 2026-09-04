import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  checkDatabaseStatus,
  getRecords,
  createRecord,
  updateRecord,
  deleteRecord,
  seedDatabase,
} from './src/db/index.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON middleware
  app.use(express.json());

  // Health check endpoint for Docker container checks
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      target: 'plain-docker-container',
      database: 'postgresql',
    });
  });

  // Database status and connectivity diagnostics
  app.get('/api/db/status', async (req: Request, res: Response) => {
    try {
      const status = await checkDatabaseStatus();
      res.json(status);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: 'Failed to inspect database status', details: message });
    }
  });

  // Fetch records
  app.get('/api/records', async (req: Request, res: Response) => {
    try {
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const result = await getRecords(search, status);
      res.json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: 'Failed to retrieve records', details: message });
    }
  });

  // Create a record
  app.post('/api/records', async (req: Request, res: Response) => {
    try {
      const { title, description, category, status, priority } = req.body;
      if (!title || typeof title !== 'string' || !title.trim()) {
        res.status(400).json({ error: 'Record title is required' });
        return;
      }

      const created = await createRecord({
        title: title.trim(),
        description: description?.trim() || '',
        category: category?.trim() || 'General',
        status: status || 'active',
        priority: priority || 'medium',
      });

      res.status(201).json(created);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: 'Failed to create record', details: message });
    }
  });

  // Update a record
  app.put('/api/records/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid record ID' });
        return;
      }

      const updated = await updateRecord(id, req.body);
      if (!updated.record) {
        res.status(404).json({ error: 'Record not found' });
        return;
      }

      res.json(updated);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: 'Failed to update record', details: message });
    }
  });

  // Delete a record
  app.delete('/api/records/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid record ID' });
        return;
      }

      const result = await deleteRecord(id);
      if (!result.success) {
        res.status(404).json({ error: 'Record not found' });
        return;
      }

      res.json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: 'Failed to delete record', details: message });
    }
  });

  // Seed test records
  app.post('/api/db/seed', async (req: Request, res: Response) => {
    try {
      const seeded = await seedDatabase();
      res.json(seeded);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: 'Failed to seed records', details: message });
    }
  });

  // Vite development middleware or production static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PostgreSQL Container App] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
