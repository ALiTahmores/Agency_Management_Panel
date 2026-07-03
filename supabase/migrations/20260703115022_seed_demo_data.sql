/*
# Demo Seed Data for آژانس نمونه

Creates sample teams, projects, tasks, and notifications for the
existing demo owner account (owner@final-agency.io).

Agency ID: 9d3d9bc0-ebc3-4707-8eb3-8bc956b02528
Profile ID: 9ce4676d-4307-4190-afad-053da8006ccd
*/

DO $$
DECLARE
  v_agency_id uuid := '9d3d9bc0-ebc3-4707-8eb3-8bc956b02528';
  v_profile_id uuid := '9ce4676d-4307-4190-afad-053da8006ccd';
  v_team_design uuid;
  v_team_dev uuid;
  v_team_seo uuid;
  v_project1 uuid;
  v_project2 uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM teams WHERE agency_id = v_agency_id) THEN
    RETURN;
  END IF;

  -- Teams
  v_team_design := gen_random_uuid();
  v_team_dev := gen_random_uuid();
  v_team_seo := gen_random_uuid();

  INSERT INTO teams (id, agency_id, name, color, description) VALUES
    (v_team_design, v_agency_id, 'تیم طراحی', '#7C3AED', 'طراحی رابط کاربری و تجربه کاربری'),
    (v_team_dev,    v_agency_id, 'تیم توسعه', '#2563EB', 'برنامه‌نویسی فرانت و بک‌اند'),
    (v_team_seo,    v_agency_id, 'تیم سئو',   '#10B981', 'بهینه‌سازی موتور جستجو');

  -- Projects
  v_project1 := gen_random_uuid();
  v_project2 := gen_random_uuid();

  INSERT INTO projects (id, agency_id, name, slug, description, status, progress, color, start_date, end_date, created_by) VALUES
    (v_project1, v_agency_id, 'سایت شرکت آریا', 'aria-website-' || floor(random()*9000+1000)::text,
     'طراحی و توسعه وب‌سایت شرکت آریا تکنولوژی', 'active', 45, '#2563EB',
     current_date - interval '30 days', current_date + interval '60 days', v_profile_id),
    (v_project2, v_agency_id, 'فروشگاه آنلاین ستاره', 'star-shop-' || floor(random()*9000+1000)::text,
     'راه‌اندازی فروشگاه اینترنتی با وردپرس و ووکامرس', 'active', 20, '#7C3AED',
     current_date - interval '10 days', current_date + interval '90 days', v_profile_id);

  -- Tasks for project 1
  INSERT INTO tasks (agency_id, project_id, team_id, created_by, title, description, priority, status, due_date) VALUES
    (v_agency_id, v_project1, v_team_design, v_profile_id, 'طراحی صفحه اصلی', 'طراحی هدر، هیرو سکشن و فوتر', 'high', 'in_progress', current_date + interval '7 days'),
    (v_agency_id, v_project1, v_team_design, v_profile_id, 'طراحی صفحه درباره ما', 'محتوا و چیدمان بخش درباره ما', 'medium', 'todo', current_date + interval '14 days'),
    (v_agency_id, v_project1, v_team_dev,    v_profile_id, 'راه‌اندازی هاستینگ', 'خرید هاست و انتقال دامنه', 'high', 'done', current_date - interval '5 days'),
    (v_agency_id, v_project1, v_team_dev,    v_profile_id, 'نصب وردپرس', 'نصب و پیکربندی اولیه وردپرس', 'medium', 'done', current_date - interval '3 days'),
    (v_agency_id, v_project1, v_team_dev,    v_profile_id, 'برنامه‌نویسی فرم تماس', 'فرم تماس با اعتبارسنجی و ایمیل', 'medium', 'in_progress', current_date + interval '5 days'),
    (v_agency_id, v_project1, v_team_seo,    v_profile_id, 'بهینه‌سازی تصاویر', 'فشرده‌سازی و WebP', 'low', 'todo', current_date + interval '20 days'),
    (v_agency_id, v_project1, v_team_seo,    v_profile_id, 'بررسی سئو صفحات', 'تحلیل کلمات کلیدی و محتوا', 'medium', 'review', current_date + interval '2 days');

  -- Tasks for project 2
  INSERT INTO tasks (agency_id, project_id, team_id, created_by, title, description, priority, status, due_date) VALUES
    (v_agency_id, v_project2, v_team_dev,    v_profile_id, 'نصب ووکامرس', 'نصب و تنظیم افزونه ووکامرس', 'critical', 'in_progress', current_date + interval '3 days'),
    (v_agency_id, v_project2, v_team_design, v_profile_id, 'طراحی صفحه محصول', 'صفحه نمایش محصولات', 'high', 'todo', current_date + interval '10 days'),
    (v_agency_id, v_project2, v_team_dev,    v_profile_id, 'اتصال درگاه پرداخت', 'یکپارچه‌سازی با درگاه بانکی', 'critical', 'todo', current_date - interval '1 days');

  -- Notifications (2 unread)
  INSERT INTO notifications (agency_id, recipient_id, type, title, body, link, is_read) VALUES
    (v_agency_id, v_profile_id, 'task_due',      'موعد وظیفه نزدیک است', 'وظیفه «نصب ووکامرس» تا ۳ روز دیگر موعد دارد', '/tasks', false),
    (v_agency_id, v_profile_id, 'project_update','پیشرفت پروژه آریا', 'پروژه سایت شرکت آریا به ۴۵٪ پیشرفت رسید', '/dashboard', false),
    (v_agency_id, v_profile_id, 'task_due',      'وظیفه بحرانی دیر شد', 'وظیفه «اتصال درگاه پرداخت» از موعد گذشته', '/tasks', false);

END $$;
