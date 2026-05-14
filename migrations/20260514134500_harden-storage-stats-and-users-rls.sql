REVOKE EXECUTE ON FUNCTION public.get_storage_stats() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_storage_stats() TO project_admin;

ALTER FUNCTION public.get_storage_stats()
SET search_path = '';

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_project_admin_all ON public.users;

CREATE POLICY users_project_admin_all
ON public.users
FOR ALL
TO project_admin
USING (true)
WITH CHECK (true);
