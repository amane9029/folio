REVOKE EXECUTE ON FUNCTION public.ensure_public_user_from_auth(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.ensure_public_user_from_auth(text) TO project_admin;

ALTER FUNCTION public.ensure_public_user_from_auth(text)
SET search_path = '';
