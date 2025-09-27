-- Add confirmation_code column to appointments table
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS confirmation_code VARCHAR(3);

-- Update existing appointments with random 3-digit codes
UPDATE appointments
SET confirmation_code = LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0')
WHERE confirmation_code IS NULL;

-- Make it NOT NULL for future appointments
ALTER TABLE appointments
ALTER COLUMN confirmation_code SET NOT NULL;

-- Add index for quick lookups
CREATE INDEX IF NOT EXISTS idx_appointments_confirmation_code
ON appointments(confirmation_code);