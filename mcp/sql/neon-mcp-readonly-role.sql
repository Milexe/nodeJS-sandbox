-- Read-only Postgres role for Cursor MCP live database access.
-- Run in Neon SQL Editor (or psql connected to your Neon database).
--
-- 1. Replace the password before running.
-- 2. Replace "neondb" if your database name differs (Neon dashboard -> Connection details).
-- 3. Build a connection string for user "mcp_readonly" in Neon.
--
-- Access model:
-- - Full SELECT on non-sensitive tables
-- - Column-level SELECT on tables with secrets (password hashes, refresh tokens)

CREATE ROLE mcp_readonly WITH LOGIN PASSWORD 'replace-with-long-random-password';

GRANT CONNECT ON DATABASE neondb TO mcp_readonly;
GRANT USAGE ON SCHEMA public TO mcp_readonly;

-- Drinks catalog: all columns
GRANT SELECT ON TABLE "Drinks" TO mcp_readonly;

-- Users: everything except password_hash
GRANT SELECT (id, email, role, created_at) ON TABLE users TO mcp_readonly;

-- Refresh tokens: metadata only, never the token value
GRANT SELECT (id, user_id, expires_at, created_at) ON TABLE refresh_tokens TO mcp_readonly;

-- Prisma migration history (optional, useful for debugging; no secrets)
GRANT SELECT ON TABLE "_prisma_migrations" TO mcp_readonly;

ALTER ROLE mcp_readonly SET default_transaction_read_only = on;
ALTER ROLE mcp_readonly SET statement_timeout = '5s';

-- Verify (optional, as mcp_readonly):
--   SELECT count(*) FROM "Drinks";
--   SELECT id, email, role FROM users LIMIT 1;
--   SELECT password_hash FROM users LIMIT 1;          -- must fail
--   SELECT token FROM refresh_tokens LIMIT 1;         -- must fail
--   SELECT id, user_id FROM refresh_tokens LIMIT 1;  -- ok
--   INSERT INTO "Drinks" (...) VALUES (...);         -- must fail

-- If mcp_readonly already exists from an older script, run only the GRANT lines above
-- (skip CREATE ROLE). To replace table-only access with this layout:
--   REVOKE ALL ON TABLE "Drinks" FROM mcp_readonly;
--   then re-run the GRANT statements above.
