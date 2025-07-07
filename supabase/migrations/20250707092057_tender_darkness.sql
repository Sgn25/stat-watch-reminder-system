/*
  # Add Data Validation Constraints

  1. Check Constraints
    - Ensure data quality with validation rules
    - Prevent invalid data entry

  2. Default Values
    - Add sensible defaults where missing
    - Improve data consistency
*/

-- Add check constraints for date validation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'statutory_parameters_date_check'
  ) THEN
    ALTER TABLE statutory_parameters 
    ADD CONSTRAINT statutory_parameters_date_check 
    CHECK (expiry_date >= issue_date);
  END IF;
END $$;

-- Add check constraint for reminder date validation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'reminders_date_check'
  ) THEN
    ALTER TABLE reminders 
    ADD CONSTRAINT reminders_date_check 
    CHECK (reminder_date <= (SELECT expiry_date FROM statutory_parameters WHERE id = parameter_id));
  END IF;
END $$;

-- Add check constraint for email validation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'email_subscriptions_email_check'
  ) THEN
    ALTER TABLE email_subscriptions 
    ADD CONSTRAINT email_subscriptions_email_check 
    CHECK (email_address ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
  END IF;
END $$;

-- Add check constraint for parameter names (non-empty)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'statutory_parameters_name_check'
  ) THEN
    ALTER TABLE statutory_parameters 
    ADD CONSTRAINT statutory_parameters_name_check 
    CHECK (length(trim(name)) > 0);
  END IF;
END $$;

-- Add check constraint for dairy unit codes (format validation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'dairy_units_code_check'
  ) THEN
    ALTER TABLE dairy_units 
    ADD CONSTRAINT dairy_units_code_check 
    CHECK (length(trim(code)) >= 2 AND code ~ '^[A-Z0-9_-]+$');
  END IF;
END $$;

-- Add default values where missing
ALTER TABLE reminder_settings 
ALTER COLUMN email_notifications_enabled SET DEFAULT true;

ALTER TABLE email_subscriptions 
ALTER COLUMN is_subscribed SET DEFAULT true;

-- Add updated_at trigger for tables missing it
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers for tables that need them
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_dairy_units_updated_at'
  ) THEN
    CREATE TRIGGER update_dairy_units_updated_at 
    BEFORE UPDATE ON dairy_units 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_statutory_parameters_updated_at'
  ) THEN
    CREATE TRIGGER update_statutory_parameters_updated_at 
    BEFORE UPDATE ON statutory_parameters 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_reminders_updated_at'
  ) THEN
    CREATE TRIGGER update_reminders_updated_at 
    BEFORE UPDATE ON reminders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;