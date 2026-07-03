import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Grid, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  CircularProgress, Alert, Chip, Switch, FormControlLabel,
  IconButton, Tooltip, Tab, Tabs,
} from '@mui/material';
import {
  Add, Edit, Archive, Extension, TravelExplore, Code, Palette,
  Article, Campaign, Share, BugReport,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, type Module, type ModuleTemplate } from '../../lib/supabase';

const ICON_OPTIONS = [
  { name: 'Extension', icon: Extension, label: 'پیش‌فرض' },
  { name: 'TravelExplore', icon: TravelExplore, label: 'سئو' },
  { name: 'Code', icon: Code, label: 'توسعه' },
  { name: 'Palette', icon: Palette, label: 'طراحی' },
  { name: 'Article', icon: Article, label: 'محتوا' },
  { name: 'Campaign', icon: Campaign, label: 'تبلیغات' },
  { name: 'Share', icon: Share, label: 'شبکه اجتماعی' },
  { name: 'BugReport', icon: BugReport, label: 'تست' },
];

const MODULE_COLORS = ['#2563EB', '#7C3AED', '#EF4444', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'];

const ICON_MAP: Record<string, React.ElementType> = {
  Extension, TravelExplore, Code, Palette, Article, Campaign, Share, BugReport,
};

interface ModuleFormData {
  name: string; slug: string; icon: string; color: string;
  description: string; show_in_sidebar: boolean;
}

export default function ModulesPage() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const agencyId = profile?.agency_id;

  const [tab, setTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editModule, setEditModule] = useState<Module | null>(null);
  const [form, setForm] = useState<ModuleFormData>({
    name: '', slug: '', icon: 'Extension', color: '#2563EB', description: '', show_in_sidebar: true,
  });
  const [formError, setFormError] = useState('');

  const { data: modules = [], isLoading } = useQuery<Module[]>({
    queryKey: ['modules-all', agencyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('modules').select('*').eq('agency_id', agencyId!).order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!agencyId,
  });

  const { data: templates = [] } = useQuery<ModuleTemplate[]>({
    queryKey: ['module-templates'],
    queryFn: async () => {
      const { data } = await supabase.from('module_templates').select('*');
      return (data ?? []) as ModuleTemplate[];
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ModuleFormData) => {
      if (editModule) {
        const { error } = await supabase.from('modules').update(data).eq('id', editModule.id);
        if (error) throw error;
      } else {
        const payload = { ...data, agency_id: agencyId, status: 'active', is_active: true, sort_order: modules.length };
        const { error } = await supabase.from('modules').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['modules'] }); qc.invalidateQueries({ queryKey: ['modules-all'] }); closeDialog(); },
    onError: (err: Error) => setFormError(err.message),
  });

  const toggleSidebar = useMutation({
    mutationFn: async ({ id, show }: { id: string; show: boolean }) => {
      const { error } = await supabase.from('modules').update({ show_in_sidebar: show }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['modules'] }); qc.invalidateQueries({ queryKey: ['modules-all'] }); },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('modules').update({ status: 'archived' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['modules'] }); qc.invalidateQueries({ queryKey: ['modules-all'] }); },
  });

  function openNew() {
    setEditModule(null);
    setForm({ name: '', slug: '', icon: 'Extension', color: '#2563EB', description: '', show_in_sidebar: true });
    setFormError('');
    setDialogOpen(true);
  }

  function openFromTemplate(t: ModuleTemplate) {
    setEditModule(null);
    setForm({ name: t.name, slug: t.slug + '-' + Date.now().toString().slice(-3), icon: t.icon, color: t.color, description: t.description ?? '', show_in_sidebar: true });
    setFormError('');
    setDialogOpen(true);
  }

  function openEdit(m: Module) {
    setEditModule(m);
    setForm({ name: m.name, slug: m.slug, icon: m.icon, color: m.color, description: m.description ?? '', show_in_sidebar: m.show_in_sidebar });
    setFormError('');
    setDialogOpen(true);
  }

  function closeDialog() { setDialogOpen(false); setEditModule(null); }

  function handleNameChange(name: string) {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setForm(f => ({ ...f, name, slug }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) { setFormError('نام ماژول الزامی است'); return; }
    mutation.mutate(form);
  }

  const activeModules = modules.filter(m => m.status === 'active');
  const archivedModules = modules.filter(m => m.status === 'archived');

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>مدیریت ماژول‌ها</Typography>
          <Typography variant="body2" color="text.secondary">ماژول‌های سرویس‌دهی آژانس خود را مدیریت کنید</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openNew}>ماژول جدید</Button>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2.5, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label={`ماژول‌های فعال (${activeModules.length})`} />
        <Tab label="پیشنهادات قالب" />
        <Tab label={`آرشیو (${archivedModules.length})`} />
      </Tabs>

      {/* Active modules */}
      {tab === 0 && (
        <>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>
          ) : activeModules.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 5 }}>
                <Extension sx={{ fontSize: 56, color: 'grey.300', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>هیچ ماژولی تعریف نشده</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  از قالب‌های پیشنهادی استفاده کنید یا ماژول سفارشی بسازید
                </Typography>
                <Button variant="contained" startIcon={<Add />} onClick={openNew}>ساخت ماژول</Button>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {activeModules.map(mod => {
                const Icon = ICON_MAP[mod.icon] ?? Extension;
                return (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={mod.id}>
                    <Card sx={{ borderRight: `4px solid ${mod.color}` }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ bgcolor: mod.color + '20', width: 40, height: 40, borderRadius: 2 }}>
                              <Icon sx={{ color: mod.color, fontSize: 22 }} />
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{mod.name}</Typography>
                              <Typography variant="caption" color="text.secondary" dir="ltr">{mod.slug}</Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="ویرایش">
                              <IconButton size="small" onClick={() => openEdit(mod)}>
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="آرشیو">
                              <IconButton size="small" onClick={() => archiveMutation.mutate(mod.id)}>
                                <Archive fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                        {mod.description && (
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                            {mod.description}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <FormControlLabel
                            control={
                              <Switch
                                size="small"
                                checked={mod.show_in_sidebar}
                                onChange={e => toggleSidebar.mutate({ id: mod.id, show: e.target.checked })}
                              />
                            }
                            label={<Typography variant="caption">نمایش در سایدبار</Typography>}
                          />
                          <Chip label="فعال" size="small" color="success" sx={{ fontSize: '0.7rem', height: 20 }} />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </>
      )}

      {/* Templates */}
      {tab === 1 && (
        <Grid container spacing={2}>
          {templates.map(t => {
            const Icon = ICON_MAP[t.icon] ?? Extension;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={t.id}>
                <Card
                  sx={{
                    cursor: 'pointer', transition: 'all 0.2s',
                    '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.1)', borderColor: t.color },
                    borderColor: 'divider',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Avatar sx={{ bgcolor: t.color + '20', width: 40, height: 40, borderRadius: 2 }}>
                        <Icon sx={{ color: t.color, fontSize: 22 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{t.name}</Typography>
                        {t.category && <Chip label={t.category} size="small" sx={{ fontSize: '0.65rem', height: 18 }} />}
                      </Box>
                    </Box>
                    {t.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.8rem' }}>
                        {t.description}
                      </Typography>
                    )}
                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>مراحل:</Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                        {(t.stages as Array<{ name: string }>).map((s, i) => (
                          <Chip key={i} label={s.name} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 18 }} />
                        ))}
                      </Box>
                    </Box>
                    <Button
                      size="small"
                      variant="outlined"
                      fullWidth
                      onClick={() => openFromTemplate(t)}
                      sx={{ mt: 0.5 }}
                    >
                      استفاده از این قالب
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Archived */}
      {tab === 2 && (
        <Grid container spacing={2}>
          {archivedModules.length === 0 ? (
            <Grid size={{ xs: 12 }}>
              <Card><CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">آرشیوی وجود ندارد</Typography>
              </CardContent></Card>
            </Grid>
          ) : archivedModules.map(mod => {
            const Icon = ICON_MAP[mod.icon] ?? Extension;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={mod.id}>
                <Card sx={{ opacity: 0.6 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ bgcolor: mod.color + '20', width: 36, height: 36, borderRadius: 2 }}>
                        <Icon sx={{ color: mod.color, fontSize: 18 }} />
                      </Avatar>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{mod.name}</Typography>
                      <Chip label="آرشیو" size="small" color="default" sx={{ mr: 'auto', fontSize: '0.65rem' }} />
                    </Box>
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
          <DialogTitle sx={{ fontWeight: 700 }}>{editModule ? 'ویرایش ماژول' : 'ماژول جدید'}</DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="نام ماژول *"
              fullWidth
              value={form.name}
              onChange={e => handleNameChange(e.target.value)}
            />
            <TextField
              label="شناسه (slug)"
              fullWidth
              dir="ltr"
              inputProps={{ style: { textAlign: 'left' } }}
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              helperText="شناسه منحصربفرد برای URL"
            />
            <TextField label="توضیحات" fullWidth multiline rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />

            {/* Icon selection */}
            <Box>
              <Typography variant="caption" sx={{ mb: 0.75, display: 'block', fontWeight: 600 }}>آیکون</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {ICON_OPTIONS.map(opt => {
                  const Icon = opt.icon;
                  return (
                    <Tooltip key={opt.name} title={opt.label}>
                      <Avatar
                        sx={{
                          width: 36, height: 36, borderRadius: 1.5, cursor: 'pointer',
                          bgcolor: form.icon === opt.name ? form.color : 'grey.100',
                          border: form.icon === opt.name ? `2px solid ${form.color}` : '2px solid transparent',
                          transition: 'all 0.15s',
                        }}
                        onClick={() => setForm(f => ({ ...f, icon: opt.name }))}
                      >
                        <Icon sx={{ fontSize: 18, color: form.icon === opt.name ? 'white' : 'grey.500' }} />
                      </Avatar>
                    </Tooltip>
                  );
                })}
              </Box>
            </Box>

            {/* Color selection */}
            <Box>
              <Typography variant="caption" sx={{ mb: 0.75, display: 'block', fontWeight: 600 }}>رنگ</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {MODULE_COLORS.map(c => (
                  <Avatar
                    key={c}
                    sx={{
                      width: 28, height: 28, bgcolor: c, cursor: 'pointer',
                      border: form.color === c ? '2px solid #0F172A' : '2px solid transparent',
                    }}
                    onClick={() => setForm(f => ({ ...f, color: c }))}
                  >
                    {' '}
                  </Avatar>
                ))}
              </Box>
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={form.show_in_sidebar}
                  onChange={e => setForm(f => ({ ...f, show_in_sidebar: e.target.checked }))}
                />
              }
              label="نمایش در سایدبار"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={closeDialog}>انصراف</Button>
            <Button type="submit" variant="contained" disabled={mutation.isPending}>
              {mutation.isPending ? <CircularProgress size={18} color="inherit" /> : editModule ? 'ذخیره' : 'ایجاد'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
