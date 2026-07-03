import { useState } from 'react';
import {
  AppBar, Toolbar, Box, Typography, IconButton, InputBase,
  Badge, Avatar, Chip, Menu, MenuItem, Divider,
} from '@mui/material';
import {
  Notifications, Search, Add, Logout,
  Settings,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { supabase, type Project, type Notification } from '../../lib/supabase';

interface TopBarProps {
  projects: Project[];
}

export default function TopBar({ projects }: TopBarProps) {
  const navigate = useNavigate();
  const { profile, agency, signOut } = useAuth();
  const { currentProject, setCurrentProject } = useApp();
  const [userMenuEl, setUserMenuEl] = useState<null | HTMLElement>(null);

  const agencyId = profile?.agency_id;

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications-header', agencyId],
    queryFn: async () => {
      if (!agencyId) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('agency_id', agencyId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!agencyId,
  });

  const unreadCount = notifications.length;

  async function handleSignOut() {
    setUserMenuEl(null);
    await signOut();
    navigate('/auth');
  }

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        bgcolor: '#0F172A',
        borderBottom: '1px solid #1E293B',
        zIndex: 1000,
      }}
    >
      <Toolbar sx={{ gap: 1.5, minHeight: '52px !important', px: 2 }}>
        {/* Agency / project info */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700, lineHeight: 1.2, fontSize: '0.85rem' }}>
              {agency?.name ?? 'WP Manager'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.7rem' }}>
              {new Date().getFullYear()}
            </Typography>
          </Box>

          <IconButton size="small" sx={{ color: '#64748B' }} onClick={() => navigate('/notifications')}>
            <Badge badgeContent={unreadCount} color="error" max={99}>
              <Notifications fontSize="small" />
            </Badge>
          </IconButton>
        </Box>

        {/* Center – Search */}
        <Box
          sx={{
            flex: 2,
            maxWidth: 400,
            bgcolor: '#1E293B',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            px: 1.5, py: 0.5,
            gap: 1,
          }}
        >
          <Search sx={{ color: '#475569', fontSize: 18 }} />
          <InputBase
            placeholder="جستجوی پروژه، وظایف، فایل..."
            sx={{
              flex: 1, color: '#94A3B8', fontSize: '0.875rem',
              '& input::placeholder': { color: '#475569' },
            }}
          />
        </Box>

        {/* Right – WP Manager brand */}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              sx={{
                width: 28, height: 28, borderRadius: 1,
                background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                fontSize: '0.7rem', fontWeight: 700,
              }}
            >
              WP
            </Avatar>
            <Box>
              <Typography variant="caption" sx={{ color: 'white', fontWeight: 700, display: 'block', lineHeight: 1.1, fontSize: '0.75rem' }}>
                WP MANAGER
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.65rem' }}>
                سیستم مدیریت پروژه سایت
              </Typography>
            </Box>
          </Box>
        </Box>
      </Toolbar>

      {/* Project tabs row */}
      <Box
        sx={{
          bgcolor: 'white',
          borderBottom: '1px solid #E2E8F0',
          px: 2, py: 0.75,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
        {projects.slice(0, 5).map(p => (
          <Chip
            key={p.id}
            label={p.name}
            size="small"
            variant={currentProject?.id === p.id ? 'filled' : 'outlined'}
            color={currentProject?.id === p.id ? 'primary' : 'default'}
            onClick={() => setCurrentProject(p)}
            sx={{ fontSize: '0.78rem', cursor: 'pointer' }}
          />
        ))}

        <Chip
          icon={<Add sx={{ fontSize: 14 }} />}
          label="پروژه جدید"
          size="small"
          variant="outlined"
          onClick={() => navigate('/projects?new=1')}
          sx={{
            fontSize: '0.78rem', cursor: 'pointer',
            borderStyle: 'dashed',
            color: 'primary.main',
            borderColor: 'primary.main',
          }}
        />

        <Box sx={{ flex: 1 }} />

        {/* Right side of tabs row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {currentProject && (
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1, fontSize: '1.1rem', color: 'text.primary' }}>
                داشبورد پروژه
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                {currentProject.name} — خلاصه وضعیت کل پروژه
              </Typography>
            </Box>
          )}

          <IconButton
            size="small"
            onClick={e => setUserMenuEl(e.currentTarget)}
          >
            <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: '0.75rem' }}>
              {profile?.display_name?.charAt(0) ?? 'U'}
            </Avatar>
          </IconButton>
        </Box>
      </Box>

      {/* User menu */}
      <Menu anchorEl={userMenuEl} open={Boolean(userMenuEl)} onClose={() => setUserMenuEl(null)}>
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2">{profile?.display_name}</Typography>
          <Typography variant="caption" color="text.secondary">{profile?.role}</Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => { setUserMenuEl(null); navigate('/settings'); }}>
          <Settings fontSize="small" sx={{ mr: 1 }} /> تنظیمات
        </MenuItem>
        <MenuItem onClick={handleSignOut}>
          <Logout fontSize="small" sx={{ mr: 1 }} /> خروج
        </MenuItem>
      </Menu>
    </AppBar>
  );
}
