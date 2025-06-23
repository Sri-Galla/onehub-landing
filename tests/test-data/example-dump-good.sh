createdb test_db

psql test_db << EOF
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100)
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    price DECIMAL(10,2)
);

INSERT INTO users (name, email) VALUES 
    ('John Doe', 'john@example.com'),
    ('Jane Smith', 'jane@example.com');

INSERT INTO products (name, price) VALUES 
    ('Product 1', 99.99),
    ('Product 2', 149.99);
EOF

pg_dump -Fc test_db > tests/test-data/dumps/exampledump-good.dump
dropdb test_db