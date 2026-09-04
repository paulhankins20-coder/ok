export type RecordStatus = 'active' | 'in_progress' | 'completed' | 'archived';
export type PriorityLevel = 'low' | 'medium' | 'high';

export interface DataRecord {
  id: number;
  title: string;
  description: string;
  category: string;
  status: RecordStatus;
  priority: PriorityLevel;
  createdAt: string;
  updatedAt: string;
}

export interface DbStatusResponse {
  connected: boolean;
  driver: string;
  orm: string;
  host: string;
  port: number | string;
  database: string;
  totalRecords: number;
  latencyMs: number | null;
  message: string;
  source: 'postgresql' | 'in_memory_fallback';
  dockerTarget: string;
}

export interface CreateRecordInput {
  title: string;
  description?: string;
  category?: string;
  status?: RecordStatus;
  priority?: PriorityLevel;
}
