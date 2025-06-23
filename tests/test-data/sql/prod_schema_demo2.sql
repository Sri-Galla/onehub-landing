-- Production schema for Demo 2: security‑hardened baseline
-- Secrets stored as salted SHA‑256 hashes, access limited to api_user role.
CREATE ROLE api_user NOLOGIN;

CREATE TABLE secrets (
    id           INT PRIMARY KEY,
    secret_hash  TEXT NOT NULL
);
COMMENT ON TABLE secrets IS 'Secrets are stored as salted hashes, never plaintext.';

-- Row‑level security: only api_user can select
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;
CREATE POLICY secrets_access ON secrets
    FOR SELECT USING (pg_has_role(current_user, 'api_user', 'USAGE'));
