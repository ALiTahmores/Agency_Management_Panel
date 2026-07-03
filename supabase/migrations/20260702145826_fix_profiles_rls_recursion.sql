/*
# Fix infinite recursion in profiles RLS

The profile_select policy self-referenced profiles table causing infinite recursion.
Replaced with a security-definer function that breaks the recursion.

Changes:
- Created get_my_agency_id() security definer function that bypasses RLS
- Replaced profile_select policy to use the function instead of self-referencing profiles
*/

-- Helper function to get current user's agency_id without triggering RLS
CREATE OR REPLACE FUNCTION get_my_agency_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT agency_id FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Fix the recursive SELECT policy on profiles
DROP POLICY IF EXISTS "profile_select" ON profiles;
CREATE POLICY "profile_select" ON profiles FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR agency_id = get_my_agency_id()
  );
