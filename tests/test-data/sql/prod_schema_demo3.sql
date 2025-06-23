-- Production schema for Demo 3: e‑commerce slice (note: NO orders table)
CREATE TABLE products (
    id    INT PRIMARY KEY,
    sku   TEXT    NOT NULL UNIQUE,
    price NUMERIC NOT NULL
);
