-- Deduplicate active carts: keep only the most recent active cart per user
UPDATE carts
SET status = 'abandoned', updated_at = now()
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM carts
  WHERE status = 'active'
  ORDER BY user_id, created_at DESC
)
AND status = 'active';
