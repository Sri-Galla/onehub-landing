-- Production schema for Demo 1: expected live schema
-- Drift-check: customers must include is_active; legacy_field must be gone.
CREATE TABLE customers (
    id         INT PRIMARY KEY,
    name       TEXT NOT NULL,
    is_active  BOOLEAN NOT NULL DEFAULT TRUE
);
