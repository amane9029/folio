CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  password_hash text,
  is_verified boolean NOT NULL DEFAULT false,
  auth_provider text NOT NULL DEFAULT 'email',
  google_sub text,
  verify_code_sent_at timestamptz,
  verify_expires_at timestamptz,
  verify_attempt_count integer NOT NULL DEFAULT 0,
  reset_code_sent_at timestamptz,
  reset_expires_at timestamptz,
  reset_attempt_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT users_auth_provider_check CHECK (auth_provider IN ('email', 'google'))
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx
ON public.users (lower(email));

CREATE INDEX IF NOT EXISTS users_auth_user_id_idx
ON public.users (auth_user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_set_updated_at ON public.users;

CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();
