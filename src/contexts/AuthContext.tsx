import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User, type Session } from '@supabase/supabase-js';
import { supabase, type Profile, type Agency } from '../lib/supabase';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  agency: Agency | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, agencyName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfileAndAgency(userId: string) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileData) {
      setProfile(profileData as Profile);
      if (profileData.agency_id) {
        const { data: agencyData } = await supabase
          .from('agencies')
          .select('*')
          .eq('id', profileData.agency_id)
          .maybeSingle();
        if (agencyData) setAgency(agencyData as Agency);
      }
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        (async () => {
          await loadProfileAndAgency(s.user.id);
          setLoading(false);
        })();
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        (async () => {
          await loadProfileAndAgency(s.user.id);
        })();
      } else {
        setProfile(null);
        setAgency(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(email: string, password: string, displayName: string, agencyName: string) {
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) throw authError;
    if (!authData.user) throw new Error('خطا در ایجاد حساب کاربری');
    if (!authData.session) throw new Error('لطفاً ایمیل خود را تایید کنید');

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-agency`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authData.session.access_token}`,
        },
        body: JSON.stringify({ agencyName, displayName }),
      }
    );
    const result = await res.json();
    if (!res.ok) throw new Error(result.error ?? 'خطا در ایجاد آژانس');

    await supabase.auth.setSession({
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setAgency(null);
  }

  async function refreshProfile() {
    if (user) await loadProfileAndAgency(user.id);
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, agency, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
