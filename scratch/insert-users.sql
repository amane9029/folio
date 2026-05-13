INSERT INTO auth.users (id, email, is_project_admin, is_anonymous) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@folio.com', false, false),
('22222222-2222-2222-2222-222222222222', 'user@folio.com', false, false);

INSERT INTO public.profiles (id, role) VALUES
('11111111-1111-1111-1111-111111111111', 'admin'),
('22222222-2222-2222-2222-222222222222', 'user');
