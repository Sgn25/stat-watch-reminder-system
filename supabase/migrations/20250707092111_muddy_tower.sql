/*
  # Add Useful Database Views

  1. Dashboard Views
    - Create views for common dashboard queries
    - Improve performance and simplify frontend code

  2. Reporting Views
    - Add views for compliance reporting
    - Aggregate data for analytics
*/

-- View for parameter status with calculated fields
CREATE OR REPLACE VIEW parameter_status_view AS
SELECT 
  sp.*,
  du.name as dairy_unit_name,
  du.code as dairy_unit_code,
  CASE 
    WHEN sp.expiry_date < CURRENT_DATE THEN 'expired'
    WHEN sp.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'warning'
    ELSE 'valid'
  END as status,
  (sp.expiry_date - CURRENT_DATE) as days_until_expiry,
  CASE 
    WHEN sp.expiry_date < CURRENT_DATE THEN 'Expired'
    WHEN sp.expiry_date = CURRENT_DATE THEN 'Due Today'
    WHEN sp.expiry_date <= CURRENT_DATE + INTERVAL '10 days' THEN 'Critical'
    WHEN sp.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'Warning'
    ELSE 'Valid'
  END as status_label
FROM statutory_parameters sp
LEFT JOIN dairy_units du ON sp.dairy_unit_id = du.id;

-- View for upcoming reminders with parameter details
CREATE OR REPLACE VIEW upcoming_reminders_view AS
SELECT 
  r.*,
  sp.name as parameter_name,
  sp.category as parameter_category,
  sp.expiry_date as parameter_expiry_date,
  du.name as dairy_unit_name,
  p.full_name as user_name,
  (r.reminder_date - CURRENT_DATE) as days_until_reminder,
  CASE 
    WHEN r.reminder_date < CURRENT_DATE THEN 'overdue'
    WHEN r.reminder_date = CURRENT_DATE THEN 'due_today'
    WHEN r.reminder_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'upcoming'
    ELSE 'future'
  END as reminder_status
FROM reminders r
LEFT JOIN statutory_parameters sp ON r.parameter_id = sp.id
LEFT JOIN dairy_units du ON r.dairy_unit_id = du.id
LEFT JOIN profiles p ON r.user_id = p.id
WHERE r.is_sent = false
ORDER BY r.reminder_date ASC;

-- View for compliance dashboard metrics
CREATE OR REPLACE VIEW compliance_metrics_view AS
SELECT 
  du.id as dairy_unit_id,
  du.name as dairy_unit_name,
  COUNT(*) as total_parameters,
  COUNT(*) FILTER (WHERE sp.expiry_date >= CURRENT_DATE) as valid_parameters,
  COUNT(*) FILTER (WHERE sp.expiry_date < CURRENT_DATE) as expired_parameters,
  COUNT(*) FILTER (WHERE sp.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days') as expiring_soon,
  ROUND(
    (COUNT(*) FILTER (WHERE sp.expiry_date >= CURRENT_DATE)::numeric / COUNT(*)::numeric) * 100, 
    2
  ) as compliance_percentage
FROM dairy_units du
LEFT JOIN statutory_parameters sp ON du.id = sp.dairy_unit_id
GROUP BY du.id, du.name;

-- View for parameter history with user details
CREATE OR REPLACE VIEW parameter_history_detailed_view AS
SELECT 
  ph.*,
  sp.name as parameter_name,
  sp.category as parameter_category,
  p.full_name as user_name,
  du.name as dairy_unit_name
FROM parameter_history ph
LEFT JOIN statutory_parameters sp ON ph.parameter_id = sp.id
LEFT JOIN profiles p ON ph.user_id = p.id
LEFT JOIN dairy_units du ON sp.dairy_unit_id = du.id
ORDER BY ph.created_at DESC;

-- View for email subscription status by dairy unit
CREATE OR REPLACE VIEW email_subscription_summary_view AS
SELECT 
  du.id as dairy_unit_id,
  du.name as dairy_unit_name,
  COUNT(es.id) as total_subscriptions,
  COUNT(es.id) FILTER (WHERE es.is_subscribed = true) as active_subscriptions,
  COUNT(es.id) FILTER (WHERE es.is_subscribed = false) as inactive_subscriptions,
  ROUND(
    (COUNT(es.id) FILTER (WHERE es.is_subscribed = true)::numeric / NULLIF(COUNT(es.id)::numeric, 0)) * 100, 
    2
  ) as subscription_rate
FROM dairy_units du
LEFT JOIN email_subscriptions es ON du.id = es.dairy_unit_id
GROUP BY du.id, du.name;

-- Grant appropriate permissions to views
GRANT SELECT ON parameter_status_view TO authenticated;
GRANT SELECT ON upcoming_reminders_view TO authenticated;
GRANT SELECT ON compliance_metrics_view TO authenticated;
GRANT SELECT ON parameter_history_detailed_view TO authenticated;
GRANT SELECT ON email_subscription_summary_view TO authenticated;

-- Add RLS policies for views
ALTER VIEW parameter_status_view SET (security_invoker = true);
ALTER VIEW upcoming_reminders_view SET (security_invoker = true);
ALTER VIEW compliance_metrics_view SET (security_invoker = true);
ALTER VIEW parameter_history_detailed_view SET (security_invoker = true);
ALTER VIEW email_subscription_summary_view SET (security_invoker = true);