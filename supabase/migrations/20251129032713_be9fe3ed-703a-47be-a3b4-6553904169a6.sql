-- Fix function search_path mutable warning
-- Add search_path to update_automation_timestamps function

CREATE OR REPLACE FUNCTION public.update_automation_timestamps()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;
