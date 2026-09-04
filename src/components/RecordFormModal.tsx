import React, { useState, useEffect } from 'react';
import { X, Save, Plus } from 'lucide-react';
import { DataRecord, CreateRecordInput, RecordStatus, PriorityLevel } from '../types.ts';

interface RecordFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateRecordInput) => Promise<void>;
  initialRecord?: DataRecord | null;
  isSubmitting: boolean;
}

export const RecordFormModal: React.FC<RecordFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialRecord,
  isSubmitting,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [status, setStatus] = useState<RecordStatus>('active');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialRecord) {
      setTitle(initialRecord.title);
      setDescription(initialRecord.description);
      setCategory(initialRecord.category);
      setStatus(initialRecord.status);
      setPriority(initialRecord.priority);
    } else {
      setTitle('');
      setDescription('');
      setCategory('General');
      setStatus('active');
      setPriority('medium');
    }
    setError(null);
  }, [initialRecord, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category: category.trim() || 'General',
        status,
        priority,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save record');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        id="record-form-dialog"
        className="bg-[#020617] rounded-3xl max-w-lg w-full shadow-[0_0_60px_rgba(0,0,0,0.9)] border border-slate-800 overflow-hidden flex flex-col relative"
      >
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/50 border border-cyan-500/30 text-cyan-400">
              {initialRecord ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <h3 className="text-base font-semibold text-white tracking-tight">
              {initialRecord ? 'Edit PostgreSQL Record' : 'Create PostgreSQL Record'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-400 text-xs font-mono">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="record-title" className="block text-xs font-mono font-medium text-slate-400 uppercase mb-1.5">
              Record Title *
            </label>
            <input
              id="record-title"
              type="text"
              required
              placeholder="e.g. Implement connection pooling metrics"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-sm font-sans"
            />
          </div>

          <div>
            <label htmlFor="record-description" className="block text-xs font-mono font-medium text-slate-400 uppercase mb-1.5">
              Description
            </label>
            <textarea
              id="record-description"
              rows={3}
              placeholder="Provide context or instructions for this record..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-sm font-sans leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="record-category" className="block text-xs font-mono font-medium text-slate-400 uppercase mb-1.5">
                Category
              </label>
              <input
                id="record-category"
                type="text"
                placeholder="Database, DevOps..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-xs font-mono"
              />
            </div>

            <div>
              <label htmlFor="record-status" className="block text-xs font-mono font-medium text-slate-400 uppercase mb-1.5">
                Status
              </label>
              <select
                id="record-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as RecordStatus)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 focus:outline-hidden focus:border-cyan-500 text-xs font-mono"
              >
                <option value="active">ACTIVE</option>
                <option value="in_progress">IN_PROGRESS</option>
                <option value="completed">COMPLETED</option>
                <option value="archived">ARCHIVED</option>
              </select>
            </div>

            <div>
              <label htmlFor="record-priority" className="block text-xs font-mono font-medium text-slate-400 uppercase mb-1.5">
                Priority
              </label>
              <select
                id="record-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 focus:outline-hidden focus:border-cyan-500 text-xs font-mono"
              >
                <option value="low">LOW</option>
                <option value="medium">MEDIUM</option>
                <option value="high">HIGH</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold rounded-xl text-slate-950 bg-cyan-500 hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Writing to Postgres...</span>
              ) : (
                <span>{initialRecord ? 'Update Record' : 'Save Record'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
