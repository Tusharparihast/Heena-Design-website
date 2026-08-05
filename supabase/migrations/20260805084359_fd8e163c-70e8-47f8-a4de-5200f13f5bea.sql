INSERT INTO public.user_roles (user_id, role)
VALUES ('3de550bd-d336-41e6-8a4a-64d761cfbd52', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;