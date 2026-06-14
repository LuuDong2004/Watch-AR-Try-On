-- Remove the seeded DEMO accounts and their demo content from a live database.
--
-- Demo users : u-admin (admin@watch.vn), u-customer (khach@watch.vn),
--              u-shop-aventus (aventus@watch.vn)
-- Demo shop  : shop-1 (Aventus Luxury Watches)
-- Demo watch : chrono (Chronograph Surgical White 42mm)
--
-- The REAL admin (hieupanacota@gmail.com, Google sign-in) is created
-- automatically by DataSeeder.ensureRealAdmin() on backend startup, so it is
-- safe to delete the demo admin here.
--
-- Run inside a transaction. If a table does not exist in your DB yet, comment
-- out that single line and re-run.
--   psql "$DB_URL" -f db_export/remove_demo_accounts.sql
-- (Windows PowerShell: $env:PGPASSWORD='...'; psql -h localhost -U postgres -d truewrist -f db_export/remove_demo_accounts.sql)

BEGIN;

-- Comments authored by demo users, or on the demo watch
DELETE FROM product_comments WHERE user_id IN ('u-admin','u-customer','u-shop-aventus') OR watch_id = 'chrono';

-- Personalisation tied to demo users or the demo watch
DELETE FROM favorites    WHERE user_id IN ('u-admin','u-customer','u-shop-aventus') OR watch_id = 'chrono';
DELETE FROM closet_items WHERE user_id IN ('u-admin','u-customer','u-shop-aventus') OR watch_id = 'chrono';

-- Leads & feedback for the demo shop / demo watch / demo users
DELETE FROM leads    WHERE shop_id = 'shop-1' OR watch_id = 'chrono' OR user_id IN ('u-admin','u-customer','u-shop-aventus');
DELETE FROM feedback WHERE shop_id = 'shop-1' OR user_id IN ('u-admin','u-customer','u-shop-aventus');

-- Subscriptions & plan-upgrade requests for the demo shop / users
DELETE FROM shop_subscriptions    WHERE shop_id = 'shop-1';
DELETE FROM plan_upgrade_requests WHERE user_id IN ('u-admin','u-customer','u-shop-aventus');

-- AR configs + the demo watch
DELETE FROM watch_ar_configs WHERE watch_id = 'chrono';
DELETE FROM watches          WHERE id = 'chrono' OR shop_id = 'shop-1';

-- The demo shop
DELETE FROM shops WHERE id = 'shop-1' OR owner_id = 'u-shop-aventus';

-- Auth tokens, role rows, and finally the demo users themselves
DELETE FROM password_reset_tokens     WHERE user_id IN ('u-admin','u-customer','u-shop-aventus');
DELETE FROM email_verification_tokens WHERE user_id IN ('u-admin','u-customer','u-shop-aventus');
DELETE FROM user_roles                WHERE user_id IN ('u-admin','u-customer','u-shop-aventus');
DELETE FROM users                     WHERE id IN ('u-admin','u-customer','u-shop-aventus');

COMMIT;

-- Verify afterwards:
--   SELECT id, email, role, provider FROM users ORDER BY created_at;
