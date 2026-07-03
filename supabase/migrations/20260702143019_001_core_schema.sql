
/*
# Agency Project Management System – Core Schema (Fixed)

Creates all tables first, then applies RLS policies.
All cross-table references in policies are safe because tables exist before policies.
*/

-- ===========================
-- AGENCIES
-- ===========================
CREATE TABLE IF NOT EXISTS agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ===========================
-- PROFILES
-- ===========================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id uuid REFERENCES agencies(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  avatar_url text,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member','client')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, agency_id)
);

-- ===========================
-- CLIENTS
-- ===========================
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  website text,
  logo_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ===========================
-- TEAMS
-- ===========================
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#1976d2',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ===========================
-- TEAM MEMBERS
-- ===========================
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(team_id, profile_id)
);

-- ===========================
-- MODULES
-- ===========================
CREATE TABLE IF NOT EXISTS modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  icon text DEFAULT 'Extension',
  color text DEFAULT '#1976d2',
  description text,
  is_active boolean DEFAULT true,
  show_in_sidebar boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active','inactive','archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agency_id, slug)
);

-- ===========================
-- MODULE STAGES
-- ===========================
CREATE TABLE IF NOT EXISTS module_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#1976d2',
  sort_order integer DEFAULT 0,
  is_terminal boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ===========================
-- MODULE TEMPLATES (global, not agency-scoped)
-- ===========================
CREATE TABLE IF NOT EXISTS module_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text DEFAULT 'Extension',
  color text DEFAULT '#1976d2',
  description text,
  stages jsonb DEFAULT '[]',
  kpis jsonb DEFAULT '[]',
  category text,
  created_at timestamptz DEFAULT now()
);

-- ===========================
-- PROJECTS
-- ===========================
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  status text DEFAULT 'active' CHECK (status IN ('active','paused','completed','cancelled','waiting')),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  start_date date,
  end_date date,
  website_url text,
  color text DEFAULT '#1976d2',
  is_archived boolean DEFAULT false,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agency_id, slug)
);

-- ===========================
-- TASKS
-- ===========================
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  module_id uuid REFERENCES modules(id) ON DELETE SET NULL,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  priority text DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  status text DEFAULT 'todo' CHECK (status IN ('todo','in_progress','review','done','cancelled')),
  due_date date,
  estimated_hours numeric(6,2),
  actual_hours numeric(6,2),
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ===========================
-- TASK COMMENTS
-- ===========================
CREATE TABLE IF NOT EXISTS task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ===========================
-- FILES
-- ===========================
CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz DEFAULT now()
);

-- ===========================
-- NOTIFICATIONS
-- ===========================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ===========================
-- ACTIVITY LOGS (append-only)
-- ===========================
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- ===========================
-- INVITATIONS
-- ===========================
CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('admin','member','client')),
  token text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  invited_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  created_at timestamptz DEFAULT now(),
  UNIQUE(agency_id, email)
);

-- ===========================
-- SETTINGS
-- ===========================
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agency_id, key)
);

-- ===========================
-- ENABLE RLS ON ALL TABLES
-- ===========================
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ===========================
-- RLS POLICIES – AGENCIES
-- ===========================
DROP POLICY IF EXISTS "agency_select" ON agencies;
CREATE POLICY "agency_select" ON agencies FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = agencies.id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "agency_insert" ON agencies;
CREATE POLICY "agency_insert" ON agencies FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "agency_update" ON agencies;
CREATE POLICY "agency_update" ON agencies FOR UPDATE TO authenticated
USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- ===========================
-- RLS POLICIES – PROFILES
-- ===========================
DROP POLICY IF EXISTS "profile_select" ON profiles;
CREATE POLICY "profile_select" ON profiles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p2 WHERE p2.agency_id = profiles.agency_id AND p2.user_id = auth.uid()));

DROP POLICY IF EXISTS "profile_insert" ON profiles;
CREATE POLICY "profile_insert" ON profiles FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "profile_update" ON profiles;
CREATE POLICY "profile_update" ON profiles FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ===========================
-- RLS POLICIES – CLIENTS
-- ===========================
DROP POLICY IF EXISTS "clients_select" ON clients;
CREATE POLICY "clients_select" ON clients FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = clients.agency_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "clients_insert" ON clients;
CREATE POLICY "clients_insert" ON clients FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = clients.agency_id AND p.user_id = auth.uid() AND p.role IN ('owner','admin')));

DROP POLICY IF EXISTS "clients_update" ON clients;
CREATE POLICY "clients_update" ON clients FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = clients.agency_id AND p.user_id = auth.uid() AND p.role IN ('owner','admin')))
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = clients.agency_id AND p.user_id = auth.uid() AND p.role IN ('owner','admin')));

DROP POLICY IF EXISTS "clients_delete" ON clients;
CREATE POLICY "clients_delete" ON clients FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = clients.agency_id AND p.user_id = auth.uid() AND p.role IN ('owner','admin')));

-- ===========================
-- RLS POLICIES – TEAMS
-- ===========================
DROP POLICY IF EXISTS "teams_select" ON teams;
CREATE POLICY "teams_select" ON teams FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = teams.agency_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "teams_insert" ON teams;
CREATE POLICY "teams_insert" ON teams FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = teams.agency_id AND p.user_id = auth.uid() AND p.role IN ('owner','admin')));

DROP POLICY IF EXISTS "teams_update" ON teams;
CREATE POLICY "teams_update" ON teams FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = teams.agency_id AND p.user_id = auth.uid() AND p.role IN ('owner','admin')))
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = teams.agency_id AND p.user_id = auth.uid() AND p.role IN ('owner','admin')));

DROP POLICY IF EXISTS "teams_delete" ON teams;
CREATE POLICY "teams_delete" ON teams FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = teams.agency_id AND p.user_id = auth.uid() AND p.role IN ('owner','admin')));

-- ===========================
-- RLS POLICIES – TEAM MEMBERS
-- ===========================
DROP POLICY IF EXISTS "team_members_select" ON team_members;
CREATE POLICY "team_members_select" ON team_members FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM teams t JOIN profiles p ON p.agency_id = t.agency_id WHERE t.id = team_members.team_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "team_members_insert" ON team_members;
CREATE POLICY "team_members_insert" ON team_members FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM teams t JOIN profiles p ON p.agency_id = t.agency_id WHERE t.id = team_members.team_id AND p.user_id = auth.uid() AND p.role IN ('owner','admin')));

DROP POLICY IF EXISTS "team_members_delete" ON team_members;
CREATE POLICY "team_members_delete" ON team_members FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM teams t JOIN profiles p ON p.agency_id = t.agency_id WHERE t.id = team_members.team_id AND p.user_id = auth.uid() AND p.role IN ('owner','admin')));

-- ===========================
-- RLS POLICIES – MODULES
-- ===========================
DROP POLICY IF EXISTS "modules_select" ON modules;
CREATE POLICY "modules_select" ON modules FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = modules.agency_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "modules_insert" ON modules;
CREATE POLICY "modules_insert" ON modules FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = modules.agency_id AND p.user_id = auth.uid() AND p.role IN ('owner','admin')));

DROP POLICY IF EXISTS "modules_update" ON modules;
CREATE POLICY "modules_update" ON modules FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = modules.agency_id AND p.user_id = auth.uid() AND p.role IN ('owner','admin')))
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = modules.agency_id AND p.user_id = auth.uid() AND p.role IN ('owner','admin')));

DROP POLICY IF EXISTS "modules_delete" ON modules;
CREATE POLICY "modules_delete" ON modules FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = modules.agency_id AND p.user_id = auth.uid() AND p.role = 'owner'));

-- ===========================
-- RLS POLICIES – MODULE STAGES
-- ===========================
DROP POLICY IF EXISTS "module_stages_select" ON module_stages;
CREATE POLICY "module_stages_select" ON module_stages FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM modules m JOIN profiles p ON p.agency_id = m.agency_id WHERE m.id = module_stages.module_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "module_stages_insert" ON module_stages;
CREATE POLICY "module_stages_insert" ON module_stages FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM modules m JOIN profiles p ON p.agency_id = m.agency_id WHERE m.id = module_stages.module_id AND p.user_id = auth.uid() AND p.role IN ('owner','admin')));

DROP POLICY IF EXISTS "module_stages_update" ON module_stages;
CREATE POLICY "module_stages_update" ON module_stages FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM modules m JOIN profiles p ON p.agency_id = m.agency_id WHERE m.id = module_stages.module_id AND p.user_id = auth.uid() AND p.role IN ('owner','admin')))
WITH CHECK (EXISTS (SELECT 1 FROM modules m JOIN profiles p ON p.agency_id = m.agency_id WHERE m.id = module_stages.module_id AND p.user_id = auth.uid() AND p.role IN ('owner','admin')));

DROP POLICY IF EXISTS "module_stages_delete" ON module_stages;
CREATE POLICY "module_stages_delete" ON module_stages FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM modules m JOIN profiles p ON p.agency_id = m.agency_id WHERE m.id = module_stages.module_id AND p.user_id = auth.uid() AND p.role IN ('owner','admin')));

-- ===========================
-- RLS POLICIES – MODULE TEMPLATES (public read)
-- ===========================
DROP POLICY IF EXISTS "module_templates_select" ON module_templates;
CREATE POLICY "module_templates_select" ON module_templates FOR SELECT TO authenticated USING (true);

-- ===========================
-- RLS POLICIES – PROJECTS
-- ===========================
DROP POLICY IF EXISTS "projects_select" ON projects;
CREATE POLICY "projects_select" ON projects FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = projects.agency_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "projects_insert" ON projects;
CREATE POLICY "projects_insert" ON projects FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = projects.agency_id AND p.user_id = auth.uid() AND p.role IN ('owner','admin')));

DROP POLICY IF EXISTS "projects_update" ON projects;
CREATE POLICY "projects_update" ON projects FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = projects.agency_id AND p.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = projects.agency_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "projects_delete" ON projects;
CREATE POLICY "projects_delete" ON projects FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = projects.agency_id AND p.user_id = auth.uid() AND p.role IN ('owner','admin')));

-- ===========================
-- RLS POLICIES – TASKS
-- ===========================
DROP POLICY IF EXISTS "tasks_select" ON tasks;
CREATE POLICY "tasks_select" ON tasks FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = tasks.agency_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "tasks_insert" ON tasks;
CREATE POLICY "tasks_insert" ON tasks FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = tasks.agency_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "tasks_update" ON tasks;
CREATE POLICY "tasks_update" ON tasks FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = tasks.agency_id AND p.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = tasks.agency_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "tasks_delete" ON tasks;
CREATE POLICY "tasks_delete" ON tasks FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = tasks.agency_id AND p.user_id = auth.uid() AND p.role IN ('owner','admin','member')));

-- ===========================
-- RLS POLICIES – TASK COMMENTS
-- ===========================
DROP POLICY IF EXISTS "task_comments_select" ON task_comments;
CREATE POLICY "task_comments_select" ON task_comments FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM tasks t JOIN profiles p ON p.agency_id = t.agency_id WHERE t.id = task_comments.task_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "task_comments_insert" ON task_comments;
CREATE POLICY "task_comments_insert" ON task_comments FOR INSERT TO authenticated
WITH CHECK (author_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "task_comments_update" ON task_comments;
CREATE POLICY "task_comments_update" ON task_comments FOR UPDATE TO authenticated
USING (author_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (author_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "task_comments_delete" ON task_comments;
CREATE POLICY "task_comments_delete" ON task_comments FOR DELETE TO authenticated
USING (author_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ===========================
-- RLS POLICIES – FILES
-- ===========================
DROP POLICY IF EXISTS "files_select" ON files;
CREATE POLICY "files_select" ON files FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = files.agency_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "files_insert" ON files;
CREATE POLICY "files_insert" ON files FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = files.agency_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "files_delete" ON files;
CREATE POLICY "files_delete" ON files FOR DELETE TO authenticated
USING (uploaded_by IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = files.agency_id AND p.user_id = auth.uid() AND p.role IN ('owner','admin')));

-- ===========================
-- RLS POLICIES – NOTIFICATIONS
-- ===========================
DROP POLICY IF EXISTS "notifications_select" ON notifications;
CREATE POLICY "notifications_select" ON notifications FOR SELECT TO authenticated
USING (recipient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = notifications.agency_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "notifications_update" ON notifications;
CREATE POLICY "notifications_update" ON notifications FOR UPDATE TO authenticated
USING (recipient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (recipient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "notifications_delete" ON notifications;
CREATE POLICY "notifications_delete" ON notifications FOR DELETE TO authenticated
USING (recipient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ===========================
-- RLS POLICIES – ACTIVITY LOGS
-- ===========================
DROP POLICY IF EXISTS "activity_logs_select" ON activity_logs;
CREATE POLICY "activity_logs_select" ON activity_logs FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = activity_logs.agency_id AND p.user_id = auth.uid() AND p.role IN ('owner','admin')));

DROP POLICY IF EXISTS "activity_logs_insert" ON activity_logs;
CREATE POLICY "activity_logs_insert" ON activity_logs FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = activity_logs.agency_id AND p.user_id = auth.uid()));

-- ===========================
-- RLS POLICIES – INVITATIONS
-- ===========================
DROP POLICY IF EXISTS "invitations_select" ON invitations;
CREATE POLICY "invitations_select" ON invitations FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = invitations.agency_id AND p.user_id = auth.uid() AND p.role IN ('owner','admin')));

DROP POLICY IF EXISTS "invitations_insert" ON invitations;
CREATE POLICY "invitations_insert" ON invitations FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = invitations.agency_id AND p.user_id = auth.uid() AND p.role IN ('owner','admin')));

DROP POLICY IF EXISTS "invitations_delete" ON invitations;
CREATE POLICY "invitations_delete" ON invitations FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = invitations.agency_id AND p.user_id = auth.uid() AND p.role IN ('owner','admin')));

-- ===========================
-- RLS POLICIES – SETTINGS
-- ===========================
DROP POLICY IF EXISTS "settings_select" ON settings;
CREATE POLICY "settings_select" ON settings FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = settings.agency_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "settings_insert" ON settings;
CREATE POLICY "settings_insert" ON settings FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = settings.agency_id AND p.user_id = auth.uid() AND p.role IN ('owner','admin')));

DROP POLICY IF EXISTS "settings_update" ON settings;
CREATE POLICY "settings_update" ON settings FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = settings.agency_id AND p.user_id = auth.uid() AND p.role IN ('owner','admin')))
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.agency_id = settings.agency_id AND p.user_id = auth.uid() AND p.role IN ('owner','admin')));

-- ===========================
-- INDEXES
-- ===========================
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_agency_id ON profiles(agency_id);
CREATE INDEX IF NOT EXISTS idx_projects_agency_id ON projects(agency_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_agency_id ON tasks(agency_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_modules_agency_id ON modules(agency_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_agency_id ON activity_logs(agency_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);

-- ===========================
-- SEED MODULE TEMPLATES
-- ===========================
INSERT INTO module_templates (name, slug, icon, color, description, stages, kpis, category) VALUES
('سئو', 'seo', 'TravelExplore', '#F59E0B', 'مدیریت پروژه‌های بهینه‌سازی موتور جستجو', '[{"name":"تحقیق کلمات کلیدی"},{"name":"بهینه‌سازی صفحه"},{"name":"ساخت لینک"},{"name":"گزارش‌دهی"}]', '[{"name":"رتبه کلمات کلیدی"},{"name":"ترافیک ارگانیک"},{"name":"بک‌لینک"}]', 'سئو'),
('توسعه وردپرس', 'wordpress', 'Code', '#3B82F6', 'توسعه و طراحی سایت‌های وردپرسی', '[{"name":"آنالیز نیاز"},{"name":"طراحی"},{"name":"توسعه"},{"name":"تست"},{"name":"انتشار"}]', '[{"name":"صفحات توسعه داده شده"},{"name":"باگ‌های رفع شده"},{"name":"امتیاز عملکرد"}]', 'توسعه'),
('طراحی UI/UX', 'uiux', 'Palette', '#8B5CF6', 'طراحی رابط کاربری و تجربه کاربری', '[{"name":"تحقیق"},{"name":"وایرفریم"},{"name":"پروتوتایپ"},{"name":"طراحی UI"},{"name":"تحویل"}]', '[{"name":"صفحات طراحی شده"},{"name":"تست کاربری"},{"name":"رضایت مشتری"}]', 'طراحی'),
('محتوا', 'content', 'Article', '#10B981', 'تولید و مدیریت محتوای دیجیتال', '[{"name":"برنامه‌ریزی"},{"name":"تحقیق"},{"name":"نوشتن"},{"name":"ویرایش"},{"name":"انتشار"}]', '[{"name":"مقالات منتشر شده"},{"name":"نرخ تعامل"},{"name":"بازدید"}]', 'محتوا'),
('تبلیغات دیجیتال', 'ads', 'Campaign', '#EF4444', 'مدیریت کمپین‌های تبلیغاتی دیجیتال', '[{"name":"استراتژی"},{"name":"ایجاد کمپین"},{"name":"اجرا"},{"name":"بهینه‌سازی"},{"name":"گزارش"}]', '[{"name":"نرخ کلیک"},{"name":"هزینه هر کلیک"},{"name":"نرخ تبدیل"}]', 'تبلیغات'),
('شبکه‌های اجتماعی', 'social', 'Share', '#EC4899', 'مدیریت حضور در شبکه‌های اجتماعی', '[{"name":"استراتژی محتوا"},{"name":"تولید محتوا"},{"name":"زمان‌بندی"},{"name":"تعامل"},{"name":"آنالیز"}]', '[{"name":"فالوور"},{"name":"نرخ تعامل"},{"name":"دسترسی"}]', 'شبکه اجتماعی'),
('تست و کنترل کیفیت', 'qa', 'BugReport', '#6366F1', 'تست و تضمین کیفیت', '[{"name":"برنامه‌ریزی تست"},{"name":"تست دستی"},{"name":"تست اتوماتیک"},{"name":"رفع باگ"},{"name":"تایید نهایی"}]', '[{"name":"باگ‌های یافت شده"},{"name":"باگ‌های رفع شده"},{"name":"پوشش تست"}]', 'کیفیت')
ON CONFLICT (slug) DO NOTHING;
