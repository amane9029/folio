ALTER TABLE public.books
ADD COLUMN IF NOT EXISTS user_id uuid;

UPDATE public.books
SET user_id = COALESCE(user_id, uploaded_by)
WHERE user_id IS NULL;

ALTER TABLE public.books
ALTER COLUMN user_id SET DEFAULT auth.uid();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'books'
      AND constraint_name = 'books_user_id_fkey'
  ) THEN
    ALTER TABLE public.books
    ADD CONSTRAINT books_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_books_user_id ON public.books(user_id);

ALTER TABLE public.books
ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can insert books" ON public.books;
DROP POLICY IF EXISTS "Users can insert their own books" ON public.books;
DROP POLICY IF EXISTS "Users can read their own books" ON public.books;
DROP POLICY IF EXISTS "Users can update their own books" ON public.books;
DROP POLICY IF EXISTS "Users can delete their own books" ON public.books;
DROP POLICY IF EXISTS "Admins can read all books" ON public.books;
DROP POLICY IF EXISTS "Admins can delete any book" ON public.books;
DROP POLICY IF EXISTS "Server can read all books" ON public.books;

CREATE POLICY "Users can insert their own books"
ON public.books
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read their own books"
ON public.books
FOR SELECT
TO public
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own books"
ON public.books
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own books"
ON public.books
FOR DELETE
TO public
USING (user_id = auth.uid());

CREATE POLICY "Admins can read all books"
ON public.books
FOR SELECT
TO public
USING (is_admin());

CREATE POLICY "Admins can delete any book"
ON public.books
FOR DELETE
TO public
USING (is_admin());

ALTER TABLE public.books
ALTER COLUMN user_id SET NOT NULL;
