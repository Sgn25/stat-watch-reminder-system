/*
  # Add Data Archival and Cleanup

  1. Archive Tables
    - Create archive tables for historical data
    - Implement data retention policies

  2. Cleanup Functions
    - Add functions for automated cleanup
    - Maintain database performance
*/

-- Create archive table for old parameter history
CREATE TABLE IF NOT EXISTS parameter_history_archive (
  LIKE parameter_history INCLUDING ALL
);

-- Create archive table for old email logs
CREATE TABLE IF NOT EXISTS email_logs_archive (
  LIKE email_logs INCLUDING ALL
);

-- Function to archive old parameter history (older than 2 years)
CREATE OR REPLACE FUNCTION archive_old_parameter_history()
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  -- Move records older than 2 years to archive
  WITH moved_records AS (
    DELETE FROM parameter_history 
    WHERE created_at < CURRENT_DATE - INTERVAL '2 years'
    RETURNING *
  )
  INSERT INTO parameter_history_archive 
  SELECT * FROM moved_records;
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to archive old email logs (older than 1 year)
CREATE OR REPLACE FUNCTION archive_old_email_logs()
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  -- Move records older than 1 year to archive
  WITH moved_records AS (
    DELETE FROM email_logs 
    WHERE sent_at < CURRENT_DATE - INTERVAL '1 year'
    RETURNING *
  )
  INSERT INTO email_logs_archive 
  SELECT * FROM moved_records;
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old sent reminders (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_reminders()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete old sent reminders
  DELETE FROM reminders 
  WHERE is_sent = true 
  AND reminder_date < CURRENT_DATE - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup orphaned records
CREATE OR REPLACE FUNCTION cleanup_orphaned_records()
RETURNS TABLE(table_name TEXT, deleted_count INTEGER) AS $$
BEGIN
  -- Cleanup orphaned parameter notes
  DELETE FROM parameter_notes 
  WHERE parameter_id NOT IN (SELECT id FROM statutory_parameters);
  
  RETURN QUERY SELECT 'parameter_notes'::TEXT, ROW_COUNT;
  
  -- Cleanup orphaned reminders
  DELETE FROM reminders 
  WHERE parameter_id NOT IN (SELECT id FROM statutory_parameters);
  
  RETURN QUERY SELECT 'reminders'::TEXT, ROW_COUNT;
  
  -- Cleanup orphaned email subscriptions
  DELETE FROM email_subscriptions 
  WHERE dairy_unit_id NOT IN (SELECT id FROM dairy_units);
  
  RETURN QUERY SELECT 'email_subscriptions'::TEXT, ROW_COUNT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for comprehensive database maintenance
CREATE OR REPLACE FUNCTION perform_database_maintenance()
RETURNS TABLE(
  operation TEXT, 
  affected_records INTEGER, 
  execution_time INTERVAL
) AS $$
DECLARE
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  record_count INTEGER;
BEGIN
  -- Archive old parameter history
  start_time := clock_timestamp();
  SELECT archive_old_parameter_history() INTO record_count;
  end_time := clock_timestamp();
  
  RETURN QUERY SELECT 
    'Archive Parameter History'::TEXT, 
    record_count, 
    end_time - start_time;
  
  -- Archive old email logs
  start_time := clock_timestamp();
  SELECT archive_old_email_logs() INTO record_count;
  end_time := clock_timestamp();
  
  RETURN QUERY SELECT 
    'Archive Email Logs'::TEXT, 
    record_count, 
    end_time - start_time;
  
  -- Cleanup old reminders
  start_time := clock_timestamp();
  SELECT cleanup_old_reminders() INTO record_count;
  end_time := clock_timestamp();
  
  RETURN QUERY SELECT 
    'Cleanup Old Reminders'::TEXT, 
    record_count, 
    end_time - start_time;
  
  -- Vacuum and analyze tables
  start_time := clock_timestamp();
  VACUUM ANALYZE;
  end_time := clock_timestamp();
  
  RETURN QUERY SELECT 
    'Vacuum Analyze'::TEXT, 
    0, 
    end_time - start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION archive_old_parameter_history() TO service_role;
GRANT EXECUTE ON FUNCTION archive_old_email_logs() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_reminders() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_orphaned_records() TO service_role;
GRANT EXECUTE ON FUNCTION perform_database_maintenance() TO service_role;