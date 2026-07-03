import {
  Box, Card, CardContent, Typography, Chip, Grid, CircularProgress,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, type Module, type Task } from '../../lib/supabase';

const STATUS_LABELS: Record<string, string> = {
  todo: 'در انتظار', in_progress: 'در جریان', review: 'بررسی', done: 'انجام شد', cancelled: 'لغو شد',
};
const STATUS_COLOR: Record<string, 'default' | 'primary' | 'warning' | 'success' | 'error'> = {
  todo: 'default', in_progress: 'primary', review: 'warning', done: 'success', cancelled: 'error',
};

export default function ModuleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { profile } = useAuth();
  const agencyId = profile?.agency_id;

  const { data: mod, isLoading: modLoading } = useQuery<Module | null>({
    queryKey: ['module-detail', agencyId, slug],
    queryFn: async () => {
      if (!agencyId || !slug) return null;
      const { data } = await supabase.from('modules').select('*').eq('agency_id', agencyId).eq('slug', slug).maybeSingle();
      return data as Module | null;
    },
    enabled: !!agencyId && !!slug,
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['tasks-module', agencyId, mod?.id],
    queryFn: async () => {
      if (!agencyId || !mod?.id) return [];
      const { data } = await supabase.from('tasks').select('*').eq('agency_id', agencyId).eq('module_id', mod.id).order('created_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!agencyId && !!mod?.id,
  });

  if (modLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;
  if (!mod) return <Box><Typography color="text.secondary">ماژول یافت نشد</Typography></Box>;

  const statusGroups = ['todo', 'in_progress', 'review', 'done'];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box
          sx={{
            width: 40, height: 40, borderRadius: 2,
            bgcolor: mod.color + '20',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Box sx={{ width: 20, height: 20, bgcolor: mod.color, borderRadius: 1 }} />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{mod.name}</Typography>
          {mod.description && <Typography variant="body2" color="text.secondary">{mod.description}</Typography>}
        </Box>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statusGroups.map(s => {
          const count = tasks.filter(t => t.status === s).length;
          return (
            <Grid size={{ xs: 6, sm: 3 }} key={s}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: '12px !important' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>{count}</Typography>
                  <Chip label={STATUS_LABELS[s]} size="small" color={STATUS_COLOR[s]} sx={{ mt: 0.5, fontSize: '0.7rem' }} />
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Kanban-style columns */}
      <Grid container spacing={2}>
        {statusGroups.map(s => {
          const groupTasks = tasks.filter(t => t.status === s);
          return (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={s}>
              <Box sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 1.5, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Chip label={STATUS_LABELS[s]} size="small" color={STATUS_COLOR[s]} />
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{groupTasks.length}</Typography>
                </Box>
                {groupTasks.map(task => (
                  <Card key={task.id} sx={{ mb: 1, cursor: 'pointer', '&:hover': { borderColor: mod.color } }}>
                    <CardContent sx={{ py: '10px !important', px: '12px !important' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.82rem' }}>{task.title}</Typography>
                      {task.due_date && (
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
                          موعد: {new Date(task.due_date).toLocaleDateString('fa-IR')}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {groupTasks.length === 0 && (
                  <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', textAlign: 'center', py: 2 }}>
                    بدون وظیفه
                  </Typography>
                )}
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
