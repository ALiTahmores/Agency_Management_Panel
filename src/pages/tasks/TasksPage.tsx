import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, CircularProgress, Alert, Grid, List, ListItem,
  ListItemText, Divider, Tab, Tabs,
} from '@mui/material';
import {
  Add, Edit, CheckBoxOutlineBlank, CheckBox as CheckBoxIcon,
  Assignment, Delete,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { supabase, type Task, type Project, type Team, type Module, type Profile } from '../../lib/supabase';
import { useSearchParams } from 'react-router-dom';

const PRIORITY_COLORS: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
  critical: 'error', high: 'warning', medium: 'info', low: 'default',
};
const PRIORITY_LABELS: Record<string, string> = {
  critical: 'بحرانی', high: 'بالا', medium: 'متوسط', low: 'پایین',
};
const STATUS_LABELS: Record<string, string> = {
  todo: 'در انتظار', in_progress: 'در جریان', review: 'بررسی', done: 'انجام شد', cancelled: 'لغو شد',
};
const STATUS_COLOR: Record<string, 'default' | 'primary' | 'warning' | 'success' | 'error'> = {
  todo: 'default', in_progress: 'primary', review: 'warning', done: 'success', cancelled: 'error',
};

interface TaskFormData {
  title: string; description: string; priority: string; status: string;
  due_date: string; project_id: string; team_id: string; module_id: string;
  estimated_hours: string; assigned_to: string;
}

export default function TasksPage() {
  const { profile } = useAuth();
  const { currentProject } = useApp();
  const [searchParams] = useSearchParams();
  const qc = useQueryClient();
  const agencyId = profile?.agency_id;

  const [dialogOpen, setDialogOpen] = useState(searchParams.get('new') === '1');
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [form, setForm] = useState<TaskFormData>({
    title: '', description: '', priority: 'medium', status: 'todo',
    due_date: '', project_id: currentProject?.id ?? '', team_id: '', module_id: '', estimated_hours: '', assigned_to: '',
  });
  const [formError, setFormError] = useState('');

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', agencyId, currentProject?.id, filterStatus],
    queryFn: async () => {
      if (!agencyId) return [];
      let q = supabase.from('tasks').select('*').eq('agency_id', agencyId);
      if (currentProject) q = q.eq('project_id', currentProject.id);
      if (filterStatus !== 'all') q = q.eq('status', filterStatus);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!agencyId,
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects', agencyId],
    queryFn: async () => {
      const { data } = await supabase.from('projects').select('*').eq('agency_id', agencyId!).eq('is_archived', false);
      return data ?? [];
    },
    enabled: !!agencyId,
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ['teams', agencyId],
    queryFn: async () => {
      const { data } = await supabase.from('teams').select('*').eq('agency_id', agencyId!);
      return data ?? [];
    },
    enabled: !!agencyId,
  });

  const { data: modules = [] } = useQuery<Module[]>({
    queryKey: ['modules', agencyId],
    queryFn: async () => {
      const { data } = await supabase.from('modules').select('*').eq('agency_id', agencyId!).eq('status', 'active');
      return data ?? [];
    },
    enabled: !!agencyId,
  });

  const { data: profiles = [] } = useQuery<Profile[]>({
    queryKey: ['profiles', agencyId],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('agency_id', agencyId!);
      return data ?? [];
    },
    enabled: !!agencyId,
  });

  const mutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const payload = {
        ...data,
        agency_id: agencyId,
        project_id: data.project_id || currentProject?.id,
        team_id: data.team_id || null,
        module_id: data.module_id || null,
        assigned_to: data.assigned_to || null,
        due_date: data.due_date || null,
        estimated_hours: data.estimated_hours ? parseFloat(data.estimated_hours) : null,
      };
      if (editTask) {
        const { error } = await supabase.from('tasks').update(payload).eq('id', editTask.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('tasks').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); closeDialog(); },
    onError: (err: Error) => setFormError(err.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('tasks').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  function openNew() {
    setEditTask(null);
    setForm({ title: '', description: '', priority: 'medium', status: 'todo', due_date: '', project_id: currentProject?.id ?? '', team_id: '', module_id: '', estimated_hours: '', assigned_to: '' });
    setFormError('');
    setDialogOpen(true);
  }

  function openEdit(t: Task) {
    setEditTask(t);
    setForm({ title: t.title, description: t.description ?? '', priority: t.priority, status: t.status, due_date: t.due_date ?? '', project_id: t.project_id, team_id: t.team_id ?? '', module_id: t.module_id ?? '', estimated_hours: t.estimated_hours?.toString() ?? '', assigned_to: t.assigned_to ?? '' });
    setFormError('');
    setDialogOpen(true);
  }

  function closeDialog() { setDialogOpen(false); setEditTask(null); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title) { setFormError('عنوان وظیفه الزامی است'); return; }
    if (!form.project_id) { setFormError('لطفاً یک پروژه انتخاب کنید'); return; }
    mutation.mutate(form);
  }

  const statuses = ['all', 'todo', 'in_progress', 'review', 'done'];
  const statusTabLabels: Record<string, string> = { all: 'همه', ...STATUS_LABELS };

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>وظایف</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openNew}>وظیفه جدید</Button>
      </Box>

      {/* Filter tabs */}
      <Card sx={{ mb: 2.5 }}>
        <Tabs
          value={filterStatus}
          onChange={(_, v) => setFilterStatus(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {statuses.map(s => (
            <Tab
              key={s}
              value={s}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  {statusTabLabels[s]}
                  <Chip
                    label={s === 'all' ? tasks.length : tasks.filter(t => t.status === s).length}
                    size="small"
                    sx={{ height: 18, fontSize: '0.65rem' }}
                  />
                </Box>
              }
            />
          ))}
        </Tabs>
      </Card>

      {tasks.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 5 }}>
            <Assignment sx={{ fontSize: 48, color: 'grey.300', mb: 1.5 }} />
            <Typography variant="h6" color="text.secondary">وظیفه‌ای یافت نشد</Typography>
            <Button sx={{ mt: 2 }} variant="contained" startIcon={<Add />} onClick={openNew}>ایجاد وظیفه</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <List disablePadding>
            {tasks.map((task, i) => (
              <React.Fragment key={task.id}>
                {i > 0 && <Divider />}
                <ListItem
                  sx={{ py: 1.5, px: 2, '&:hover': { bgcolor: 'grey.50' } }}
                  secondaryAction={
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                      {task.status !== 'done' && (
                        <IconButton size="small" onClick={() => updateStatus.mutate({ id: task.id, status: 'done' })} title="تکمیل">
                          <CheckBoxOutlineBlank fontSize="small" />
                        </IconButton>
                      )}
                      {task.status === 'done' && (
                        <IconButton size="small" color="success">
                          <CheckBoxIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton size="small" onClick={() => openEdit(task)}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => { if (confirm('آیا از حذف این وظیفه مطمئن هستید؟')) deleteMutation.mutate(task.id); }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{task.title}</Typography>
                        <Chip label={PRIORITY_LABELS[task.priority]} size="small" color={PRIORITY_COLORS[task.priority]} sx={{ fontSize: '0.7rem', height: 20 }} />
                        <Chip label={STATUS_LABELS[task.status]} size="small" color={STATUS_COLOR[task.status]} variant="outlined" sx={{ fontSize: '0.7rem', height: 20 }} />
                      </Box>
                    }
                    secondary={
                      task.due_date
                        ? `موعد: ${new Date(task.due_date).toLocaleDateString('fa-IR')}`
                        : undefined
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>{editTask ? 'ویرایش وظیفه' : 'وظیفه جدید'}</DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField label="عنوان *" fullWidth value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <TextField label="توضیحات" fullWidth multiline rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 6 }}>
                <TextField label="اولویت" select fullWidth value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  {Object.entries(PRIORITY_LABELS).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField label="وضعیت" select fullWidth value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>
            <TextField label="پروژه *" select fullWidth value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}>
              {projects.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </TextField>
            <TextField label="مسئول" select fullWidth value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}>
              <MenuItem value="">— بدون مسئول —</MenuItem>
              {profiles.map(p => <MenuItem key={p.id} value={p.id}>{p.display_name}</MenuItem>)}
            </TextField>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 6 }}>
                <TextField label="تیم" select fullWidth value={form.team_id} onChange={e => setForm(f => ({ ...f, team_id: e.target.value }))}>
                  <MenuItem value="">— بدون تیم —</MenuItem>
                  {teams.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField label="ماژول" select fullWidth value={form.module_id} onChange={e => setForm(f => ({ ...f, module_id: e.target.value }))}>
                  <MenuItem value="">— بدون ماژول —</MenuItem>
                  {modules.map(m => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 6 }}>
                <TextField label="موعد تحویل" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField label="ساعات تخمینی" type="number" fullWidth value={form.estimated_hours} onChange={e => setForm(f => ({ ...f, estimated_hours: e.target.value }))} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={closeDialog}>انصراف</Button>
            <Button type="submit" variant="contained" disabled={mutation.isPending}>
              {mutation.isPending ? <CircularProgress size={18} color="inherit" /> : editTask ? 'ذخیره' : 'ایجاد'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
