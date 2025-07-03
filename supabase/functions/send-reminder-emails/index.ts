import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReminderWithDetails {
  id: string;
  parameter_id: string;
  dairy_unit_id: string;
  reminder_date: string;
  reminder_time: string;
  custom_message: string | null;
  statutory_parameters: {
    name: string;
    category: string;
    expiry_date: string;
    description?: string;
  };
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

async function sendEmailWithResend(to: string, subject: string, htmlContent: string, textContent: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("RESEND_FROM");

  if (!apiKey || !fromEmail) {
    throw new Error("Resend API key or FROM address not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to,
      subject,
      html: htmlContent,
      text: textContent,
    }),
  });

  const result = await response.json();
  console.log("Resend response:", result);

  if (!response.ok) {
    throw new Error(result.error || "Failed to send email via Resend");
  }

  return result;
}

function generateEmailTemplate(reminder: ReminderWithDetails, recipientName: string) {
  const expiryDate = new Date(reminder.statutory_parameters.expiry_date).toLocaleDateString('en-GB');
  const reminderDate = new Date(reminder.reminder_date).toLocaleDateString('en-GB');
  
  const subject = `Reminder: ${reminder.statutory_parameters.name} is expiring`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e3a8a; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .alert { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 License Expiry Reminder</h1>
        </div>
        <div class="content">
          <p>Hi ${recipientName || 'there'},</p>
          
          <div class="alert">
            <h3>⚠️ Important Reminder</h3>
            <p>Your license <strong>${reminder.statutory_parameters.name}</strong> is expiring on <strong>${expiryDate}</strong>.</p>
          </div>
          
          <h3>📊 License Details:</h3>
          <ul>
            <li><strong>Name:</strong> ${reminder.statutory_parameters.name}</li>
            <li><strong>Category:</strong> ${reminder.statutory_parameters.category}</li>
            <li><strong>Expiry Date:</strong> ${expiryDate}</li>
            ${reminder.statutory_parameters.description ? `<li><strong>Description:</strong> ${reminder.statutory_parameters.description}</li>` : ''}
          </ul>
          
          ${reminder.custom_message ? `
          <div style="background: #dbeafe; border: 1px solid #60a5fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h4>📝 Note:</h4>
            <p>${reminder.custom_message}</p>
          </div>` : ''}
          
          <p>Please take the necessary action to renew this license before it expires.</p>
          
          <p>Best regards,<br>
          Dairy License Reminder System</p>
        </div>
        <div class="footer">
          <p>This is an automated reminder. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const textContent = `
    License Expiry Reminder
    
    Hi ${recipientName || 'there'},
    
    This is a reminder that your license "${reminder.statutory_parameters.name}" is expiring on ${expiryDate}.
    
    License Details:
    - Name: ${reminder.statutory_parameters.name}
    - Category: ${reminder.statutory_parameters.category}
    - Expiry Date: ${expiryDate}
    ${reminder.statutory_parameters.description ? `- Description: ${reminder.statutory_parameters.description}` : ''}
    
    ${reminder.custom_message ? `Note: ${reminder.custom_message}` : ''}
    
    Please take the necessary action to renew this license before it expires.
    
    Best regards,
    Dairy License Reminder System
  `;
  
  return { subject, htmlContent, textContent };
}

async function logEmailActivity(reminderId: string, status: 'sent' | 'failed', error?: string, emailCount?: number) {
  try {
    await supabase.from('email_logs').insert({
      reminder_id: reminderId,
      status,
      error_message: error,
      emails_sent: emailCount || 0,
      sent_at: new Date().toISOString(),
    });
  } catch (logError) {
    console.error('Failed to log email activity:', logError);
  }
}

/**
 * Email Reminder Logic (2024-07 update):
 *
 * 1. Every day at 10:00 AM (app time), this function checks for:
 *    a) All reminders expiring today (any time up to 23:59)
 *    b) All statutory parameters expiring in the next 5 days (and not yet renewed)
 * 2. At 11:00 AM, the function is scheduled to send all these reminders/notifications to all registered users.
 * 3. For the test email endpoint, reminders for today are always sent, even if already sent before.
 * 4. Parameter expiry notifications are sent daily from 5 days before expiry until renewed.
 */
const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Determine if this is a test run
  let isTest = false;
  try {
    const body = await req.json().catch(() => ({}));
    isTest = body && body.source === 'manual-test';
  } catch {}

  try {
    console.log('Starting Resend reminder email check...');
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];

    // Auto-delete reminders whose parameter has expired
    const { data: expiredReminders, error: expiredError } = await supabase
      .from('reminders')
      .select('id, parameter_id')
      .neq('parameter_id', null);
    if (!expiredError && expiredReminders && expiredReminders.length > 0) {
      for (const reminder of expiredReminders) {
        // Get the parameter's expiry_date
        const { data: param, error: paramError } = await supabase
          .from('statutory_parameters')
          .select('expiry_date')
          .eq('id', reminder.parameter_id)
          .single();
        if (!paramError && param && param.expiry_date) {
          const expiry = new Date(param.expiry_date);
          const nowDate = new Date(now.toISOString().split('T')[0]);
          if (expiry < nowDate) {
            // Parameter expired, delete the reminder
            await supabase.from('reminders').delete().eq('id', reminder.id);
            console.log(`Auto-deleted reminder ${reminder.id} for expired parameter ${reminder.parameter_id}`);
          }
        }
      }
    }

    // 1. Fetch all reminders for today (regardless of time)
    let remindersQuery = supabase
      .from('reminders')
      .select(`*, statutory_parameters ( name, category, expiry_date, description )`)
      .eq('reminder_date', currentDate);
    if (!isTest) {
      remindersQuery = remindersQuery.eq('is_sent', false);
    }
    const { data: dueReminders, error: remindersError } = await remindersQuery;
    if (remindersError) {
      console.error('Error fetching reminders:', remindersError);
      throw new Error(`Failed to fetch reminders: ${remindersError.message}`);
    }
    console.log(`Found ${dueReminders?.length || 0} due reminders for today`);

    // 2. Fetch all parameters expiring in the next 5 days (and not yet renewed)
    const fiveDaysLater = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const fiveDaysLaterStr = fiveDaysLater.toISOString().split('T')[0];
    const { data: expiringParams, error: paramsError } = await supabase
      .from('statutory_parameters')
      .select('*')
      .gte('expiry_date', currentDate)
      .lte('expiry_date', fiveDaysLaterStr);
      // TODO: Add logic to exclude renewed parameters if such a flag/field exists
    if (paramsError) {
      console.error('Error fetching expiring parameters:', paramsError);
      throw new Error(`Failed to fetch expiring parameters: ${paramsError.message}`);
    }
    console.log(`Found ${expiringParams?.length || 0} parameters expiring in next 5 days`);

    if (!dueReminders || dueReminders.length === 0) {
      // Let's also check what reminders exist for debugging
      const { data: allReminders } = await supabase
        .from('reminders')
        .select('id, reminder_date, reminder_time, is_sent')
        .eq('is_sent', false);
      
      console.log('All pending reminders for debugging:', allReminders);
      
      return new Response(JSON.stringify({ 
        message: 'No due reminders found',
        debug: {
          currentDate,
          currentTime: now.toTimeString().split(' ')[0].substring(0, 5),
          utcTime: now.toISOString(),
          allPendingReminders: allReminders,
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing ${dueReminders.length} due reminders`);
    
    let totalEmailsSent = 0;
    const emailResults: any[] = [];

    // Process each reminder
    for (const reminder of dueReminders as ReminderWithDetails[]) {
      try {
        console.log(`Processing reminder ${reminder.id} for parameter ${reminder.statutory_parameters.name}`);
        
        // Get all users from the same dairy unit
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        
        if (authError) {
          throw new Error(`Failed to fetch auth users: ${authError.message}`);
        }

        // Get profiles for the dairy unit
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, dairy_unit_id')
          .eq('dairy_unit_id', reminder.dairy_unit_id);

        if (profilesError) {
          throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
        }

        if (!profiles || profiles.length === 0) {
          console.log(`No users found for dairy unit ${reminder.dairy_unit_id}`);
          continue;
        }

        // Match profiles with auth users to get email addresses
        const usersWithEmails: Array<{email: string, name: string}> = [];
        
        for (const profile of profiles) {
          const authUser = authUsers.users.find(u => u.id === profile.id);
          if (authUser?.email) {
            usersWithEmails.push({
              email: authUser.email,
              name: profile.full_name || 'Team Member'
            });
          }
        }

        if (usersWithEmails.length === 0) {
          console.log(`No email addresses found for dairy unit ${reminder.dairy_unit_id}`);
          await logEmailActivity(reminder.id, 'failed', 'No email addresses found');
          continue;
        }

        console.log(`Sending email to ${usersWithEmails.length} users`);

        // Send emails one by one with delay
        let successfulSends = 0;
        for (const user of usersWithEmails) {
          try {
            // Generate personalized email content
            const emailTemplate = generateEmailTemplate(reminder, user.name);
            // Send email via Resend
            const emailResult = await sendEmailWithResend(
              user.email,
              emailTemplate.subject,
              emailTemplate.htmlContent,
              emailTemplate.textContent
            );
            console.log(`Email sent successfully to ${user.email}:`, emailResult);
            successfulSends++;
            // Add 2-second delay between sends to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
          } catch (emailError) {
            console.error(`Failed to send email to ${user.email}:`, emailError);
          }
        }

        if (successfulSends > 0) {
          // Mark reminder as sent
          await supabase
            .from('reminders')
            .update({ is_sent: true })
            .eq('id', reminder.id);

          totalEmailsSent += successfulSends;
          await logEmailActivity(reminder.id, 'sent', undefined, successfulSends);

          emailResults.push({
            reminderId: reminder.id,
            parameterName: reminder.statutory_parameters.name,
            emailsSent: successfulSends,
            status: 'success'
          });
        } else {
          await logEmailActivity(reminder.id, 'failed', 'No emails sent successfully');
          
          emailResults.push({
            reminderId: reminder.id,
            parameterName: reminder.statutory_parameters.name,
            status: 'failed',
            error: 'No emails sent successfully'
          });
        }

      } catch (error) {
        console.error(`Failed to process reminder ${reminder.id}:`, error);
        await logEmailActivity(reminder.id, 'failed', error.message);
        
        emailResults.push({
          reminderId: reminder.id,
          parameterName: reminder.statutory_parameters.name,
          status: 'failed',
          error: error.message
        });
      }
    }

    // Send parameter expiry notifications
    for (const param of expiringParams || []) {
      try {
        // Get all users from the same dairy unit
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) throw new Error(`Failed to fetch auth users: ${authError.message}`);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, dairy_unit_id')
          .eq('dairy_unit_id', param.dairy_unit_id);
        if (profilesError) throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
        if (!profiles || profiles.length === 0) continue;
        const usersWithEmails: Array<{email: string, name: string}> = [];
        for (const profile of profiles) {
          const authUser = authUsers.users.find(u => u.id === profile.id);
          if (authUser?.email) {
            usersWithEmails.push({ email: authUser.email, name: profile.full_name || 'Team Member' });
          }
        }
        for (const user of usersWithEmails) {
          try {
            // Generate parameter expiry email content
            const expiryDate = new Date(param.expiry_date).toLocaleDateString('en-GB');
            const subject = `Parameter Expiry Notice: ${param.name} expires on ${expiryDate}`;
            const htmlContent = `<p>Hi ${user.name},<br>Your parameter <b>${param.name}</b> is expiring on <b>${expiryDate}</b>.<br>Please renew it to avoid compliance issues.</p>`;
            const textContent = `Hi ${user.name},\nYour parameter ${param.name} is expiring on ${expiryDate}. Please renew it to avoid compliance issues.`;
            const emailResult = await sendEmailWithResend(user.email, subject, htmlContent, textContent);
            console.log(`Parameter expiry email sent to ${user.email}:`, emailResult);
            await new Promise(resolve => setTimeout(resolve, 2000));
          } catch (emailError) {
            console.error(`Failed to send parameter expiry email to ${user.email}:`, emailError);
          }
        }
      } catch (err) {
        console.error('Error processing parameter expiry notification:', err);
      }
    }

    console.log(`Email processing complete. Total emails sent: ${totalEmailsSent}`);

    return new Response(JSON.stringify({
      message: 'Resend email processing completed',
      totalEmailsSent,
      processedReminders: emailResults.length,
      results: emailResults,
      debug: {
        currentDate,
        currentTime: now.toTimeString().split(' ')[0].substring(0, 5),
        utcTime: now.toISOString(),
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-reminder-emails function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
