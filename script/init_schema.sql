
-- Create enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'user', 'warehouse');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE product_status AS ENUM ('purchase_order', 'ordered', 'received', 'semi_manufactured', 'shipping', 'arrived');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE currency AS ENUM ('CNY', 'USD');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE cashbox_transaction_type AS ENUM ('income', 'expense');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE cashbox_category AS ENUM ('supplier', 'shipping', 'other', 'expense');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create tables
CREATE TABLE IF NOT EXISTS users (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  username text NOT NULL UNIQUE,
  password text NOT NULL,
  display_name text NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  active boolean NOT NULL DEFAULT true,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL
);

CREATE TABLE IF NOT EXISTS suppliers (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL,
  phone text,
  address text
);

CREATE TABLE IF NOT EXISTS shipping_companies (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL,
  phone text,
  address text
);

CREATE TABLE IF NOT EXISTS warehouses (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL,
  name_zh text,
  quantity integer NOT NULL DEFAULT 0,
  category_id integer REFERENCES categories(id),
  status product_status NOT NULL DEFAULT 'purchase_order',
  status_changed_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_parts (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  product_id integer NOT NULL REFERENCES products(id),
  name text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  length real,
  width real,
  height real,
  weight real,
  pieces_per_carton integer
);

CREATE TABLE IF NOT EXISTS orders (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  supplier_id integer NOT NULL REFERENCES suppliers(id),
  created_at timestamp DEFAULT now(),
  confirmed text NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS order_items (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  order_id integer NOT NULL REFERENCES orders(id),
  product_id integer NOT NULL REFERENCES products(id),
  quantity_requested integer NOT NULL,
  quantity_ordered integer NOT NULL,
  price real NOT NULL DEFAULT 0,
  currency currency NOT NULL DEFAULT 'CNY'
);

CREATE TABLE IF NOT EXISTS deliveries (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  order_id integer REFERENCES orders(id),
  supplier_id integer NOT NULL REFERENCES suppliers(id),
  warehouse_id integer NOT NULL REFERENCES warehouses(id),
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS delivery_items (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  delivery_id integer NOT NULL REFERENCES deliveries(id),
  product_id integer NOT NULL REFERENCES products(id),
  quantity integer NOT NULL
);

CREATE TABLE IF NOT EXISTS containers (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL,
  shipping_company_id integer REFERENCES shipping_companies(id),
  warehouse_id integer REFERENCES warehouses(id),
  departure_date timestamp,
  arrival_date timestamp,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS container_items (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  container_id integer NOT NULL REFERENCES containers(id),
  product_id integer NOT NULL REFERENCES products(id),
  quantity integer NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  supplier_id integer NOT NULL REFERENCES suppliers(id),
  amount real NOT NULL,
  currency currency NOT NULL DEFAULT 'CNY',
  note text,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shipping_payments (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  shipping_company_id integer NOT NULL REFERENCES shipping_companies(id),
  amount real NOT NULL,
  currency currency NOT NULL DEFAULT 'CNY',
  note text,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title text NOT NULL,
  amount real NOT NULL,
  currency currency NOT NULL DEFAULT 'CNY',
  description text,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cashbox_transactions (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  type cashbox_transaction_type NOT NULL,
  category cashbox_category NOT NULL DEFAULT 'other',
  amount real NOT NULL,
  currency currency NOT NULL DEFAULT 'CNY',
  supplier_id integer REFERENCES suppliers(id),
  shipping_company_id integer REFERENCES shipping_companies(id),
  payment_id integer REFERENCES payments(id),
  shipping_payment_id integer REFERENCES shipping_payments(id),
  expense_id integer REFERENCES expenses(id),
  description text,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS container_documents (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  container_id integer NOT NULL REFERENCES containers(id),
  invoice_number text,
  invoice_date timestamp,
  shipping_bill boolean DEFAULT false,
  origin_certificate boolean DEFAULT false,
  conformity_certificate boolean DEFAULT false,
  invoice text,
  money_arrival real,
  money_arrival_currency currency DEFAULT 'CNY',
  cashbox_transaction_id integer,
  group_invoice_id integer,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_categories (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id integer NOT NULL REFERENCES users(id),
  category_id integer NOT NULL REFERENCES categories(id)
);

-- Session table for express-session
CREATE TABLE IF NOT EXISTS session (
  sid varchar NOT NULL COLLATE "default",
  sess json NOT NULL,
  expire timestamp(6) NOT NULL,
  PRIMARY KEY (sid)
);
CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire);
