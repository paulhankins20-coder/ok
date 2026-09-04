import React from 'react';
import { Clock, Tag, Edit3, Trash2, CheckCircle2, CircleDashed, Archive, AlertCircle } from 'lucide-react';
import { DataRecord, RecordStatus } from '../types.ts';

interface RecordItemProps {
  record: DataRecord;
  onEdit: (record: DataRecord) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: RecordStatus) => void;
}

export const RecordItem: React.FC<RecordItemProps> = ({
  record,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const getStatusBadge = (status: RecordStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            COMPLETED
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.2)]">
            <CircleDashed className="w-3 h-3 text-cyan-400 animate-spin" />
            IN_PROGRESS
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-800/80 text-slate-400 border border-slate-700/60">
            <Archive className="w-3 h-3 text-slate-400" />
            ARCHIVED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30 shadow-[0_0_8px_rgba(168,85,247,0.2)]">
            <Clock className="w-3 h-3 text-purple-400" />
            ACTIVE
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: DataRecord['priority']) => {
    switch (priority) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/30">
            <AlertCircle className="w-2.5 h-2.5" /> HIGH
          </span>
        );
      case 'medium':
        return (
          <span className="text-[10px] font-mono font-medium text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
            MED
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-950/50 px-2 py-0.5 rounded border border-slate-800">
            LOW
          </span>
        );
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div
      id={`record-${record.id}`}
      className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-cyan-500/30 shadow-lg hover:shadow-[0_0_25px_rgba(6,182,212,0.12)] transition-all backdrop-blur-xs flex flex-col justify-between gap-3.5 group"
    >
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-slate-500">#{record.id}</span>
            {getStatusBadge(record.status)}
            {getPriorityBadge(record.priority)}
          </div>

          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => onEdit(record)}
              title="Edit record"
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(record.id)}
              title="Delete record from PostgreSQL"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-white leading-snug tracking-tight">{record.title}</h3>
        {record.description && (
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{record.description}</p>
        )}
      </div>

      <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5 font-medium text-slate-400">
          <Tag className="w-3 h-3 text-cyan-500/70" />
          <span className="bg-slate-950 border border-slate-800/80 px-2 py-0.5 rounded text-[10px] font-mono text-slate-300">
            {record.category}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-mono text-slate-500">{formatDate(record.createdAt)}</span>

          <select
            value={record.status}
            onChange={(e) => onStatusChange(record.id, e.target.value as RecordStatus)}
            className="text-[10px] font-mono font-medium text-slate-300 bg-slate-950 border border-slate-800 rounded px-2 py-1 hover:border-slate-700 cursor-pointer focus:outline-hidden focus:border-cyan-500"
          >
            <option value="active">ACTIVE</option>
            <option value="in_progress">IN_PROGRESS</option>
            <option value="completed">COMPLETED</option>
            <option value="archived">ARCHIVED</option>
          </select>
        </div>
      </div>
    </div>
  );
};
