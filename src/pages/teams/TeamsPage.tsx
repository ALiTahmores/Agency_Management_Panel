import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Grid, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  CircularProgress, Alert, IconButton, List, ListItem, ListItemText,
  ListItemAvatar, Chip, Divider, Menu, MenuItem, Tooltip,
} from '@mui/material';
import { Add, Edit, Group, Delete, PersonAdd, MoreVert, Person } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, type Team, type Profile } from '../../lib/supabase';

interface TeamFormData { name: string; color: string; description: string; }
const TEAM_COLORS = ['#2563EB', '#7C3AED', '#EF4444', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#84CC16'];

interface TeamMemberWithProfile {
  profile_id: string;
  profiles: Profile;
}

interface TeamWithMembers extends Team {
  team_members: TeamMemberWithProfile[];
}

export default function TeamsPage() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const agencyId = profile?.agency_id;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [form, setForm] = useState<TeamFormData>({ name: '', color: '#2563EB', description: '' });
  const [formError, setFormError] = useState('');

  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamWithMembers | null>(null);
  const [menuEl, setMenuEl] = useState<null | HTMLElement>(null);
  const [menuTeamId, setMenuTeamId] = useState<string | null>(null);

  const { data: teams = [], isLoading } = useQuery<TeamWithMembers[]>({
    queryKey: ['teams', agencyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          team_members (
            profile_id,
            profiles:profile_id (id, display_name, avatar_url, role)
          )
        `)
        .eq('agency_id', agencyId!)
        .order('name');
      if (error) throw error;
      return (data ?? []).map(t => ({
        ...t,
        team_members: (t.team_members ?? []) as TeamMemberWithProfile[],
      })) as TeamWithMembers[];
    },
    enabled: !!agencyId,
  });

  const { data: allProfiles = [] } = useQuery<Profile[]>({
    queryKey: ['profiles', agencyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('agency_id', agencyId!);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!agencyId,
  });

  const mutation = useMutation({
    mutationFn: async (data: TeamFormData) => {
      if (editTeam) {
        const { error } = await supabase.from('teams').update(data).eq('id', editTeam.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('teams').insert({ ...data, agency_id: agencyId });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['teams'] }); closeDialog(); },
    onError: (err: Error) => setFormError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase.from('teams').delete().eq('id', teamId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['teams'] }); setMenuEl(null); },
  });

  const addMemberMutation = useMutation({
    mutationFn: async ({ teamId, profileId }: { teamId: string; profileId: string }) => {
      const { error } = await supabase.from('team_members').insert({ team_id: teamId, profile_id: profileId });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['teams'] }); setMemberDialogOpen(false); },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async ({ teamId, profileId }: { teamId: string; profileId: string }) => {
      const { error } = await supabase.from('team_members').delete().eq('team_id', teamId).eq('profile_id', profileId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams'] }),
  });

  function openNew() {
    setEditTeam(null);
    setForm({ name: '', color: '#2563EB', description: '' });
    setFormError('');
    setDialogOpen(true);
  }

  function openEdit(t: Team) {
    setEditTeam(t);
    setForm({ name: t.name, color: t.color, description: t.description ?? '' });
    setFormError('');
    setDialogOpen(true);
  }

  function closeDialog() { setDialogOpen(false); setEditTeam(null); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) { setFormError('نام تیم الزامی است'); return; }
    mutation.mutate(form);
  }

  function openMemberDialog(teamId: string) {
    const team = teams.find(t => t.id === teamId) ?? null;
    setSelectedTeam(team);
    setMenuEl(null);
    setMemberDialogOpen(true);
  }

  const availableProfiles = selectedTeam
    ? allProfiles.filter(p => !selectedTeam.team_members.some((m: TeamMemberWithProfile) => m.profile_id === p.id))
    : [];

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>تیم‌ها</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openNew}>تیم جدید</Button>
      </Box>

      {teams.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Group sx={{ fontSize: 56, color: 'grey.300', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>هیچ تیمی وجود ندارد</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>برای شروع کار، اولین تیم خود را ایجاد کنید</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={openNew}>ایجاد تیم</Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {teams.map(team => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={team.id}>
              <Card sx={{ borderTop: `3px solid ${team.color}` }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ bgcolor: team.color, width: 40, height: 40, borderRadius: 2 }}>
                        <Group />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{team.name}</Typography>
                        {team.description && (
                          <Typography variant="caption" color="text.secondary">{team.description}</Typography>
                        )}
                      </Box>
                    </Box>
                    <>
                      <IconButton size="small" onClick={(e) => { setMenuEl(e.currentTarget); setMenuTeamId(team.id); }}>
                        <MoreVert fontSize="small" />
                      </IconButton>
                      <Menu anchorEl={menuEl} open={menuTeamId === team.id} onClose={() => { setMenuEl(null); setMenuTeamId(null); }}>
                        <MenuItem onClick={() => { setMenuEl(null); openEdit(team); }}>
                          <Edit fontSize="small" sx={{ mr: 1 }} /> ویرایش تیم
                        </MenuItem>
                        <MenuItem onClick={() => openMemberDialog(team.id)}>
                          <PersonAdd fontSize="small" sx={{ mr: 1 }} /> افزودن عضو
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={() => deleteMutation.mutate(team.id)} sx={{ color: 'error.main' }}>
                          <Delete fontSize="small" sx={{ mr: 1 }} /> حذف تیم
                        </MenuItem>
                      </Menu>
                    </>
                  </Box>

                  {/* Team members */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      اعضا ({team.team_members?.length ?? 0})
                    </Typography>
                    {team.team_members && team.team_members.length > 0 ? (
                      <List disablePadding>
                        {team.team_members.map((m: TeamMemberWithProfile, i: number) => (
                          <React.Fragment key={m.profile_id}>
                            {i > 0 && <Divider />}
                            <ListItem
                              disablePadding
                              secondaryAction={
                                <Tooltip title="حذف از تیم">
                                  <IconButton
                                    size="small"
                                    onClick={() => removeMemberMutation.mutate({ teamId: team.id, profileId: m.profile_id })}
                                  >
                                    <Delete fontSize="small" color="error" />
                                  </IconButton>
                                </Tooltip>
                              }
                            >
                              <ListItemAvatar sx={{ minWidth: 40 }}>
                                <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: '0.7rem' }}>
                                  {m.profiles.display_name?.charAt(0) ?? 'U'}
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={m.profiles.display_name}
                                secondary={
                                  <Chip
                                    label={m.profiles.role === 'owner' ? 'مالک' : m.profiles.role === 'admin' ? 'مدیر' : 'عضو'}
                                    size="small"
                                    sx={{ height: 18, fontSize: '0.6rem' }}
                                  />
                                }
                                primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                                secondaryTypographyProps={{ sx: { mt: 0.25 } }}
                              />
                            </ListItem>
                          </React.Fragment>
                        ))}
                      </List>
                    ) : (
                      <Box sx={{ py: 1.5, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          هنوز عضوی اضافه نشده
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Team Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="xs" fullWidth>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>{editTeam ? 'ویرایش تیم' : 'تیم جدید'}</DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField label="نام تیم *" fullWidth value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <TextField label="توضیحات" fullWidth value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <Box>
              <Typography variant="caption" sx={{ mb: 0.75, display: 'block' }}>رنگ تیم</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {TEAM_COLORS.map(c => (
                  <Avatar key={c} sx={{ width: 28, height: 28, bgcolor: c, cursor: 'pointer', border: form.color === c ? '2px solid #0F172A' : '2px solid transparent' }} onClick={() => setForm(f => ({ ...f, color: c }))}>
                    {' '}
                  </Avatar>
                ))}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={closeDialog}>انصراف</Button>
            <Button type="submit" variant="contained" disabled={mutation.isPending}>
              {mutation.isPending ? <CircularProgress size={18} color="inherit" /> : editTeam ? 'ذخیره' : 'ایجاد'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={memberDialogOpen} onClose={() => setMemberDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>افزودن عضو به تیم {selectedTeam?.name}</DialogTitle>
        <DialogContent dividers>
          {availableProfiles.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Person sx={{ fontSize: 40, color: 'grey.300', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                همه اعضای آژانس قبلاً به این تیم اضافه شده‌اند
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {availableProfiles.map((p, i) => (
                <React.Fragment key={p.id}>
                  {i > 0 && <Divider />}
                  <ListItem
                    disablePadding
                    secondaryAction={
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PersonAdd />}
                        onClick={() => addMemberMutation.mutate({ teamId: selectedTeam!.id, profileId: p.id })}
                      >
                        افزودن
                      </Button>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main', fontSize: '0.75rem' }}>
                        {p.display_name?.charAt(0) ?? 'U'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={p.display_name}
                      secondary={p.role === 'owner' ? 'مالک' : p.role === 'admin' ? 'مدیر' : 'عضو'}
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setMemberDialogOpen(false)}>بستن</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
