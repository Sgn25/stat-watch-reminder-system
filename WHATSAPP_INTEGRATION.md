# WhatsApp Integration for StatMonitor

This document outlines the WhatsApp integration implementation for the StatMonitor application, which allows users to receive WhatsApp notifications for parameter reminders and expiry alerts.

## Overview

The WhatsApp integration provides:
- WhatsApp number management in user profiles
- WhatsApp subscription preferences
- Automated WhatsApp notifications for user-set reminders
- Automated WhatsApp notifications for 5-day expiry alerts
- WhatsApp message logging and tracking

## Database Changes

### New Tables Created

1. **`whatsapp_subscriptions`** - Manages user WhatsApp preferences
   - `id` (UUID, Primary Key)
   - `user_id` (UUID, Foreign Key to auth.users)
   - `dairy_unit_id` (UUID, Foreign Key to dairy_units)
   - `whatsapp_number` (TEXT, Required)
   - `is_subscribed` (BOOLEAN, Default: true)
   - `subscribed_at` (TIMESTAMP)
   - `unsubscribed_at` (TIMESTAMP, Nullable)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

2. **`whatsapp_logs`** - Tracks WhatsApp message delivery
   - `id` (UUID, Primary Key)
   - `user_id` (UUID, Foreign Key to auth.users)
   - `dairy_unit_id` (UUID, Foreign Key to dairy_units)
   - `whatsapp_number` (TEXT, Required)
   - `message_type` (TEXT) - 'reminder', 'expiry', 'test'
   - `parameter_id` (UUID, Foreign Key to statutory_parameters)
   - `message_content` (TEXT, Required)
   - `status` (TEXT) - 'pending', 'sent', 'delivered', 'failed'
   - `error_message` (TEXT, Nullable)
   - `sent_at` (TIMESTAMP)
   - `delivered_at` (TIMESTAMP, Nullable)
   - `created_at` (TIMESTAMP)

### Modified Tables

1. **`profiles`** - Added `whatsapp_number` column
   - `whatsapp_number` (TEXT, Nullable)

## Frontend Changes

### New Components and Hooks

1. **`useWhatsAppSubscription`** - Hook for managing WhatsApp subscriptions
   - Fetch user's WhatsApp subscription status
   - Subscribe/unsubscribe from WhatsApp notifications
   - Handle subscription state management

### Updated Pages

1. **Profile Page** (`src/pages/Profile.tsx`)
   - Added WhatsApp number input field
   - Added WhatsApp subscription management section
   - WhatsApp number validation
   - Subscription toggle functionality

2. **Complete Profile Page** (`src/pages/CompleteProfile.tsx`)
   - Added WhatsApp number field during profile creation
   - Automatic WhatsApp subscription creation if number provided

3. **Reminders Page** (`src/pages/Reminders.tsx`)
   - Added "Test WhatsApp" button
   - WhatsApp testing functionality

## Backend Functions

### New Supabase Edge Functions

1. **`send-whatsapp-messages`** - Main WhatsApp sending function
   - Processes user-set reminders
   - Processes 5-day expiry reminders
   - Processes daily expired parameter reminders
   - Logs all WhatsApp messages
   - Handles WhatsApp API integration

2. **`schedule-whatsapp-check`** - Scheduler function
   - Triggers WhatsApp message sending
   - Handles scheduled execution
   - Error handling and logging

3. **`test-whatsapp-send`** - Test function
   - Sends test WhatsApp messages
   - Validates WhatsApp API configuration
   - Tests with actual user subscriptions

## WhatsApp API Configuration

### Required Environment Variables

Add these environment variables to your Supabase project:

```bash
# WhatsApp Business API Configuration
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_API_KEY=your_whatsapp_api_key
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
```

### WhatsApp Business API Setup

1. **Create a Meta Developer Account**
   - Go to [Meta for Developers](https://developers.facebook.com/)
   - Create a new app or use existing app
   - Add WhatsApp Business API product

2. **Configure WhatsApp Business API**
   - Set up your business phone number
   - Get your Phone Number ID
   - Generate Access Token
   - Configure webhook (if needed)

3. **Message Templates** (Optional)
   - Create message templates for different notification types
   - Get template approval from Meta

## Deployment Steps

### 1. Database Migration

Run the database migration to create new tables:

```sql
-- Run the migration file: supabase/migrations/20250708000000_create_whatsapp_subscriptions.sql
```

### 2. Deploy Edge Functions

Deploy the new Supabase Edge Functions:

```bash
supabase functions deploy send-whatsapp-messages
supabase functions deploy schedule-whatsapp-check
supabase functions deploy test-whatsapp-send
```

### 3. Set Environment Variables

Configure WhatsApp API environment variables in Supabase:

```bash
supabase secrets set WHATSAPP_API_URL=https://graph.facebook.com/v18.0
supabase secrets set WHATSAPP_API_KEY=your_api_key
supabase secrets set WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
supabase secrets set WHATSAPP_ACCESS_TOKEN=your_access_token
```

### 4. Set Up Cron Jobs

Configure scheduled execution for WhatsApp notifications:

```bash
# Add to your cron job configuration
# Daily at 9:00 AM IST (3:30 AM UTC)
0 3 30 * * * curl -X POST "https://your-project.supabase.co/functions/v1/schedule-whatsapp-check"
```

## Testing

### 1. Test WhatsApp Configuration

1. Add a WhatsApp number to your user profile
2. Subscribe to WhatsApp notifications
3. Click "Test WhatsApp" button in Reminders page
4. Check if test message is received

### 2. Test Automated Notifications

1. Create a parameter with expiry date within 5 days
2. Set a reminder for today
3. Wait for scheduled execution or trigger manually
4. Verify WhatsApp messages are sent

## Message Format

### User-Set Reminder Message
```
🔔 License Renewal Required

Hello John Doe,

Your license "Business License" reminder is due today.

📄 License Information:
• Name: Business License
• Category: License
• Expiry Date: 15/12/2024
• Reminder Date: 10/12/2024
• Days Until Expiry: 5 days

⚠️ Action Required:
This license expires in 5 days. Please take necessary action before the expiry date to maintain compliance.

Don't let your license expire! Take action today to maintain compliance and avoid potential penalties.

---
StatMonitor - Your Compliance Partner
Reply STOP to unsubscribe from WhatsApp reminders.
```

### 5-Day Expiry Message
```
🚨 License Renewal Required

Hello John Doe,

Your license "Business License" expires on 15/12/2024.

📄 License Information:
• Name: Business License
• Category: License
• Expiry Date: 15/12/2024

⚠️ Action Required:
This license expires in 5 days. Please renew it to maintain compliance.

Don't let your license expire! Take action today to maintain compliance and avoid potential penalties.

---
StatMonitor - Your Compliance Partner
Reply STOP to unsubscribe from WhatsApp reminders.
```

## Error Handling

### Common Issues

1. **Missing WhatsApp API Configuration**
   - Ensure all environment variables are set
   - Verify API credentials are correct

2. **Invalid Phone Number Format**
   - Phone numbers must be in international format
   - Supported format: `+1234567890` or `1234567890`

3. **WhatsApp API Rate Limits**
   - Monitor API usage and rate limits
   - Implement retry logic for failed messages

4. **User Not Subscribed**
   - Check subscription status before sending
   - Handle unsubscribed users gracefully

## Monitoring and Logging

### WhatsApp Logs

All WhatsApp messages are logged in the `whatsapp_logs` table with:
- Message content
- Delivery status
- Error messages (if any)
- Timestamps

### Dashboard Views

Use the `whatsapp_subscription_summary_view` to monitor:
- Total subscriptions per dairy unit
- Active vs inactive subscriptions
- Subscription rates

## Security Considerations

1. **Phone Number Validation**
   - Validate phone number format
   - Prevent injection attacks

2. **Access Control**
   - RLS policies ensure users can only manage their own subscriptions
   - Service role key used only for automated functions

3. **Data Privacy**
   - WhatsApp numbers stored securely
   - Logs contain minimal sensitive information

## Future Enhancements

1. **Message Templates**
   - Support for rich media messages
   - Interactive buttons and quick replies

2. **Delivery Status**
   - Real-time delivery status updates
   - Read receipts tracking

3. **Bulk Messaging**
   - Send messages to multiple users
   - Batch processing for efficiency

4. **Analytics**
   - Message delivery analytics
   - User engagement metrics

## Support

For issues with WhatsApp integration:
1. Check Supabase function logs
2. Verify WhatsApp API configuration
3. Test with the test function
4. Review error messages in whatsapp_logs table 