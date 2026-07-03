import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Grid,
  Alert, CircularProgress, Avatar, Tab, Tabs, List, ListItem,
  ListItemAvatar, ListItemText, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem, Chip, Divider, Tooltip,
} from '@mui/material';
import { Save, Person, PersonAdd, Delete, Mail, CopyAll, Refresh } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, type Profile, type Invitation } from '../../lib/supabase';

export default function SettingsPage() {
  const { profile, agency, refreshProfile, signOut } = useAuth();
  const [tab, setTab] = useState(0);
  const [agencyName, setAgencyName] = useState(agency?.name ?? '');
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [saveMsg, setSaveMsg] = useState('');
  const [saveError, setSaveError] = useState('');
  const qc = useQueryClient();

  const [inviteDialog, setInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin' | 'client'>('member');
  const [inviteError, setInviteError] = useState('');

  const agencyId = profile?.agency_id;
  const isOwner = profile?.role === 'owner';

  const { data: members = [], isLoading: membersLoading } = useQuery<Profile[]>({
    queryKey: ['members', agencyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('agency_id', agencyId!).order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!agencyId,
  });

  const { data: invitations = [], isLoading: invitationsLoading } = useQuery<Invitation[]>({
    queryKey: ['invitations', agencyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('invitations').select('*').eq('agency_id', agencyId!).is('accepted_at', null).gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!agencyId && isOwner,
  });

  const saveAgency = useMutation({
    mutationFn: async () => {
      if (!agency) return;
      const { error } = await supabase.from('agencies').update({ name: agencyName, updated_at: new Date().toISOString() }).eq('id', agency.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      await refreshProfile();
      setSaveMsg('تنظیمات آژانس ذخیره شد');
      setSaveError('');
      setTimeout(() => setSaveMsg(''), 3000);
    },
    onError: (err: Error) => { setSaveError(err.message); setSaveMsg(''); },
  });

  const saveProfile = useMutation({
    mutationFn: async () => {
      if (!profile) return;
      const { error } = await supabase.from('profiles').update({ display_name: displayName, updated_at: new Date().toISOString() }).eq('id', profile.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await refreshProfile();
      setSaveMsg('پروفایل ذخیره شد');
      setSaveError('');
      setTimeout(() => setSaveMsg(''), 3000);
    },
    onError: (err: Error) => { setSaveError(err.message); setSaveMsg(''); },
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        agency_id: agencyId,
        email: inviteEmail,
        role: inviteRole,
        invited_by: profile?.id,
      };
      const { error } = await supabase.from('invitations').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invitations'] });
      setInviteDialog(false);
      setInviteEmail('');
      setInviteRole('member');
      setInviteError('');
    },
    onError: (err: Error) => setInviteError(err.message),
  });

  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase.from('invitations').delete().eq('id', invitationId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invitations'] }),
  });

  function copyInviteLink(token: string) {
    const link = `${window.location.origin}/accept-invitation?token=${token}`;
    navigator.clipboard.writeText(link);
    setSaveMsg('لینک دعوت کپی شد');
    setTimeout(() => setSaveMsg(''), 3000);
  }

  function handleInviteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail) { setInviteError('ایمیل الزامی است'); return; }
    if (!inviteEmail.includes('@')) { setInviteError('ایمیل معتبر نیست'); return; }
    inviteMutation.mutate();
  }

  const roleLabels: Record<string, string> = { owner: 'مالک', admin: 'مدیر', member: 'عضو', client: 'مشتری' };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>تنظیمات</Typography>

      {saveMsg && <Alert severity="success" sx={{ mb: 2 }}>{saveMsg}</Alert>}
      {saveError && <Alert severity="error" sx={{ mb: 2 }}>{saveError}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="اطلاعات آژانس" />
        <Tab label="پروفایل کاربری" />
        <Tab label="اعضا و دعوت‌ها" />
      </Tabs>

      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>اطلاعات آژانس</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="نام آژانس"
                      fullWidth
                      value={agencyName}
                      onChange={e => setAgencyName(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="شناسه آژانس"
                      fullWidth
                      value={agency?.slug ?? ''}
                      disabled
                      dir="ltr"
                      inputProps={{ style: { textAlign: 'left' } }}
                      helperText="شناسه آژانس قابل تغییر نیست"
                    />
                  </Grid>
                </Grid>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    disabled={saveAgency.isPending}
                    onClick={() => saveAgency.mutate()}
                  >
                    {saveAgency.isPending ? <CircularProgress size={18} color="inherit" /> : 'ذخیره تنظیمات'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar
                  sx={{
                    width: 80, height: 80, mx: 'auto', mb: 2,
                    background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                    fontSize: '2rem', fontWeight: 700,
                    borderRadius: 3,
                  }}
                >
                  {agency?.name?.charAt(0) ?? 'A'}
                </Avatar>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{agency?.name}</Typography>
                <Typography variant="caption" color="text.secondary">{agency?.slug}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tab === 1 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>اطلاعات کاربری</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="نام نمایشی"
                      fullWidth
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="نقش"
                      fullWidth
                      value={profile?.role === 'owner' ? 'مالک' : profile?.role === 'admin' ? 'مدیر' : 'عضو'}
                      disabled
                      helperText="نقش توسط مالک آژانس تعیین می‌شود"
                    />
                  </Grid>
                </Grid>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                  <Button variant="contained" startIcon={<Save />} disabled={saveProfile.isPending} onClick={() => saveProfile.mutate()}>
                    {saveProfile.isPending ? <CircularProgress size={18} color="inherit" /> : 'ذخیره'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ border: '1px solid', borderColor: 'error.light' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: 'error.main' }}>خروج از حساب</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  با خروج از حساب، نشست فعلی شما پایان می‌یابد.
                </Typography>
                <Button variant="outlined" color="error" onClick={() => signOut()}>
                  خروج از حساب
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tab === 2 && (
        <Box>
          {/* Members list */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  اعضای آژانس ({members.length})
                </Typography>
                {isOwner && (
                  <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setInviteDialog(true)}>
                    دعوت عضو جدید
                  </Button>
                )}
              </Box>

              {membersLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress /></Box>
              ) : members.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Person sx={{ fontSize: 40, color: 'grey.300', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">هیچ عضوی یافت نشد</Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {members.map((m, i) => (
                    <React.Fragment key={m.id}>
                      {i > 0 && <Divider />}
                      <ListItem sx={{ py: 1.5 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main', fontSize: '0.75rem' }}>
                            {m.display_name?.charAt(0) ?? 'U'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={m.display_name}
                          secondary={
                            <Chip
                              label={roleLabels[m.role] ?? m.role}
                              size="small"
                              color={m.role === 'owner' ? 'primary' : 'default'}
                              sx={{ height: 20, fontSize: '0.65rem', mt: 0.25 }}
                            />
                          }
                          primaryTypographyProps={{ fontWeight: 500 }}
                        />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* Pending invitations - owner only */}
          {isOwner && (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    دعوت‌های در انتظار ({invitations.length})
                  </Typography>
                  <Button size="small" startIcon={<Refresh />} onClick={() => qc.invalidateQueries({ queryKey: ['invitations'] })}>
                    به‌روزرسانی
                  </Button>
                </Box>

                {invitationsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress /></Box>
                ) : invitations.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Mail sx={{ fontSize: 40, color: 'grey.300', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">هیچ دعوت فعالی وجود ندارد</Typography>
                  </Box>
                ) : (
                  <List disablePadding>
                    {invitations.map((inv, i) => (
                      <React.Fragment key={inv.id}>
                        {i > 0 && <Divider />}
                        <ListItem
                          sx={{ py: 1.5 }}
                          secondaryAction={
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="کپی لینک دعوت">
                                <IconButton size="small" onClick={() => copyInviteLink(inv.token)}>
                                  <CopyAll fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="لغو دعوت">
                                <IconButton size="small" color="error" onClick={() => cancelInvitationMutation.mutate(inv.id)}>
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          }
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'grey.200', color: 'text.secondary' }}>
                              <Mail />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={inv.email}
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                                <Chip label={roleLabels[inv.role]} size="small" sx={{ height: 18, fontSize: '0.6rem' }} />
                                <Typography variant="caption" color="text.secondary">
                                  انقضا: {new Date(inv.expires_at).toLocaleDateString('fa-IR')}
                                </Typography>
                              </Box>
                            }
                            primaryTypographyProps={{ fontWeight: 500 }}
                          />
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteDialog} onClose={() => setInviteDialog(false)} maxWidth="xs" fullWidth>
        <Box component="form" onSubmit={handleInviteSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>دعوت عضو جدید</DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            {inviteError && <Alert severity="error">{inviteError}</Alert>}
            <TextField
              label="ایمیل *"
              type="email"
              fullWidth
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              dir="ltr"
              inputProps={{ style: { textAlign: 'left' } }}
            />
            <TextField
              label="نقش"
              select
              fullWidth
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value as 'member' | 'admin' | 'client')}
            >
              <MenuItem value="member">عضو</MenuItem>
              <MenuItem value="admin">مدیر</MenuItem>
              <MenuItem value="client">مشتری</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setInviteDialog(false)}>انصراف</Button>
            <Button type="submit" variant="contained" disabled={inviteMutation.isPending} startIcon={<Mail />}>
              {inviteMutation.isPending ? <CircularProgress size={18} color="inherit" /> : 'ارسال دعوت'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
