CREATE OR REPLACE FUNCTION public.ensure_public_user_from_auth(target_email text)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, auth
AS $$
DECLARE
  auth_row auth.users%ROWTYPE;
  result_row public.users%ROWTYPE;
BEGIN
  SELECT *
  INTO auth_row
  FROM auth.users
  WHERE lower(email) = lower(target_email)
  LIMIT 1;

  IF auth_row.id IS NULL THEN
    RAISE EXCEPTION 'Auth user not found for %', target_email;
  END IF;

  INSERT INTO public.users (
    auth_user_id,
    email,
    name,
    password_hash,
    is_verified,
    auth_provider,
    verify_code_sent_at,
    verify_expires_at,
    verify_attempt_count
  )
  VALUES (
    auth_row.id,
    lower(auth_row.email),
    COALESCE(NULLIF(auth_row.profile ->> 'name', ''), split_part(lower(auth_row.email), '@', 1)),
    auth_row.password,
    COALESCE(auth_row.email_verified, false),
    'email',
    CASE WHEN COALESCE(auth_row.email_verified, false) THEN NULL ELSE timezone('utc', now()) END,
    CASE WHEN COALESCE(auth_row.email_verified, false) THEN NULL ELSE timezone('utc', now()) + interval '10 minutes' END,
    0
  )
  ON CONFLICT (auth_user_id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.users.name),
    password_hash = COALESCE(EXCLUDED.password_hash, public.users.password_hash),
    is_verified = EXCLUDED.is_verified,
    updated_at = timezone('utc', now())
  RETURNING * INTO result_row;

  RETURN result_row;
END;
$$;

INSERT INTO public.users (
  auth_user_id,
  email,
  name,
  password_hash,
  is_verified,
  auth_provider,
  verify_code_sent_at,
  verify_expires_at,
  verify_attempt_count
)
SELECT
  au.id,
  lower(au.email),
  COALESCE(NULLIF(au.profile ->> 'name', ''), split_part(lower(au.email), '@', 1)),
  au.password,
  COALESCE(au.email_verified, false),
  'email',
  CASE WHEN COALESCE(au.email_verified, false) THEN NULL ELSE timezone('utc', now()) END,
  CASE WHEN COALESCE(au.email_verified, false) THEN NULL ELSE timezone('utc', now()) + interval '10 minutes' END,
  0
FROM auth.users au
LEFT JOIN public.users pu
  ON pu.auth_user_id = au.id
WHERE pu.id IS NULL;
