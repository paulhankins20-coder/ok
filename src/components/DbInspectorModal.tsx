import React, { useState } from 'react';
import { X, Database, Container, Terminal, Copy, Check, Server, ShieldCheck, Activity } from 'lucide-react';
import { DbStatusResponse } from '../types.ts';

interface DbInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbStatus: DbStatusResponse | null;
  onTestPing: () => void;
  isTesting: boolean;
}

export const DbInspectorModal: React.FC<DbInspectorModalProps> = ({
  isOpen,
  onClose,
  dbStatus,
  onTestPing,
  isTesting,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const composeSnippet = `services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/app_db
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=app_db
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d app_db"]
      interval: 5s
      timeout: 5s
      retries: 5`;

  const dockerfileSnippet = `# Plain Dockerfile (No Cloud Run)
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.cjs"]`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        id="db-inspector-dialog"
        className="bg-[#020617] rounded-3xl max-w-3xl w-full shadow-[0_0_60px_rgba(0,0,0,0.9)] border border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/50 border border-cyan-500/30 text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">PostgreSQL & Docker Environment</h3>
              <p className="text-xs text-slate-400 font-mono">
                Direct pg pool, Drizzle ORM schema, and multi-stage container deployment
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Live Status Card */}
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${dbStatus?.connected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-amber-400'}`} />
                <span className="font-semibold text-white font-mono text-xs">
                  {dbStatus?.connected ? 'POSTGRES_LIVE_ACTIVE' : 'WAITING_FOR_REMOTE_INSTANCE (STANDBY_ACTIVE)'}
                </span>
              </div>
              <button
                type="button"
                onClick={onTestPing}
                disabled={isTesting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 shadow-xs transition-colors disabled:opacity-60"
              >
                <Activity className={`w-3.5 h-3.5 text-cyan-400 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'TESTING_QUERY...' : 'RUN_QUERY_PING'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-400 font-mono leading-relaxed">{dbStatus?.message}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] font-mono uppercase">Driver / Pool</span>
                <span className="font-mono font-semibold text-cyan-400">pg (node-postgres)</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-mono uppercase">ORM</span>
                <span className="font-mono font-semibold text-cyan-400">Drizzle ORM</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-mono uppercase">Target Port</span>
                <span className="font-mono font-semibold text-slate-200">3000 (HTTP) / 5432 (DB)</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-mono uppercase">Latency</span>
                <span className="font-mono font-semibold text-emerald-400">
                  {dbStatus?.latencyMs !== null ? `${dbStatus?.latencyMs} ms` : 'Standby'}
                </span>
              </div>
            </div>
          </div>

          {/* Docker Commands Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                Container Launch Commands
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-slate-500">Launch with docker-compose:</div>
                  <div className="text-cyan-400 mt-0.5">$ docker compose up --build</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('compose', 'docker compose up --build')}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  {copiedKey === 'compose' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-slate-500">Apply Drizzle Schema Push:</div>
                  <div className="text-cyan-400 mt-0.5">$ npx drizzle-kit push</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('drizzle', 'npx drizzle-kit push')}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  {copiedKey === 'drizzle' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Configuration Inspector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Container className="w-3.5 h-3.5 text-cyan-400" />
                docker-compose.yml configuration
              </span>
              <button
                type="button"
                onClick={() => handleCopy('snippet-compose', composeSnippet)}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                {copiedKey === 'snippet-compose' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy YAML</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-2xl bg-slate-950 text-cyan-300/90 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800 max-h-48">
              {composeSnippet}
            </pre>
          </div>

          {/* Dockerfile Inspector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-cyan-400" />
                Dockerfile (Standalone Multi-stage)
              </span>
              <button
                type="button"
                onClick={() => handleCopy('snippet-docker', dockerfileSnippet)}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                {copiedKey === 'snippet-docker' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Dockerfile</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-2xl bg-slate-950 text-cyan-300/90 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800 max-h-40">
              {dockerfileSnippet}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800/80 bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Pure PostgreSQL Stack • 0% Firestore SDK</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
