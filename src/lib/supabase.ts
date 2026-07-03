import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Agency = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  user_id: string;
  agency_id: string | null;
  display_name: string;
  avatar_url: string | null;
  role: 'owner' | 'admin' | 'member' | 'client';
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  agency_id: string;
  client_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  status: 'active' | 'paused' | 'completed' | 'cancelled' | 'waiting';
  progress: number;
  start_date: string | null;
  end_date: string | null;
  website_url: string | null;
  color: string;
  is_archived: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  agency_id: string;
  project_id: string;
  module_id: string | null;
  team_id: string | null;
  assigned_to: string | null;
  created_by: string | null;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  due_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
};

export type Module = {
  id: string;
  agency_id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description: string | null;
  is_active: boolean;
  show_in_sidebar: boolean;
  sort_order: number;
  status: 'active' | 'inactive' | 'archived';
  created_at: string;
  updated_at: string;
};

export type ModuleTemplate = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description: string | null;
  stages: Array<{ name: string }>;
  kpis: Array<{ name: string }>;
  category: string | null;
};

export type Team = {
  id: string;
  agency_id: string;
  name: string;
  color: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type TeamMember = {
  id: string;
  team_id: string;
  profile_id: string;
  created_at: string;
};

export type Invitation = {
  id: string;
  agency_id: string;
  email: string;
  role: 'admin' | 'member' | 'client';
  token: string;
  invited_by: string | null;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
};

export type Client = {
  id: string;
  agency_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  logo_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Notification = {
  id: string;
  agency_id: string;
  recipient_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export type ActivityLog = {
  id: string;
  agency_id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};
