import React, { useState } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, Tab, Tabs, CircularProgress, InputAdornment, IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, BusinessCenter } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ email: '', password: '', displayName: '', agencyName: '' });

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(loginForm.email, loginForm.password);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? 'ایمیل یا رمز عبور اشتباه است' : 'خطا در ورود');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!signupForm.displayName || !signupForm.agencyName) {
      setError('لطفاً همه فیلدها را پر کنید');
      return;
    }
    setLoading(true);
    try {
      await signUp(signupForm.email, signupForm.password, signupForm.displayName, signupForm.agencyName);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message ?? String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 56, height: 56, borderRadius: 2,
              background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              mb: 1.5,
            }}
          >
            <BusinessCenter sx={{ color: 'white', fontSize: 28 }} />
          </Box>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
            WP Manager
          </Typography>
          <Typography variant="body2" sx={{ color: '#94A3B8', mt: 0.5 }}>
            سیستم مدیریت پروژه آژانس دیجیتال
          </Typography>
        </Box>

        <Card sx={{ borderRadius: 3, border: '1px solid #1E293B', bgcolor: 'white' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tab} onChange={(_, v) => { setTab(v); setError(''); }} variant="fullWidth">
              <Tab label="ورود به حساب" />
              <Tab label="ثبت‌نام آژانس" />
            </Tabs>
          </Box>

          <CardContent sx={{ p: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {tab === 0 ? (
              <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="ایمیل"
                  type="email"
                  required
                  fullWidth
                  value={loginForm.email}
                  onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                  dir="ltr"
                  inputProps={{ style: { textAlign: 'left' } }}
                />
                <TextField
                  label="رمز عبور"
                  type={showPassword ? 'text' : 'password'}
                  required
                  fullWidth
                  value={loginForm.password}
                  onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                  dir="ltr"
                  inputProps={{ style: { textAlign: 'left' } }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowPassword(s => !s)}>
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading}
                  sx={{ mt: 1, py: 1.25 }}
                >
                  {loading ? <CircularProgress size={20} color="inherit" /> : 'ورود'}
                </Button>
              </Box>
            ) : (
              <Box component="form" onSubmit={handleSignup} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="نام کامل شما"
                  required
                  fullWidth
                  value={signupForm.displayName}
                  onChange={e => setSignupForm(f => ({ ...f, displayName: e.target.value }))}
                />
                <TextField
                  label="نام آژانس شما"
                  required
                  fullWidth
                  value={signupForm.agencyName}
                  onChange={e => setSignupForm(f => ({ ...f, agencyName: e.target.value }))}
                />
                <TextField
                  label="ایمیل"
                  type="email"
                  required
                  fullWidth
                  value={signupForm.email}
                  onChange={e => setSignupForm(f => ({ ...f, email: e.target.value }))}
                  dir="ltr"
                  inputProps={{ style: { textAlign: 'left' } }}
                />
                <TextField
                  label="رمز عبور"
                  type={showPassword ? 'text' : 'password'}
                  required
                  fullWidth
                  value={signupForm.password}
                  onChange={e => setSignupForm(f => ({ ...f, password: e.target.value }))}
                  dir="ltr"
                  inputProps={{ style: { textAlign: 'left' } }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowPassword(s => !s)}>
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading}
                  sx={{ mt: 1, py: 1.25 }}
                >
                  {loading ? <CircularProgress size={20} color="inherit" /> : 'ایجاد آژانس'}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        <Typography variant="caption" sx={{ color: '#475569', textAlign: 'center', display: 'block', mt: 2 }}>
          WP Manager — پلتفرم مدیریت پروژه آژانس دیجیتال
        </Typography>
      </Box>
    </Box>
  );
}
