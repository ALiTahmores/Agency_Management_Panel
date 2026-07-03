/*
# Fix security issues on get_my_agency_id function

1. Set a fixed search_path to prevent search_path injection attacks.
2. Revoke EXECUTE from public, anon, and authenticated roles — the function
   is only needed internally by RLS policies and must not be callable via
   the REST API (/rest/v1/rpc/get_my_agency_id).
*/

CREATE OR REPLACE FUNCTION get_my_agency_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT agency_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION get_my_agency_id() FROM public;
REVOKE EXECUTE ON FUNCTION get_my_agency_id() FROM anon;
REVOKE EXECUTE ON FUNCTION get_my_agency_id() FROM authenticated;
