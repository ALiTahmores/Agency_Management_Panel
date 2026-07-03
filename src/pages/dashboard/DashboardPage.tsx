import React from 'react';
import {
  Box, Card, CardContent, Typography, Grid, LinearProgress,
  Button, Chip, Alert, AlertTitle, List, ListItem, ListItemText, Divider,
} from '@mui/material';
import {
  TrendingUp, Warning, CheckCircle, Schedule, Shield,
  ArrowForwardIos, Add,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { supabase, type Task, type Team, type Project } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface StatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg: string;
}

function StatCard({ title, value, subtitle, icon, iconBg }: StatCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: '16px !important' }}>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1 }}>
            {value}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, fontWeight: 500 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600, display: 'block', mt: 0.25 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            width: 48, height: 48, borderRadius: 2,
            bgcolor: iconBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </CardContent>
    </Card>
  );
}

function priorityLabel(priority: string) {
  const map: Record<string, { label: string; color: 'error' | 'warning' | 'info' | 'default' }> = {
    critical: { label: 'بحرانی', color: 'error' },
    high: { label: 'بالا', color: 'warning' },
    medium: { label: 'متوسط', color: 'info' },
    low: { label: 'پایین', color: 'default' },
  };
  return map[priority] ?? { label: priority, color: 'default' };
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    todo: 'در انتظار',
    in_progress: 'در جریان',
    review: 'بررسی',
    done: 'انجام شد',
    cancelled: 'لغو شد',
  };
  return map[status] ?? status;
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const { currentProject } = useApp();
  const navigate = useNavigate();

  const agencyId = profile?.agency_id;

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['tasks-dashboard', agencyId, currentProject?.id],
    queryFn: async () => {
      if (!agencyId) return [];
      let q = supabase.from('tasks').select('*').eq('agency_id', agencyId);
      if (currentProject) q = q.eq('project_id', currentProject.id);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!agencyId,
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ['teams', agencyId],
    queryFn: async () => {
      if (!agencyId) return [];
      const { data, error } = await supabase.from('teams').select('*').eq('agency_id', agencyId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!agencyId,
  });

  const { data: allProjects = [] } = useQuery<Project[]>({
    queryKey: ['all-projects-dashboard', agencyId],
    queryFn: async () => {
      if (!agencyId) return [];
      const { data, error } = await supabase.from('projects').select('*').eq('agency_id', agencyId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!agencyId,
  });

  // Compute stats
  const activeProjects = allProjects.filter(p => p.status === 'active').length;
  const waitingProjects = allProjects.filter(p => p.status === 'waiting').length;
  const completedProjects = allProjects.filter(p => p.status === 'completed').length;
  const delayedProjects = allProjects.filter(p => p.end_date && new Date(p.end_date) < new Date() && p.status !== 'completed').length;
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress' || t.status === 'todo').length;
  const criticalTasks = tasks.filter(t => t.priority === 'critical' && t.status !== 'done').length;
  const activeTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled');

  return (
    <Box>
      {/* WordPress connection banner – only show if project has website_url */}
      {currentProject?.website_url && (
        <Alert
          severity="success"
          sx={{ mb: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'success.light' }}
          action={
            <Button
              size="small"
              endIcon={<ArrowForwardIos sx={{ fontSize: 12 }} />}
              sx={{ whiteSpace: 'nowrap' }}
              onClick={() => window.open(currentProject.website_url!, '_blank')}
            >
              مدیریت اتصال فنی وردپرس
            </Button>
          }
        >
          <AlertTitle sx={{ fontWeight: 600, mb: 0 }}>
            وردپرس متصل است: <strong dir="ltr">{currentProject.website_url}</strong>
          </AlertTitle>
        </Alert>
      )}

      {/* Section header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          آمار کلی پروژه‌ها
        </Typography>
      </Box>

      {/* Project stats row */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="پروژه‌های فعال"
            value={activeProjects}
            subtitle="در دست اقدام تیم‌ها"
            icon={<TrendingUp sx={{ color: '#10B981' }} />}
            iconBg="#D1FAE5"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="پروژه‌های در انتظار"
            value={waitingProjects}
            subtitle="منتظر تایید قرارداد"
            icon={<Schedule sx={{ color: '#F59E0B' }} />}
            iconBg="#FEF3C7"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="پروژه‌های تکمیل شده"
            value={completedProjects}
            subtitle="آرشیو شده و تحویل نهایی"
            icon={<CheckCircle sx={{ color: '#3B82F6' }} />}
            iconBg="#DBEAFE"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="پروژه‌های دارای تأخیر"
            value={delayedProjects}
            subtitle="بازبینی ددلاین"
            icon={<Warning sx={{ color: '#EF4444' }} />}
            iconBg="#FEE2E2"
          />
        </Grid>
      </Grid>

      {/* Section header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          کارایی وظایف و تیم‌های اجرایی
        </Typography>
      </Box>

      {/* Task stats row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="تعداد کل وظایف"
            value={totalTasks}
            icon={
              <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ color: 'white', fontSize: 10, fontWeight: 700 }}>~</Typography>
              </Box>
            }
            iconBg="#DBEAFE"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="وظایف تکمیل شده"
            value={doneTasks}
            icon={<CheckCircle sx={{ color: '#10B981' }} />}
            iconBg="#D1FAE5"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="وظایف در جریان و باز"
            value={inProgressTasks}
            icon={<Schedule sx={{ color: '#F59E0B' }} />}
            iconBg="#FEF3C7"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="وظایف بحرانی باز"
            value={criticalTasks}
            icon={<Shield sx={{ color: '#EF4444' }} />}
            iconBg="#FEE2E2"
          />
        </Grid>
      </Grid>

      {/* Bottom two panels */}
      <Grid container spacing={2.5}>
        {/* Team progress */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                پیشرفت هر تیم
              </Typography>
              {teams.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    هنوز تیمی تعریف نشده است
                  </Typography>
                  <Button size="small" variant="outlined" startIcon={<Add />} onClick={() => navigate('/teams')}>
                    ایجاد تیم
                  </Button>
                </Box>
              ) : (
                <List disablePadding>
                  {teams.map((team, i) => {
                    const teamTasks = tasks.filter(t => t.team_id === team.id);
                    const teamDone = teamTasks.filter(t => t.status === 'done').length;
                    const pct = teamTasks.length > 0 ? Math.round((teamDone / teamTasks.length) * 100) : 0;
                    return (
                      <ListItem key={team.id} disablePadding sx={{ mb: i < teams.length - 1 ? 1.5 : 0 }}>
                        <Box sx={{ width: '100%' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{team.name}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              ({teamDone}/{teamTasks.length}) {pct}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={pct}
                            sx={{
                              '& .MuiLinearProgress-bar': { bgcolor: team.color },
                              bgcolor: team.color + '20',
                            }}
                          />
                        </Box>
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Active tasks */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  وظایف فعال
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label={`${activeTasks.length} مورد`} size="small" />
                  <Button
                    size="small"
                    endIcon={<ArrowForwardIos sx={{ fontSize: 12 }} />}
                    onClick={() => navigate('/tasks')}
                    sx={{ fontSize: '0.78rem' }}
                  >
                    مشاهده همه وظایف
                  </Button>
                </Box>
              </Box>

              {activeTasks.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    هیچ وظیفه فعالی وجود ندارد
                  </Typography>
                  <Button size="small" variant="outlined" startIcon={<Add />} onClick={() => navigate('/tasks?new=1')}>
                    ایجاد وظیفه
                  </Button>
                </Box>
              ) : (
                <List disablePadding>
                  {activeTasks.slice(0, 6).map((task, i) => {
                    const pLabel = priorityLabel(task.priority);
                    return (
                      <React.Fragment key={task.id}>
                        {i > 0 && <Divider />}
                        <ListItem
                          disablePadding
                          sx={{ py: 1, cursor: 'pointer', '&:hover': { bgcolor: 'grey.50' }, px: 0.5, borderRadius: 1 }}
                          onClick={() => navigate(`/tasks/${task.id}`)}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }} noWrap>
                                  {task.title}
                                </Typography>
                                <Chip
                                  label={pLabel.label}
                                  size="small"
                                  color={pLabel.color}
                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                                <Chip
                                  label={statusLabel(task.status)}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                              </Box>
                            }
                            secondary={task.due_date ? `موعد: ${new Date(task.due_date).toLocaleDateString('fa-IR')}` : undefined}
                          />
                        </ListItem>
                      </React.Fragment>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
