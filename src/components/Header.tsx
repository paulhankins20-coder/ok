import React from 'react';
import { Database, Container, RefreshCw, Plus, Terminal, CheckCircle2, AlertCircle } from 'lucide-react';
import { DbStatusResponse } from '../types.ts';

interface HeaderProps {
  dbStatus: DbStatusResponse | null;
  loadingDb: boolean;
  onRefreshDb: () => void;
  onOpenCreate: () => void;
  onOpenDockerDocs: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  dbStatus,
  loadingDb,
  onRefreshDb,
  onOpenCreate,
  onOpenDockerDocs,
}) => {
  return (
    <header id="app-header" className="border-b border-slate-800/80 bg-[#020617]/90 backdrop-blur-md sticky top-0 z-30 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Brand & Stack Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center font-black shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white leading-none">
                DOCK_SQL <span className="text-cyan-400 font-mono text-xs font-normal">_PROD</span>
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-cyan-950/40 text-cyan-400 border border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.2)]">
                <Container className="w-3 h-3 text-cyan-400" />
                Docker Standalone
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Standard PostgreSQL (pg + Drizzle ORM) • Port 3000 Ingress
            </p>
          </div>
        </div>

        {/* Status Indicators & Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* PostgreSQL Connection Badge */}
          <button
            id="db-status-badge"
            type="button"
            onClick={onRefreshDb}
            title="Click to re-ping database"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all ${
              dbStatus?.connected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
            }`}
          >
            {loadingDb ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : dbStatus?.connected ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>
              {loadingDb
                ? 'PINGING_DB...'
                : dbStatus?.connected
                ? `POSTGRES: ACTIVE (${dbStatus.latencyMs ?? 0}ms)`
                : 'POSTGRES: STANDBY REPLICA'}
            </span>
          </button>

          {/* Docker Commands Modal Trigger */}
          <button
            id="btn-docker-docs"
            type="button"
            onClick={onOpenDockerDocs}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 transition-colors"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Docker & Schema</span>
          </button>

          {/* New Record Action */}
          <button
            id="btn-create-record"
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg text-slate-950 bg-cyan-500 hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
          >
            <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
            <span>New Record</span>
          </button>
        </div>
      </div>
    </header>
  );
};
