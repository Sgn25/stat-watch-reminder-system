
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

// Gmail SMTP configuration
const GMAIL_USER = Deno.env.get('GMAIL_USER');
const GMAIL_APP_PASS = Deno.env.get('GMAIL_APP_PASS');

async function sendGmailEmail(to: string, subject: string, htmlContent: string, textContent: string) {
  if (!GMAIL_USER || !GMAIL_APP_PASS) {
    throw new Error('Gmail credentials not configured');
  }

  // Create the email message in RFC2822 format
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36)}`;
  const emailMessage = [
    `From: Reminder Bot <${GMAIL_USER}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=utf-8`,
    ``,
    textContent,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=utf-8`,
    ``,
    htmlContent,
    ``,
    `--${boundary}--`
  ].join('\r\n');

  // Base64 encode the message
  const encodedMessage = btoa(emailMessage).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  // Use Gmail API via SMTP authentication
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${GMAIL_USER}:${GMAIL_APP_PASS}`)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodedMessage
    })
  });

  if (!response.ok) {
    // Fallback to direct SMTP if Gmail API fails
    return await sendViaSMTP(to, subject, htmlContent, textContent);
  }

  return await response.json();
}

async function sendViaSMTP(to: string, subject: string, htmlContent: string, textContent: string) {
  // Direct SMTP connection to Gmail
  const smtpData = {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASS
    },
    from: `Reminder Bot <${GMAIL_USER}>`,
    to: to,
    subject: subject,
    text: textContent,
    html: htmlContent
  };

  // Use a simple SMTP implementation for Deno
  try {
    const conn = await Deno.connect({
      hostname: 'smtp.gmail.com',
      port: 465,
      transport: 'tcp'
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // SMTP handshake
    await conn.write(encoder.encode(`EHLO localhost\r\n`));
    await new Promise(resolve => setTimeout(resolve, 1000));

    // AUTH LOGIN
    await conn.write(encoder.encode(`AUTH LOGIN\r\n`));
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await conn.write(encoder.encode(`${btoa(GMAIL_USER!)}\r\n`));
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await conn.write(encoder.encode(`${btoa(GMAIL_APP_PASS!)}\r\n`));
    await new Promise(resolve => setTimeout(resolve, 500));

    // Send email
    await conn.write(encoder.encode(`MAIL FROM:<${GMAIL_USER}>\r\n`));
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await conn.write(encoder.encode(`RCPT TO:<${to}>\r\n`));
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await conn.write(encoder.encode(`DATA\r\n`));
    await new Promise(resolve => setTimeout(resolve, 500));

    const emailData = [
      `From: Reminder Bot <${GMAIL_USER}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      htmlContent,
      `\r\n.\r\n`
    ].join('\r\n');

    await conn.write(encoder.encode(emailData));
    await conn.write(encoder.encode(`QUIT\r\n`));
    
    conn.close();
    return { success: true };
  } catch (error) {
    console.error('SMTP send failed:', error);
    throw new Error(`Failed to send email via SMTP: ${error.message}`);
  }
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
          Reminder Bot</p>
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
    Reminder Bot
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

  try {
    console.log('Starting Gmail reminder email check...');
    
    // Get current date and time in ISO format
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
    
    console.log(`Checking for reminders due on ${currentDate} at ${currentTime}`);
    
    // Fetch due reminders that haven't been sent
    const { data: dueReminders, error: remindersError } = await supabase
      .from('reminders')
      .select(`
        *,
        statutory_parameters (
          name,
          category,
          expiry_date,
          description
        )
      `)
      .eq('reminder_date', currentDate)
      .lte('reminder_time', currentTime)
      .eq('is_sent', false);

    if (remindersError) {
      throw new Error(`Failed to fetch reminders: ${remindersError.message}`);
    }

    if (!dueReminders || dueReminders.length === 0) {
      console.log('No due reminders found');
      return new Response(JSON.stringify({ message: 'No due reminders found' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${dueReminders.length} due reminders`);
    
    let totalEmailsSent = 0;
    const emailResults = [];

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
            
            // Send email via Gmail SMTP
            await sendGmailEmail(
              user.email,
              emailTemplate.subject,
              emailTemplate.htmlContent,
              emailTemplate.textContent
            );

            console.log(`Email sent successfully to ${user.email}`);
            successfulSends++;

            // Add 1-second delay between sends to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
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

    console.log(`Email processing complete. Total emails sent: ${totalEmailsSent}`);

    return new Response(JSON.stringify({
      message: 'Gmail email processing completed',
      totalEmailsSent,
      processedReminders: emailResults.length,
      results: emailResults
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
