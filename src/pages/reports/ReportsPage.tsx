import React from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Chip,
  LinearProgress,
} from '@mui/material';
import { BarChart, TrendingUp, Assignment } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, type Task, type Project, type Team } from '../../lib/supabase';

export default function ReportsPage() {
  const { profile } = useAuth();
  const agencyId = profile?.agency_id;

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['tasks-reports', agencyId],
    queryFn: async () => {
      if (!agencyId) return [];
      const { data } = await supabase.from('tasks').select('*').eq('agency_id', agencyId);
      return data ?? [];
    },
    enabled: !!agencyId,
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects', agencyId],
    queryFn: async () => {
      if (!agencyId) return [];
      const { data } = await supabase.from('projects').select('*').eq('agency_id', agencyId);
      return data ?? [];
    },
    enabled: !!agencyId,
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ['teams', agencyId],
    queryFn: async () => {
      if (!agencyId) return [];
      const { data } = await supabase.from('teams').select('*').eq('agency_id', agencyId);
      return data ?? [];
    },
    enabled: !!agencyId,
  });

  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'done').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const todo = tasks.filter(t => t.status === 'todo').length;
  const critical = tasks.filter(t => t.priority === 'critical').length;
  const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length;
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  const statCards = [
    { title: 'نرخ تکمیل وظایف', value: `${completionRate}%`, icon: <TrendingUp />, color: '#10B981', bg: '#D1FAE5' },
    { title: 'کل وظایف', value: total, icon: <Assignment />, color: '#3B82F6', bg: '#DBEAFE' },
    { title: 'کل پروژه‌ها', value: projects.length, icon: <BarChart />, color: '#7C3AED', bg: '#EDE9FE' },
    { title: 'وظایف بحرانی', value: critical, icon: <Assignment />, color: '#EF4444', bg: '#FEE2E2' },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>گزارش‌ها</Typography>

      {/* Overview cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCards.map(c => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={c.title}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: '16px !important' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>{c.value}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{c.title}</Typography>
                </Box>
                <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {React.cloneElement(c.icon, { sx: { color: c.color } } as any)}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5}>
        {/* Task status breakdown */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>وضعیت وظایف</Typography>
              {[
                { label: 'انجام شده', value: done, color: '#10B981' },
                { label: 'در جریان', value: inProgress, color: '#3B82F6' },
                { label: 'در انتظار', value: todo, color: '#F59E0B' },
                { label: 'معوقه', value: overdue, color: '#EF4444' },
              ].map(item => (
                <Box key={item.label} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">{item.label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.value} ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={total > 0 ? (item.value / total) * 100 : 0}
                    sx={{ '& .MuiLinearProgress-bar': { bgcolor: item.color }, bgcolor: item.color + '20' }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Team workload */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>بار کاری تیم‌ها</Typography>
              {teams.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  هیچ تیمی تعریف نشده
                </Typography>
              ) : teams.map(team => {
                const teamTasks = tasks.filter(t => t.team_id === team.id);
                const teamDone = teamTasks.filter(t => t.status === 'done').length;
                const pct = teamTasks.length > 0 ? Math.round((teamDone / teamTasks.length) * 100) : 0;
                return (
                  <Box key={team.id} sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{team.name}</Typography>
                      <Chip label={`${teamTasks.length} وظیفه`} size="small" sx={{ fontSize: '0.7rem', height: 20 }} />
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      sx={{ '& .MuiLinearProgress-bar': { bgcolor: team.color }, bgcolor: team.color + '20' }}
                    />
                    <Typography variant="caption" color="text.secondary">{pct}% تکمیل</Typography>
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        </Grid>

        {/* Project summary */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>وضعیت پروژه‌ها</Typography>
              {projects.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  هیچ پروژه‌ای وجود ندارد
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {projects.map(p => {
                    const pt = tasks.filter(t => t.project_id === p.id);
                    const pd = pt.filter(t => t.status === 'done').length;
                    return (
                      <Box key={p.id} sx={{ minWidth: 220, flex: '1 1 220px' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.name}</Typography>
                          <Typography variant="caption" sx={{ color: p.color, fontWeight: 600 }}>{p.progress}%</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={p.progress}
                          sx={{ mb: 0.5, '& .MuiLinearProgress-bar': { bgcolor: p.color }, bgcolor: p.color + '20' }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {pd}/{pt.length} وظیفه تکمیل
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
