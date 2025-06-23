#!/usr/bin/env bash
set -euo pipefail

# ---- CONFIG ---------------------------------------------------------------
PGUSER=${PGUSER:-postgres}
PGHOST=${PGHOST:-localhost}
PGPORT=${PGPORT:-5432}
PGPASSWORD=${PGPASSWORD:-postgres}
# --------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DUMP_DIR="$SCRIPT_DIR/dumps"
mkdir -p "$DUMP_DIR"

createdb demo1

psql -d demo1 <<'SQL'
CREATE TABLE customers (id INT PRIMARY KEY, name TEXT, legacy_field TEXT);
INSERT INTO customers VALUES (1, 'Alice', 'old');
SQL
pg_dump -Fc -d demo1 -f "$DUMP_DIR/demo1_schema_drift.dump"

createdb demo2
psql -d demo2 <<'SQL'
CREATE TABLE secrets(id INT PRIMARY KEY, secret TEXT);
INSERT INTO secrets VALUES (1, 'top-secret');
CREATE OR REPLACE FUNCTION get_secret(i INT) RETURNS TEXT
  LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN (SELECT secret FROM secrets WHERE id = i);
END;$$;
SQL
pg_dump -Fc -d demo2 -f "$DUMP_DIR/demo2_security_risks.dump"

createdb demo3
psql -d demo3 -c "CREATE TABLE orders(id INT PRIMARY KEY, total_usd NUMERIC);"
psql -d demo3 -c "INSERT INTO orders VALUES (1, 99.99);"
pg_dump -Fc -a -d demo3 -t orders -f "$DUMP_DIR/demo3_corrupted.dump"

echo "All demo .dump files ready:"
ls -1 "$DUMP_DIR"/*.dump

dropdb demo1
dropdb demo2
dropdb demo3
