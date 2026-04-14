export type UserRole = 'admin' | 'member';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Tag {
  id: number;
  name: string;
  created_by?: number;
  created_at: string;
  material_count: number;
}

export type MaterialLevel = '入門' | '初級' | '中級' | '上級';
export type MaterialLanguage = '日本語' | '英語' | 'その他';

export interface TagSimple {
  id: number;
  name: string;
}

export interface Material {
  id: number;
  name: string;
  url: string;
  provider: string;
  duration?: number;
  cost?: number;
  level?: MaterialLevel;
  language?: MaterialLanguage;
  description?: string;
  created_at: string;
  created_by?: number;
  creator_name?: string;
  tags: TagSimple[];
  overall_score?: number;
  evaluation_count: number;
}

export interface MaterialListOut {
  items: Material[];
  total: number;
}

export interface Evaluation {
  id: number;
  material_id: number;
  user_id: number;
  user_name?: string;
  overall_score: number;
  quality?: number;
  clarity?: number;
  cost_effectiveness?: number;
  custom_scores?: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export interface CustomAxis {
  id: number;
  name: string;
  order: number;
  created_at: string;
}

export interface Memo {
  id: number;
  material_id: number;
  user_id: number;
  user_name?: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface MaterialFilters {
  search?: string;
  provider?: string;
  tag_ids?: string;
  level?: string;
  language?: string;
  sort_by?: string;
  sort_order?: string;
}
