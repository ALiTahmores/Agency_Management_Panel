import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Grid, Chip,
  LinearProgress, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, CircularProgress, Alert,
  Avatar,
} from '@mui/material';
import { Add, Edit, OpenInNew, FolderOpen } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { supabase, type Project, type Client } from '../../lib/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';

const STATUS_LABELS: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'default' | 'info' }> = {
  active: { label: 'فعال', color: 'success' },
  paused: { label: 'متوقف', color: 'warning' },
  completed: { label: 'تکمیل شده', color: 'info' },
  cancelled: { label: 'لغو شده', color: 'error' },
  waiting: { label: 'در انتظار', color: 'default' },
};

interface ProjectFormData {
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
  website_url: string;
  client_id: string;
  color: string;
}

const COLORS = ['#2563EB', '#7C3AED', '#EF4444', '#10B981', '#F59E0B', '#EC4899', '#06B6D4'];

export default function ProjectsPage() {
  const { profile } = useAuth();
  const { setCurrentProject } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qc = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(searchParams.get('new') === '1');
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectFormData>({
    name: '', description: '', status: 'active',
    start_date: '', end_date: '', website_url: '', client_id: '', color: '#2563EB',
  });
  const [formError, setFormError] = useState('');

  const agencyId = profile?.agency_id;

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects', agencyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects').select('*')
        .eq('agency_id', agencyId!).eq('is_archived', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!agencyId,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients', agencyId],
    queryFn: async () => {
      const { data } = await supabase.from('clients').select('*').eq('agency_id', agencyId!);
      return data ?? [];
    },
    enabled: !!agencyId,
  });

  const mutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\u0600-\u06FF-]/g, '') + '-' + Date.now().toString().slice(-4);
      const payload = {
        ...data,
        agency_id: agencyId,
        slug,
        client_id: data.client_id || null,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        website_url: data.website_url || null,
      };
      if (editProject) {
        const { error } = await supabase.from('projects').update(payload).eq('id', editProject.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('projects').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      closeDialog();
    },
    onError: (err: Error) => setFormError(err.message),
  });

  function openNew() {
    setEditProject(null);
    setForm({ name: '', description: '', status: 'active', start_date: '', end_date: '', website_url: '', client_id: '', color: '#2563EB' });
    setFormError('');
    setDialogOpen(true);
  }

  function openEdit(p: Project) {
    setEditProject(p);
    setForm({
      name: p.name, description: p.description ?? '', status: p.status,
      start_date: p.start_date ?? '', end_date: p.end_date ?? '',
      website_url: p.website_url ?? '', client_id: p.client_id ?? '', color: p.color,
    });
    setFormError('');
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditProject(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) { setFormError('نام پروژه الزامی است'); return; }
    mutation.mutate(form);
  }

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>پروژه‌ها</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openNew}>پروژه جدید</Button>
      </Box>

      {projects.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <FolderOpen sx={{ fontSize: 56, color: 'grey.300', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>هیچ پروژه‌ای وجود ندارد</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>اولین پروژه خود را ایجاد کنید</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={openNew}>ایجاد پروژه</Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {projects.map(p => {
            const st = STATUS_LABELS[p.status] ?? STATUS_LABELS.active;
            return (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={p.id}>
                <Card
                  sx={{
                    cursor: 'pointer', transition: 'box-shadow 0.2s',
                    '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.1)', transform: 'translateY(-1px)' },
                    borderTop: `3px solid ${p.color}`,
                  }}
                  onClick={() => { setCurrentProject(p); navigate('/dashboard'); }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{p.name}</Typography>
                        {p.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }} noWrap>{p.description}</Typography>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                        <IconButton size="small" onClick={e => { e.stopPropagation(); openEdit(p); }}>
                          <Edit fontSize="small" />
                        </IconButton>
                        {p.website_url && (
                          <IconButton size="small" onClick={e => { e.stopPropagation(); window.open(p.website_url!, '_blank'); }}>
                            <OpenInNew fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip label={st.label} size="small" color={st.color} />
                    </Box>

                    <Box sx={{ mb: 0.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">پیشرفت</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: p.color }}>{p.progress}%</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={p.progress}
                        sx={{ '& .MuiLinearProgress-bar': { bgcolor: p.color }, bgcolor: p.color + '20' }}
                      />
                    </Box>

                    {(p.start_date || p.end_date) && (
                      <Box sx={{ display: 'flex', gap: 2, mt: 1.5 }}>
                        {p.start_date && (
                          <Typography variant="caption" color="text.secondary">
                            شروع: {new Date(p.start_date).toLocaleDateString('fa-IR')}
                          </Typography>
                        )}
                        {p.end_date && (
                          <Typography variant="caption" color="text.secondary">
                            پایان: {new Date(p.end_date).toLocaleDateString('fa-IR')}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {editProject ? 'ویرایش پروژه' : 'پروژه جدید'}
          </DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField label="نام پروژه *" fullWidth value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <TextField label="توضیحات" fullWidth multiline rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <TextField label="وضعیت" select fullWidth value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {Object.entries(STATUS_LABELS).map(([v, l]) => <MenuItem key={v} value={v}>{l.label}</MenuItem>)}
            </TextField>
            {clients.length > 0 && (
              <TextField label="مشتری" select fullWidth value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
                <MenuItem value="">— بدون مشتری —</MenuItem>
                {clients.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            )}
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 6 }}>
                <TextField label="تاریخ شروع" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField label="تاریخ پایان" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </Grid>
            </Grid>
            <TextField label="آدرس سایت" dir="ltr" fullWidth value={form.website_url} onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))} inputProps={{ style: { textAlign: 'left' } }} />
            <Box>
              <Typography variant="caption" sx={{ mb: 0.75, display: 'block' }}>رنگ پروژه</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {COLORS.map(c => (
                  <Avatar
                    key={c}
                    sx={{
                      width: 28, height: 28, bgcolor: c, cursor: 'pointer',
                      border: form.color === c ? '2px solid #0F172A' : '2px solid transparent',
                      transition: 'border 0.15s',
                    }}
                    onClick={() => setForm(f => ({ ...f, color: c }))}
                  >
                    {' '}
                  </Avatar>
                ))}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={closeDialog}>انصراف</Button>
            <Button type="submit" variant="contained" disabled={mutation.isPending}>
              {mutation.isPending ? <CircularProgress size={18} color="inherit" /> : editProject ? 'ذخیره' : 'ایجاد'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
