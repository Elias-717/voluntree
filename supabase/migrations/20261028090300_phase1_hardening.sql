-- Phase 1: fixes from the Supabase security advisor.
-- Trigger functions are never called directly, so nobody needs EXECUTE on them.

alter function public.reject_change() set search_path = '';

revoke execute on function
  public.reject_change(),
  public.check_mission_criteria(),
  public.audit_student_academic()
  from public, anon, authenticated;
