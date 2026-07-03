import { useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { supabase, type Module, type Project } from '../../lib/supabase';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AppLayout() {
  const { user, profile, loading } = useAuth();
  const { setCurrentProject, currentProject } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [loading, user, navigate]);

  const { data: modules = [] } = useQuery<Module[]>({
    queryKey: ['modules', profile?.agency_id],
    queryFn: async () => {
      if (!profile?.agency_id) return [];
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('agency_id', profile.agency_id)
        .eq('status', 'active')
        .order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!profile?.agency_id,
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects', profile?.agency_id],
    queryFn: async () => {
      if (!profile?.agency_id) return [];
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('agency_id', profile.agency_id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!profile?.agency_id,
  });

  useEffect(() => {
    if (projects.length > 0 && !currentProject) {
      setCurrentProject(projects[0]);
    }
  }, [projects, currentProject, setCurrentProject]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TopBar projects={projects} />
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Main content */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            bgcolor: 'background.default',
            p: 3,
          }}
        >
          <Outlet context={{ projects, modules }} />
        </Box>
        {/* Sidebar on the RIGHT (RTL) */}
        <Sidebar modules={modules} />
      </Box>
    </Box>
  );
}
