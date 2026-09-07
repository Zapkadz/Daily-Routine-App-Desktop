INSERT OR IGNORE INTO categories (id, name, color, icon, created_at) VALUES
  ('builtin-work', 'Work', '#4f7794', 'briefcase', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('builtin-personal', 'Personal', '#7b6f9e', 'user', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('builtin-health', 'Health', '#4f8a68', 'heart-pulse', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('builtin-home', 'Home', '#a9774d', 'house', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
