
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

function generateEmailTemplate(reminder: ReminderWithDetails, recipientName: string, recipientEmail: string) {
  const expiryDate = new Date(reminder.statutory_parameters.expiry_date).toLocaleDateString('en-GB');
  const reminderDate = new Date(reminder.reminder_date).toLocaleDateString('en-GB');
  
  const subject = `License Renewal Required: ${reminder.statutory_parameters.name}`;
  
  // Calculate unsubscribe URL with proper encoding
  const unsubscribeUrl = `https://unsubscribe.resend.com/?email=${encodeURIComponent(recipientEmail)}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>License Renewal Reminder</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f8fafc;
          color: #1e293b;
          line-height: 1.6;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          color: white;
          padding: 32px 24px;
          text-align: center;
        }
        .header h1 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
          letter-spacing: -0.025em;
        }
        .header p {
          font-size: 16px;
          opacity: 0.9;
        }
        .content {
          padding: 32px 24px;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 24px;
          color: #374151;
        }
        .alert-card {
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          border: 1px solid #f87171;
          border-radius: 8px;
          padding: 20px;
          margin: 24px 0;
          position: relative;
          overflow: hidden;
        }
        .alert-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: #dc2626;
        }
        .alert-title {
          font-size: 20px;
          font-weight: 700;
          color: #dc2626;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .alert-message {
          font-size: 16px;
          color: #991b1b;
          font-weight: 500;
        }
        .details-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 24px;
          margin: 24px 0;
        }
        .details-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .details-list {
          list-style: none;
          space-y: 12px;
        }
        .details-list li {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .details-list li:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: 600;
          color: #475569;
        }
        .detail-value {
          color: #1e293b;
          font-weight: 500;
        }
        .custom-message {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          border: 1px solid #60a5fa;
          border-radius: 8px;
          padding: 20px;
          margin: 24px 0;
          position: relative;
        }
        .custom-message::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: #3b82f6;
        }
        .custom-message h4 {
          font-size: 16px;
          font-weight: 600;
          color: #1e40af;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .custom-message p {
          color: #1e40af;
          font-weight: 500;
        }
        .cta-section {
          text-align: center;
          margin: 32px 0;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          color: white;
          text-decoration: none;
          padding: 16px 32px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 16px;
          letter-spacing: 0.025em;
          box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.5);
        }
        .urgency-text {
          font-size: 16px;
          color: #374151;
          margin: 24px 0;
          text-align: center;
        }
        .footer {
          background: #f8fafc;
          padding: 24px;
          text-align: center;
          border-top: 1px solid #e2e8f0;
        }
        .footer p {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 8px;
        }
        .footer .brand {
          font-weight: 700;
          color: #1e3a8a;
        }
        .unsubscribe-link {
          font-size: 12px;
          color: #9ca3af;
          text-decoration: underline;
          margin-top: 16px;
          display: block;
        }
        @media (max-width: 600px) {
          .email-container {
            margin: 0;
            border-radius: 0;
          }
          .header, .content, .footer {
            padding-left: 16px;
            padding-right: 16px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>📋 License Renewal Required</h1>
          <p>StatMonitor - Your Compliance Partner</p>
        </div>
        
        <div class="content">
          <div class="greeting">
            Hello ${recipientName || 'Team Member'},
          </div>
          
          <div class="alert-card">
            <div class="alert-title">
              ⚠️ Action Required
            </div>
            <div class="alert-message">
              Your license <strong>${reminder.statutory_parameters.name}</strong> expires on <strong>${expiryDate}</strong>
            </div>
          </div>
          
          <div class="details-card">
            <div class="details-title">
              📊 License Information
            </div>
            <ul class="details-list">
              <li>
                <span class="detail-label">License Name:</span>
                <span class="detail-value">${reminder.statutory_parameters.name}</span>
              </li>
              <li>
                <span class="detail-label">Category:</span>
                <span class="detail-value">${reminder.statutory_parameters.category}</span>
              </li>
              <li>
                <span class="detail-label">Expiry Date:</span>
                <span class="detail-value">${expiryDate}</span>
              </li>
              ${reminder.statutory_parameters.description ? `
              <li>
                <span class="detail-label">Description:</span>
                <span class="detail-value">${reminder.statutory_parameters.description}</span>
              </li>` : ''}
            </ul>
          </div>
          
          ${reminder.custom_message ? `
          <div class="custom-message">
            <h4>📝 Additional Note</h4>
            <p>${reminder.custom_message}</p>
          </div>` : ''}
          
          <div class="cta-section">
            <a href="https://statmonitor.vercel.app/parameters" class="cta-button">
              🔄 Renew License Now
            </a>
          </div>
          
          <div class="urgency-text">
            Don't let your license expire! Take action today to maintain compliance and avoid potential penalties.
          </div>
        </div>
        
        <div class="footer">
          <p>This is an automated reminder from <span class="brand">StatMonitor</span></p>
          <p>Need help? Contact your administrator or reply to this email.</p>
          <p style="margin-top: 12px; font-size: 12px;">© 2024 StatMonitor. All rights reserved.</p>
          <a href="${unsubscribeUrl}" class="unsubscribe-link" target="_blank">
            Unsubscribe from these emails
          </a>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const textContent = `
    License Renewal Required - StatMonitor
    
    Hello ${recipientName || 'Team Member'},
    
    This is an important reminder that your license "${reminder.statutory_parameters.name}" expires on ${expiryDate}.
    
    License Details:
    • Name: ${reminder.statutory_parameters.name}
    • Category: ${reminder.statutory_parameters.category}
    • Expiry Date: ${expiryDate}
    ${reminder.statutory_parameters.description ? `• Description: ${reminder.statutory_parameters.description}` : ''}
    
    ${reminder.custom_message ? `Additional Note: ${reminder.custom_message}` : ''}
    
    RENEW NOW: https://statmonitor.vercel.app/parameters
    
    Don't let your license expire! Take action today to maintain compliance.
    
    Best regards,
    StatMonitor Team
    
    ---
    This is an automated reminder. Need help? Contact your administrator.
    
    To unsubscribe from these emails, visit: ${unsubscribeUrl}
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
        const { data: param, error: paramError } = await supabase
          .from('statutory_parameters')
          .select('expiry_date')
          .eq('id', reminder.parameter_id)
          .single();
        if (!paramError && param && param.expiry_date) {
          const expiry = new Date(param.expiry_date);
          const nowDate = new Date(now.toISOString().split('T')[0]);
          if (expiry < nowDate) {
            await supabase.from('reminders').delete().eq('id', reminder.id);
            console.log(`Auto-deleted reminder ${reminder.id} for expired parameter ${reminder.parameter_id}`);
          }
        }
      }
    }

    // 1. Fetch all reminders for today
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

    // 2. Fetch all parameters expiring in the next 5 days (FIXED LOGIC)
    const fiveDaysLater = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const fiveDaysLaterStr = fiveDaysLater.toISOString().split('T')[0];
    
    console.log(`Checking for parameters expiring between ${currentDate} and ${fiveDaysLaterStr}`);
    
    const { data: expiringParams, error: paramsError } = await supabase
      .from('statutory_parameters')
      .select('*')
      .gte('expiry_date', currentDate)
      .lte('expiry_date', fiveDaysLaterStr);
    
    if (paramsError) {
      console.error('Error fetching expiring parameters:', paramsError);
      throw new Error(`Failed to fetch expiring parameters: ${paramsError.message}`);
    }
    console.log(`Found ${expiringParams?.length || 0} parameters expiring in next 5 days`);

    let totalEmailsSent = 0;
    const emailResults: any[] = [];

    // Process regular reminders
    if (dueReminders && dueReminders.length > 0) {
      console.log(`Processing ${dueReminders.length} due reminders`);
      
      for (const reminder of dueReminders as ReminderWithDetails[]) {
        try {
          console.log(`Processing reminder ${reminder.id} for parameter ${reminder.statutory_parameters.name}`);
          
          const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
          if (authError) {
            throw new Error(`Failed to fetch auth users: ${authError.message}`);
          }

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

          let successfulSends = 0;
          for (const user of usersWithEmails) {
            try {
              const emailTemplate = generateEmailTemplate(reminder, user.name, user.email);
              const emailResult = await sendEmailWithResend(
                user.email,
                emailTemplate.subject,
                emailTemplate.htmlContent,
                emailTemplate.textContent
              );
              console.log(`Email sent successfully to ${user.email}:`, emailResult);
              successfulSends++;
              await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (emailError) {
              console.error(`Failed to send email to ${user.email}:`, emailError);
            }
          }

          if (successfulSends > 0) {
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
    }

    // Process parameter expiry notifications (FIXED)
    if (expiringParams && expiringParams.length > 0) {
      console.log(`Processing ${expiringParams.length} expiring parameters`);
      
      for (const param of expiringParams) {
        try {
          console.log(`Processing expiring parameter ${param.name} (expires: ${param.expiry_date})`);
          
          const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
          if (authError) throw new Error(`Failed to fetch auth users: ${authError.message}`);
          
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, dairy_unit_id')
            .eq('dairy_unit_id', param.dairy_unit_id);
          if (profilesError) throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
          
          if (!profiles || profiles.length === 0) {
            console.log(`No users found for dairy unit ${param.dairy_unit_id}`);
            continue;
          }
          
          const usersWithEmails: Array<{email: string, name: string}> = [];
          for (const profile of profiles) {
            const authUser = authUsers.users.find(u => u.id === profile.id);
            if (authUser?.email) {
              usersWithEmails.push({ email: authUser.email, name: profile.full_name || 'Team Member' });
            }
          }
          
          if (usersWithEmails.length === 0) {
            console.log(`No email addresses found for dairy unit ${param.dairy_unit_id}`);
            continue;
          }
          
          // Calculate days until expiry
          const expiryDate = new Date(param.expiry_date);
          const todayDate = new Date(currentDate);
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
          
          console.log(`Parameter ${param.name} expires in ${daysUntilExpiry} days`);
          
          for (const user of usersWithEmails) {
            try {
              // Create a reminder-like object for parameter expiry notifications
              const fakeReminder = {
                id: `param-${param.id}`,
                parameter_id: param.id,
                dairy_unit_id: param.dairy_unit_id,
                reminder_date: currentDate,
                reminder_time: '10:00',
                custom_message: `This license expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}. Please renew it to maintain compliance.`,
                statutory_parameters: {
                  name: param.name,
                  category: param.category,
                  expiry_date: param.expiry_date,
                  description: param.description
                }
              };
              
              const emailTemplate = generateEmailTemplate(fakeReminder, user.name, user.email);
              const emailResult = await sendEmailWithResend(user.email, emailTemplate.subject, emailTemplate.htmlContent, emailTemplate.textContent);
              console.log(`Parameter expiry email sent to ${user.email}:`, emailResult);
              totalEmailsSent++;
              await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (emailError) {
              console.error(`Failed to send parameter expiry email to ${user.email}:`, emailError);
            }
          }
        } catch (err) {
          console.error('Error processing parameter expiry notification:', err);
        }
      }
    }

    console.log(`Email processing complete. Total emails sent: ${totalEmailsSent}`);

    return new Response(JSON.stringify({
      message: 'Resend email processing completed',
      totalEmailsSent,
      processedReminders: emailResults.length,
      processedExpiringParams: expiringParams?.length || 0,
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
