#!/usr/bin/env bash
set -euo pipefail

WORKDIR=$(dirname "$0")
mkdir -p "$WORKDIR/dumps"
DUMP_FILE="$WORKDIR/dumps/example-dump-bad.dump"

IMAGE=postgres:16.2-alpine
CONTAINER=bad-dump-gen-$$

# 1. Start temporary Postgres
docker run --name "$CONTAINER" -e POSTGRES_PASSWORD=postgres -d $IMAGE
until docker exec "$CONTAINER" pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done

PSQL="docker exec -u postgres $CONTAINER psql -U postgres -v ON_ERROR_STOP=1"
PG_DUMP="docker exec -u postgres $CONTAINER pg_dump -Fc -U postgres"

$PSQL -c "CREATE TABLE users (id INT PRIMARY KEY, name TEXT);"
$PSQL -c "CREATE TABLE orders (id INT PRIMARY KEY, user_id INT);"
$PSQL -c "INSERT INTO users VALUES (1, 'User A');"
$PSQL -c "INSERT INTO orders VALUES (1, 1);"
$PSQL -c "INSERT INTO orders VALUES (2, 2);"
$PSQL -c "ALTER TABLE orders ADD CONSTRAINT orders_user_fk FOREIGN KEY (user_id) REFERENCES users(id) NOT VALID;"

$PG_DUMP postgres -f /tmp/bad.dump

docker cp "$CONTAINER:/tmp/bad.dump" "$DUMP_FILE"

echo "Bad dump written to $DUMP_FILE"

docker rm -f "$CONTAINER" >/dev/null
