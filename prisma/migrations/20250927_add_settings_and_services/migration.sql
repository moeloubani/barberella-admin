-- CreateTable
CREATE TABLE IF NOT EXISTS "settings" (
    "id" SERIAL NOT NULL,
    "shop_name" TEXT NOT NULL DEFAULT 'Barberella',
    "opening_time" TEXT NOT NULL DEFAULT '09:00',
    "closing_time" TEXT NOT NULL DEFAULT '19:00',
    "slot_duration" INTEGER NOT NULL DEFAULT 30,
    "days_open" TEXT[] DEFAULT ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    "max_advance_days" INTEGER NOT NULL DEFAULT 30,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "services" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "services_is_active_idx" ON "services"("is_active");

-- Insert default settings if not exists
INSERT INTO "settings" (shop_name, opening_time, closing_time, slot_duration, days_open, max_advance_days, updated_at)
SELECT 'Barberella', '09:00', '19:00', 30, ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], 30, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM settings LIMIT 1);

-- Insert default services
INSERT INTO "services" (name, description, duration, price, is_active, updated_at) VALUES
('Haircut', 'Classic haircut service', 30, 35, true, CURRENT_TIMESTAMP),
('Beard Trim', 'Professional beard trimming and shaping', 15, 15, true, CURRENT_TIMESTAMP),
('Haircut & Beard', 'Complete grooming package', 45, 45, true, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;