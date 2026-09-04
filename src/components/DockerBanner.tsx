import React, { useState } from 'react';
import { Container, Database, Layers, Check, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { DbStatusResponse } from '../types.ts';

interface DockerBannerProps {
  dbStatus: DbStatusResponse | null;
}

export const DockerBanner: React.FC<DockerBannerProps> = ({ dbStatus }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const command = 'docker compose up --build';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="docker-architecture-banner" className="bg-slate-900/40 border border-white/5 rounded-3xl backdrop-blur-sm relative overflow-hidden shadow-2xl">
      {/* Ambient background glow */}
      <div className="absolute -top-12 -right-12 w-64 h-64 bg-cyan-500/10 blur-[70px] rounded-full pointer-events-none"></div>
      
      <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
            <Container className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-cyan-400 font-mono uppercase tracking-wider font-semibold">Deployment Target</span>
              <h2 className="text-base font-semibold text-white tracking-tight">Plain Docker Container</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                NO_CLOUD_RUN
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                POSTGRES_DOCKER
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 max-w-3xl leading-relaxed">
              Direct connection via <code className="font-mono text-cyan-300 bg-slate-950/80 border border-slate-800 px-1.5 py-0.5 rounded">pg</code> pool and{' '}
              <code className="font-mono text-cyan-300 bg-slate-950/80 border border-slate-800 px-1.5 py-0.5 rounded">Drizzle ORM</code> on port 3000. Includes production multi-stage{' '}
              <code className="font-mono text-slate-300 bg-slate-950/80 border border-slate-800 px-1.5 py-0.5 rounded">Dockerfile</code> and{' '}
              <code className="font-mono text-slate-300 bg-slate-950/80 border border-slate-800 px-1.5 py-0.5 rounded">docker-compose.yml</code>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          <div className="flex items-center bg-slate-950/90 text-cyan-400 text-xs font-mono px-3.5 py-2 rounded-xl border border-slate-800 shadow-inner">
            <span className="text-slate-600 mr-2 select-none">$</span>
            <span className="text-slate-200">{command}</span>
            <button
              type="button"
              onClick={copyToClipboard}
              className="ml-3 p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Copy command"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800/80 transition-colors"
            title={expanded ? 'Collapse architecture specs' : 'Expand architecture specs'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-5 sm:px-6 pb-5 pt-3 border-t border-slate-800/60 bg-slate-950/40 grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs relative z-10">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Database Engine</div>
              <div className="font-semibold text-white text-xs">
                {dbStatus?.driver || 'pg (node-postgres)'} + Drizzle
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
            <div className="w-8 h-8 rounded-lg bg-purple-950/40 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Container className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Container Target</div>
              <div className="font-semibold text-white text-xs font-mono">
                Port 3000 • postgres:16 (5432)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Active Storage Layer</div>
              <div className="font-semibold text-emerald-400 text-xs font-mono">
                {dbStatus?.source === 'postgresql' ? 'LIVE_POSTGRES_TABLE' : 'LOCAL_REPLICA_STANDBY'}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
