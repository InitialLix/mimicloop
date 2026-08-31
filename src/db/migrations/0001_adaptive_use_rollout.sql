INSERT INTO `settings` (`key`, `value_json`, `updated_at`)
SELECT
  'adaptive_use_started_at',
  '"' || strftime('%Y-%m-%dT%H:%M:%fZ', 'now') || '"',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE NOT EXISTS (
  SELECT 1 FROM `settings` WHERE `key` = 'adaptive_use_started_at'
);
