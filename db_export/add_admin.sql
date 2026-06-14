-- Add (or promote) the real platform admin for Google sign-in.
--   Email   : hieupanacota@gmail.com
--   Provider: GOOGLE (no password — Google OAuth matches by email)
--   Role    : ADMIN
--
-- Run on production AFTER removing demo accounts (db_export/remove_demo_accounts.sql).
-- Idempotent: re-running just keeps the account as an active admin.
--   psql "$DB_URL" -f db_export/add_admin.sql

-- 1) Upsert the user row (creates it, or promotes an existing same-email row to admin).
INSERT INTO users (id, email, name, provider, role, status, password_hash, shop_id, avatar, email_verified, created_at)
VALUES (
    'u-admin-hieu',
    'hieupanacota@gmail.com',
    'Hiếu (Admin)',
    'GOOGLE',
    'ADMIN',
    'ACTIVE',
    NULL,
    NULL,
    NULL,
    true,
    (extract(epoch from now()) * 1000)::bigint
)
ON CONFLICT (email) DO UPDATE
    SET role = 'ADMIN',
        status = 'ACTIVE';

-- 2) Ensure the multi-role table grants ADMIN to that account (matched by email).
INSERT INTO user_roles (user_id, role)
SELECT u.id, 'ADMIN'
FROM users u
WHERE u.email = 'hieupanacota@gmail.com'
  AND NOT EXISTS (
        SELECT 1 FROM user_roles r WHERE r.user_id = u.id AND r.role = 'ADMIN'
  );

-- Verify:
--   SELECT u.id, u.email, u.role, u.provider, array_agg(r.role) AS roles
--   FROM users u LEFT JOIN user_roles r ON r.user_id = u.id
--   WHERE u.email = 'hieupanacota@gmail.com'
--   GROUP BY u.id;
