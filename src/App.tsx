/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  Search,
  RefreshCw,
  Plus,
  Sparkles,
  Server,
  Layers,
  Filter,
} from 'lucide-react';
import { Header } from './components/Header.tsx';
import { DockerBanner } from './components/DockerBanner.tsx';
import { RecordItem } from './components/RecordItem.tsx';
import { RecordFormModal } from './components/RecordFormModal.tsx';
import { DbInspectorModal } from './components/DbInspectorModal.tsx';
import { DataRecord, DbStatusResponse, CreateRecordInput, RecordStatus } from './types.ts';

export default function App() {
  const [records, setRecords] = useState<DataRecord[]>([]);
  const [dbStatus, setDbStatus] = useState<DbStatusResponse | null>(null);
  const [loadingDb, setLoadingDb] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DataRecord | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

  // Fetch Database Status
  const fetchDbStatus = useCallback(async () => {
    setLoadingDb(true);
    try {
      const res = await fetch('/api/db/status');
      const data = await res.json();
      setDbStatus(data);
    } catch (err) {
      console.error('Failed to fetch db status:', err);
    } finally {
      setLoadingDb(false);
    }
  }, []);

  // Fetch Records
  const fetchRecords = useCallback(async () => {
    setLoadingRecords(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`/api/records?${params.toString()}`);
      const result = await res.json();
      if (result && Array.isArray(result.data)) {
        setRecords(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch records:', err);
    } finally {
      setLoadingRecords(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchDbStatus();
    fetchRecords();
  }, [fetchDbStatus, fetchRecords]);

  // Handle Record Submit (Create or Edit)
  const handleSubmitRecord = async (input: CreateRecordInput) => {
    setIsSubmitting(true);
    try {
      if (editingRecord) {
        const res = await fetch(`/api/records/${editingRecord.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        if (!res.ok) throw new Error('Failed to update record');
        const data = await res.json();
        setRecords((prev) => prev.map((r) => (r.id === editingRecord.id ? data.record : r)));
        showToast('Record updated successfully in PostgreSQL');
      } else {
        const res = await fetch('/api/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        if (!res.ok) throw new Error('Failed to create record');
        const data = await res.json();
        setRecords((prev) => [data.record, ...prev]);
        showToast('Record added to PostgreSQL table');
      }
      setIsFormOpen(false);
      setEditingRecord(null);
      fetchDbStatus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error submitting record';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Record Delete
  const handleDeleteRecord = async (id: number) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      const res = await fetch(`/api/records/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete record');
      setRecords((prev) => prev.filter((r) => r.id !== id));
      showToast('Record removed from database');
      fetchDbStatus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting record';
      alert(msg);
    }
  };

  // Handle Quick Status Change
  const handleStatusChange = async (id: number, newStatus: RecordStatus) => {
    try {
      const res = await fetch(`/api/records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setRecords((prev) => prev.map((r) => (r.id === id ? data.record : r)));
        showToast(`Status updated to ${newStatus}`);
      }
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  // Seed sample database items
  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch('/api/db/seed', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to seed records');
      await fetchRecords();
      await fetchDbStatus();
      showToast('Sample records inserted into PostgreSQL table');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to seed database';
      alert(msg);
    } finally {
      setIsSeeding(false);
    }
  };

  // Run Query Ping
  const handleTestPing = async () => {
    setIsTestingPing(true);
    await fetchDbStatus();
    setIsTestingPing(false);
  };

  // Filter records by priority client-side
  const filteredRecords = records.filter((r) => {
    if (priorityFilter === 'all') return true;
    return r.priority === priorityFilter;
  });

  const activeCount = records.filter((r) => r.status === 'active' || r.status === 'in_progress').length;
  const completedCount = records.filter((r) => r.status === 'completed').length;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed bottom-10 right-1/4 w-96 h-96 bg-purple-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900/95 text-cyan-300 px-4 py-3 rounded-2xl shadow-[0_0_25px_rgba(6,182,212,0.25)] text-xs font-mono border border-cyan-500/30 animate-in fade-in slide-in-from-bottom-2 duration-150 backdrop-blur-md">
          {toastMessage}
        </div>
      )}

      {/* Navigation / Header */}
      <Header
        dbStatus={dbStatus}
        loadingDb={loadingDb}
        onRefreshDb={fetchDbStatus}
        onOpenCreate={() => {
          setEditingRecord(null);
          setIsFormOpen(true);
        }}
        onOpenDockerDocs={() => setIsInspectorOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 relative z-10">
        {/* Architecture & Deployment Target Clarification Banner */}
        <DockerBanner dbStatus={dbStatus} />

        {/* Database Metric Stats Strip */}
        <section id="metrics-strip" className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-sm relative overflow-hidden shadow-lg">
            <div className="text-slate-400 text-xs font-mono flex items-center gap-1.5 uppercase tracking-wider">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              Total Records
            </div>
            <div className="text-2xl font-bold text-white font-mono tracking-tight mt-1.5">{records.length}</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-sm relative overflow-hidden shadow-lg">
            <div className="text-slate-400 text-xs font-mono flex items-center gap-1.5 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              Active Tasks
            </div>
            <div className="text-2xl font-bold text-purple-400 font-mono tracking-tight mt-1.5">{activeCount}</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-sm relative overflow-hidden shadow-lg">
            <div className="text-slate-400 text-xs font-mono flex items-center gap-1.5 uppercase tracking-wider">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              Completed
            </div>
            <div className="text-2xl font-bold text-emerald-400 font-mono tracking-tight mt-1.5">{completedCount}</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-sm relative overflow-hidden shadow-lg">
            <div className="text-slate-400 text-xs font-mono flex items-center gap-1.5 uppercase tracking-wider">
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              Postgres Latency
            </div>
            <div className="text-2xl font-bold text-amber-400 font-mono tracking-tight mt-1.5">
              {dbStatus?.latencyMs !== null ? `${dbStatus?.latencyMs} ms` : 'Standby'}
            </div>
          </div>
        </section>

        {/* Action Controls & Filtering Bar */}
        <section id="controls-bar" className="p-4 sm:p-5 rounded-3xl bg-slate-900/40 border border-white/5 backdrop-blur-sm shadow-xl space-y-3.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="search-records-input"
                type="text"
                placeholder="Search records by title, description, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 bg-slate-950/80 font-sans"
              />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                id="btn-seed-data"
                type="button"
                onClick={handleSeedDatabase}
                disabled={isSeeding}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-mono font-medium text-slate-300 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 transition-colors disabled:opacity-50"
                title="Seed database with sample records"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{isSeeding ? 'SEEDING...' : 'SEED_DATA'}</span>
              </button>

              <button
                id="btn-add-primary"
                type="button"
                onClick={() => {
                  setEditingRecord(null);
                  setIsFormOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-cyan-500 hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
              >
                <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
                <span>Add Record</span>
              </button>
            </div>
          </div>

          {/* Status and Priority Pill Selectors */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/60 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 font-mono text-[11px] uppercase mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3 text-cyan-400" /> Status:
              </span>
              {(['all', 'active', 'in_progress', 'completed', 'archived'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg uppercase transition-all font-mono text-[10px] font-bold ${
                    statusFilter === st
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.35)]'
                      : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800/80'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-mono text-[11px] uppercase">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono focus:outline-hidden focus:border-cyan-500"
              >
                <option value="all">ALL PRIORITIES</option>
                <option value="high">HIGH PRIORITY</option>
                <option value="medium">MEDIUM PRIORITY</option>
                <option value="low">LOW PRIORITY</option>
              </select>
            </div>
          </div>
        </section>

        {/* Records Grid */}
        <section id="records-grid" className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 tracking-tight">
              <span>Database Records</span>
              <span className="text-xs font-mono font-normal text-slate-400">
                ({filteredRecords.length} {filteredRecords.length === 1 ? 'item' : 'items'})
              </span>
            </h3>
            {loadingRecords && (
              <span className="text-xs font-mono text-cyan-400 flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3 animate-spin" /> Querying Drizzle...
              </span>
            )}
          </div>

          {filteredRecords.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/30 border border-dashed border-slate-800 space-y-3 backdrop-blur-xs">
              <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                <Database className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">No records found</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                    ? 'Try adjusting your search query or filters to find records.'
                    : 'Start by inserting a record into the PostgreSQL database table or clicking Seed Data.'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleSeedDatabase}
                  className="px-3.5 py-2 text-xs font-mono rounded-xl text-slate-300 bg-slate-950 hover:bg-slate-900 border border-slate-800 transition-colors"
                >
                  Insert Sample Data
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingRecord(null);
                    setIsFormOpen(true);
                  }}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-950 bg-cyan-500 hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
                >
                  Create Record
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRecords.map((record) => (
                <RecordItem
                  key={record.id}
                  record={record}
                  onEdit={(r) => {
                    setEditingRecord(r);
                    setIsFormOpen(true);
                  }}
                  onDelete={handleDeleteRecord}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modals */}
      <RecordFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingRecord(null);
        }}
        onSubmit={handleSubmitRecord}
        initialRecord={editingRecord}
        isSubmitting={isSubmitting}
      />

      <DbInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        dbStatus={dbStatus}
        onTestPing={handleTestPing}
        isTesting={isTestingPing}
      />
    </div>
  );
}
