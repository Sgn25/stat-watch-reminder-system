/*
  # Add Missing Foreign Key Constraints

  1. Foreign Keys
    - Add missing foreign key constraints for better data integrity
    - Ensure referential integrity across all tables

  2. Indexes
    - Add performance indexes for frequently queried columns
    - Improve query performance for dashboard and reports
*/

-- Add missing foreign key for parameter_notes.user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'parameter_notes_user_id_fkey' 
    AND table_name = 'parameter_notes'
  ) THEN
    ALTER TABLE parameter_notes 
    ADD CONSTRAINT parameter_notes_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add missing foreign key for parameter_history.user_id  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'parameter_history_user_id_fkey' 
    AND table_name = 'parameter_history'
  ) THEN
    ALTER TABLE parameter_history 
    ADD CONSTRAINT parameter_history_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add missing foreign key for reminder_settings.user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'reminder_settings_user_id_fkey' 
    AND table_name = 'reminder_settings'
  ) THEN
    ALTER TABLE reminder_settings 
    ADD CONSTRAINT reminder_settings_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add missing foreign key for reminders.user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'reminders_user_id_fkey' 
    AND table_name = 'reminders'
  ) THEN
    ALTER TABLE reminders 
    ADD CONSTRAINT reminders_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add missing foreign key for reminders.dairy_unit_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'reminders_dairy_unit_id_fkey' 
    AND table_name = 'reminders'
  ) THEN
    ALTER TABLE reminders 
    ADD CONSTRAINT reminders_dairy_unit_id_fkey 
    FOREIGN KEY (dairy_unit_id) REFERENCES dairy_units(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_statutory_parameters_expiry_date 
ON statutory_parameters(expiry_date);

CREATE INDEX IF NOT EXISTS idx_statutory_parameters_dairy_unit_id 
ON statutory_parameters(dairy_unit_id);

CREATE INDEX IF NOT EXISTS idx_parameter_history_created_at 
ON parameter_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_parameter_notes_created_at 
ON parameter_notes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at 
ON email_logs(sent_at DESC);

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_reminders_date_dairy_unit 
ON reminders(reminder_date, dairy_unit_id);

CREATE INDEX IF NOT EXISTS idx_statutory_parameters_status_lookup 
ON statutory_parameters(dairy_unit_id, expiry_date);