import React from 'react';
import {
  Box, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Avatar, Divider, LinearProgress, Tooltip,
} from '@mui/material';
import {
  Dashboard, FolderOpen, CheckBox, Palette, Code, Article,
  TravelExplore, BugReport, AttachFile, BarChart, Group,
  Settings, Notifications, People, History, Extension,
  Campaign, Share, BusinessCenter,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { type Module } from '../../lib/supabase';

const ICON_MAP: Record<string, React.ElementType> = {
  TravelExplore, Code, Palette, Article, Campaign, Share, BugReport,
  Dashboard, FolderOpen, CheckBox, AttachFile, BarChart, Group,
  Settings, Notifications, People, History, Extension,
};

function getIcon(iconName: string): React.ElementType {
  return ICON_MAP[iconName] ?? Extension;
}

interface SidebarProps {
  modules: Module[];
}

const FIXED_NAV = [
  { label: 'داشبورد', icon: Dashboard, path: '/dashboard' },
  { label: 'پروژه‌ها', icon: FolderOpen, path: '/projects' },
  { label: 'وظایف', icon: CheckBox, path: '/tasks' },
];

const BOTTOM_NAV = [
  { label: 'فایل‌ها', icon: AttachFile, path: '/files' },
  { label: 'گزارش‌ها', icon: BarChart, path: '/reports' },
  { label: 'اعضای تیم', icon: Group, path: '/teams' },
  { label: 'تنظیمات', icon: Settings, path: '/settings' },
];

export default function Sidebar({ modules }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, agency } = useAuth();
  const { currentProject } = useApp();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const visibleModules = modules.filter(m => m.show_in_sidebar && m.status === 'active');

  return (
    <Box
      sx={{
        width: 240,
        height: '100vh',
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Agency branding */}
      <Box sx={{ p: 2, pt: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 40, height: 40, borderRadius: 2,
              background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
              fontSize: '0.9rem', fontWeight: 700,
            }}
          >
            {agency ? agency.name.charAt(0) : 'W'}
          </Avatar>
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
              {agency?.name ?? 'WP Manager'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
              سیستم مدیریت پروژه سایت
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Current project progress */}
      {currentProject && (
        <Box sx={{ px: 2, pb: 1.5 }}>
          <Box sx={{ bgcolor: 'grey.50', borderRadius: 1.5, p: 1.5, border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                پروژه فعال
              </Typography>
              <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600, fontSize: '0.7rem' }}>
                {currentProject.progress}%
              </Typography>
            </Box>
            <Typography variant="caption" noWrap sx={{ fontWeight: 600, display: 'block', mb: 0.75, fontSize: '0.75rem' }}>
              {currentProject.name}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={currentProject.progress}
              sx={{ height: 4, borderRadius: 2 }}
            />
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', mt: 0.5, display: 'block' }}>
              {currentProject.progress} تمام شده از ۱۰۰ کل
            </Typography>
          </Box>
        </Box>
      )}

      <Divider />

      {/* Module label */}
      <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
        <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1 }}>
          ماژول‌ها
        </Typography>
      </Box>

      {/* Scrollable nav */}
      <Box sx={{ flex: 1, overflowY: 'auto', pb: 1 }}>
        <List dense disablePadding>
          {/* Fixed nav items */}
          {FIXED_NAV.map(item => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Tooltip key={item.path} title="" placement="left">
                <ListItemButton
                  selected={active}
                  onClick={() => navigate(item.path)}
                  sx={{ py: 0.75 }}
                >
                  <ListItemIcon>
                    <Icon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: active ? 600 : 400 }}
                  />
                </ListItemButton>
              </Tooltip>
            );
          })}

          {/* Dynamic modules */}
          {visibleModules.map(mod => {
            const Icon = getIcon(mod.icon);
            const active = isActive(`/modules/${mod.slug}`);
            return (
              <ListItemButton
                key={mod.id}
                selected={active}
                onClick={() => navigate(`/modules/${mod.slug}`)}
                sx={{ py: 0.75 }}
              >
                <ListItemIcon>
                  <Box
                    sx={{
                      width: 24, height: 24, borderRadius: 1,
                      bgcolor: mod.color + '20',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Icon sx={{ fontSize: 14, color: mod.color }} />
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={mod.name}
                  primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: active ? 600 : 400 }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      <Divider />

      {/* Bottom nav */}
      <List dense disablePadding sx={{ py: 0.5 }}>
        {BOTTOM_NAV.map(item => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <ListItemButton
              key={item.path}
              selected={active}
              onClick={() => navigate(item.path)}
              sx={{ py: 0.75 }}
            >
              <ListItemIcon>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: active ? 600 : 400 }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {/* User info */}
      <Divider />
      <Box sx={{ p: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, borderRadius: 2, '&:hover': { bgcolor: 'grey.50' }, cursor: 'pointer' }}
          onClick={() => navigate('/settings')}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.8rem' }}>
            {profile?.display_name?.charAt(0) ?? 'U'}
          </Avatar>
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <Typography variant="caption" noWrap sx={{ fontWeight: 600, display: 'block', fontSize: '0.8rem' }}>
              {profile?.display_name ?? 'کاربر'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
              {profile?.role === 'owner' ? 'مالک' : profile?.role === 'admin' ? 'مدیر' : 'عضو'}
            </Typography>
          </Box>
          <BusinessCenter sx={{ fontSize: 16, color: 'text.disabled' }} />
        </Box>
      </Box>
    </Box>
  );
}
