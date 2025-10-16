INSERT INTO users (subject, name, is_admin, is_active)
VALUES
  ('user:alice', 'Alice Admin', TRUE, TRUE),
  ('user:bob', 'Bob Operator', FALSE, TRUE),
  ('user:carol', 'Carol Viewer', FALSE, TRUE)
ON CONFLICT (subject) DO NOTHING;

WITH admin_user AS (
  SELECT id FROM users WHERE subject = 'user:alice'
),
requester AS (
  SELECT id FROM users WHERE subject = 'user:bob'
)
INSERT INTO requests (user_id, vlan_id, status, updated_by, created_by)
SELECT requester.id, 10, 'approved', admin_user.id, admin_user.id
FROM requester, admin_user
WHERE NOT EXISTS (
  SELECT 1
  FROM requests r
  WHERE r.user_id = requester.id AND r.vlan_id = 10
);

WITH admin_user AS (
  SELECT id FROM users WHERE subject = 'user:alice'
),
requester AS (
  SELECT id FROM users WHERE subject = 'user:carol'
)
INSERT INTO requests (user_id, vlan_id, status, updated_by, created_by)
SELECT requester.id, 30, 'pending', admin_user.id, admin_user.id
FROM requester, admin_user
WHERE NOT EXISTS (
  SELECT 1
  FROM requests r
  WHERE r.user_id = requester.id AND r.vlan_id = 30
);
