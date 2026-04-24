-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum type for roles
CREATE TYPE app_role AS ENUM ('owner', 'caregiver', 'both', 'admin');

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID UNIQUE NOT NULL,
  email      TEXT NOT NULL,
  name       TEXT NOT NULL DEFAULT '',
  phone      TEXT,
  avatar_url TEXT,
  province   TEXT NOT NULL DEFAULT 'San José',
  canton     TEXT NOT NULL DEFAULT 'San José',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User roles
CREATE TABLE IF NOT EXISTS user_roles (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  role    app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Spaces
CREATE TABLE IF NOT EXISTS spaces (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id        UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  description         TEXT NOT NULL DEFAULT '',
  photos              TEXT[] NOT NULL DEFAULT '{}',
  province            TEXT NOT NULL,
  canton              TEXT NOT NULL,
  address             TEXT NOT NULL DEFAULT '',
  latitude            DOUBLE PRECISION NOT NULL DEFAULT 0,
  longitude           DOUBLE PRECISION NOT NULL DEFAULT 0,
  price_per_night     NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_per_hour      NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_hours           INTEGER NOT NULL DEFAULT 1,
  accepted_pet_types  TEXT[] NOT NULL DEFAULT '{}',
  accepted_pet_sizes  TEXT[] NOT NULL DEFAULT '{}',
  max_pets            INTEGER NOT NULL DEFAULT 1,
  amenities           TEXT[] NOT NULL DEFAULT '{}',
  is_active           BOOLEAN NOT NULL DEFAULT true,
  rating              NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count        INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pets
CREATE TABLE IF NOT EXISTS pets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  type         TEXT NOT NULL,
  breed        TEXT,
  age          INTEGER NOT NULL DEFAULT 0,
  size         TEXT NOT NULL,
  description  TEXT,
  photos       TEXT[] NOT NULL DEFAULT '{}',
  special_needs TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id        UUID NOT NULL REFERENCES spaces(id) ON DELETE RESTRICT,
  owner_id        UUID NOT NULL REFERENCES profiles(user_id) ON DELETE RESTRICT,
  pet_ids         UUID[] NOT NULL DEFAULT '{}',
  booking_type    TEXT NOT NULL CHECK (booking_type IN ('hourly','overnight')),
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  start_time      TIME,
  end_time        TIME,
  hours           INTEGER,
  subtotal        NUMERIC(10,2) NOT NULL DEFAULT 0,
  service_fee     NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_price     NUMERIC(10,2) NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','completed')),
  payment_status  TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','refunded')),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Blocked dates
CREATE TABLE IF NOT EXISTS blocked_dates (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id   UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  reason     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  space_id   UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  owner_id   UUID NOT NULL REFERENCES profiles(user_id) ON DELETE RESTRICT,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Favorites
CREATE TABLE IF NOT EXISTS favorites (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  space_id   UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (owner_id, space_id)
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id   UUID REFERENCES spaces(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conversation participants
CREATE TABLE IF NOT EXISTS conversation_participants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (conversation_id, user_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles(user_id) ON DELETE RESTRICT,
  body            TEXT NOT NULL,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_spaces_province ON spaces(province);
CREATE INDEX IF NOT EXISTS idx_spaces_is_active ON spaces(is_active);
CREATE INDEX IF NOT EXISTS idx_spaces_caregiver ON spaces(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_bookings_space ON bookings(space_id);
CREATE INDEX IF NOT EXISTS idx_bookings_owner ON bookings(owner_id);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_space ON blocked_dates(space_id, date);
CREATE INDEX IF NOT EXISTS idx_reviews_space ON reviews(space_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_conv_participants_user ON conversation_participants(user_id);
