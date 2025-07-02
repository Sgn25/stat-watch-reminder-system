
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

// AWS SES configuration
const AWS_ACCESS_KEY_ID = Deno.env.get('AWS_ACCESS_KEY_ID');
const AWS_SECRET_ACCESS_KEY = Deno.env.get('AWS_SECRET_ACCESS_KEY');
const AWS_REGION = Deno.env.get('AWS_REGION') || 'us-east-1';

// AWS SES API endpoint
const SES_ENDPOINT = `https://email.${AWS_REGION}.amazonaws.com/`;

// Function to create AWS signature for SES API
async function createAwsSignature(stringToSign: string, secretKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(stringToSign));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sendSESEmail(to: string[], subject: string, htmlContent: string, textContent: string) {
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS credentials not configured');
  }

  const timestamp = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
  const date = timestamp.substr(0, 8);
  
  // Create the request body for SES SendEmail API
  const emailData = {
    Source: 'statmonitor.reminder@gmail.com',
    Destination: {
      ToAddresses: to
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: 'UTF-8'
      },
      Body: {
        Html: {
          Data: htmlContent,
          Charset: 'UTF-8'
        },
        Text: {
          Data: textContent,
          Charset: 'UTF-8'
        }
      }
    }
  };

  // Convert to AWS SES API format
  const params = new URLSearchParams();
  params.append('Action', 'SendEmail');
  params.append('Version', '2010-12-01');
  params.append('Source', emailData.Source);
  
  emailData.Destination.ToAddresses.forEach((email, index) => {
    params.append(`Destination.ToAddresses.member.${index + 1}`, email);
  });
  
  params.append('Message.Subject.Data', emailData.Message.Subject.Data);
  params.append('Message.Subject.Charset', emailData.Message.Subject.Charset);
  params.append('Message.Body.Html.Data', emailData.Message.Body.Html.Data);
  params.append('Message.Body.Html.Charset', emailData.Message.Body.Html.Charset);
  params.append('Message.Body.Text.Data', emailData.Message.Body.Text.Data);
  params.append('Message.Body.Text.Charset', emailData.Message.Body.Text.Charset);

  // Create AWS signature
  const algorithm = 'AWS4-HMAC-SHA256';
  const service = 'ses';
  const host = `email.${AWS_REGION}.amazonaws.com`;
  const canonicalUri = '/';
  const canonicalQueryString = '';
  const payloadHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(params.toString()));
  const payloadHashHex = Array.from(new Uint8Array(payloadHash)).map(b => b.toString(16).padStart(2, '0')).join('');
  
  const canonicalHeaders = `host:${host}\nx-amz-date:${timestamp}\n`;
  const signedHeaders = 'host;x-amz-date';
  const canonicalRequest = `POST\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHashHex}`;
  
  const credentialScope = `${date}/${AWS_REGION}/${service}/aws4_request`;
  const stringToSign = `${algorithm}\n${timestamp}\n${credentialScope}\n${await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalRequest)).then(hash => Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join(''))}`;
  
  // Create signing key
  const kDate = await createAwsSignature(date, `AWS4${AWS_SECRET_ACCESS_KEY}`);
  const kRegion = await createAwsSignature(AWS_REGION, kDate);
  const kService = await createAwsSignature(service, kRegion);
  const kSigning = await createAwsSignature('aws4_request', kService);
  const signature = await createAwsSignature(stringToSign, kSigning);
  
  const authorizationHeader = `${algorithm} Credential=${AWS_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(SES_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Amz-Date': timestamp,
      'Authorization': authorizationHeader,
      'Host': host,
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AWS SES API error: ${response.status} - ${errorText}`);
  }

  return await response.text();
}

function generateEmailTemplate(reminder: ReminderWithDetails, recipientName: string) {
  const expiryDate = new Date(reminder.statutory_parameters.expiry_date).toLocaleDateString();
  const reminderDate = new Date(reminder.reminder_date).toLocaleDateString();
  
  const subject = `Reminder: ${reminder.statutory_parameters.name} - Action Required`;
  
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
        .alert { background: #fee2e2; border: 1px solid #fca5a5; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; }
        .info { background: #dbeafe; border: 1px solid #60a5fa; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 Statutory Parameter Reminder</h1>
        </div>
        <div class="content">
          <p>Dear ${recipientName || 'Team Member'},</p>
          
          <div class="alert warning">
            <h3>⚠️ Action Required</h3>
            <p><strong>${reminder.statutory_parameters.name}</strong> requires your attention.</p>
          </div>
          
          <h3>📊 Parameter Details:</h3>
          <ul>
            <li><strong>Name:</strong> ${reminder.statutory_parameters.name}</li>
            <li><strong>Category:</strong> ${reminder.statutory_parameters.category}</li>
            <li><strong>Expiry Date:</strong> ${expiryDate}</li>
            <li><strong>Reminder Set For:</strong> ${reminderDate}</li>
            ${reminder.statutory_parameters.description ? `<li><strong>Description:</strong> ${reminder.statutory_parameters.description}</li>` : ''}
          </ul>
          
          ${reminder.custom_message ? `
          <div class="alert info">
            <h4>📝 Custom Message:</h4>
            <p>${reminder.custom_message}</p>
          </div>` : ''}
          
          <p>Please take the necessary action to ensure compliance with this statutory requirement.</p>
          
          <p>Best regards,<br>
          Statutory Parameters Monitoring System</p>
        </div>
        <div class="footer">
          <p>This is an automated reminder. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const textContent = `
    Statutory Parameter Reminder
    
    Dear ${recipientName || 'Team Member'},
    
    ${reminder.statutory_parameters.name} requires your attention.
    
    Parameter Details:
    - Name: ${reminder.statutory_parameters.name}
    - Category: ${reminder.statutory_parameters.category}
    - Expiry Date: ${expiryDate}
    - Reminder Set For: ${reminderDate}
    ${reminder.statutory_parameters.description ? `- Description: ${reminder.statutory_parameters.description}` : ''}
    
    ${reminder.custom_message ? `Custom Message: ${reminder.custom_message}` : ''}
    
    Please take the necessary action to ensure compliance with this statutory requirement.
    
    Best regards,
    Statutory Parameters Monitoring System
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
    console.log('Starting reminder email check...');
    
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
        const usersWithEmails: string[] = [];
        
        for (const profile of profiles) {
          const authUser = authUsers.users.find(u => u.id === profile.id);
          if (authUser?.email) {
            usersWithEmails.push(authUser.email);
          }
        }

        if (usersWithEmails.length === 0) {
          console.log(`No email addresses found for dairy unit ${reminder.dairy_unit_id}`);
          await logEmailActivity(reminder.id, 'failed', 'No email addresses found');
          continue;
        }

        console.log(`Sending email to ${usersWithEmails.length} users`);

        // Check AWS SES daily limit (200 emails per day for sandbox)
        if (totalEmailsSent + usersWithEmails.length > 180) {
          console.log('Approaching AWS SES daily limit, stopping email sending');
          await logEmailActivity(reminder.id, 'failed', 'Daily email limit reached');
          break;
        }

        // Generate email content
        const emailTemplate = generateEmailTemplate(reminder, 'Team Member');
        
        // Send email via AWS SES
        const emailResponse = await sendSESEmail(
          usersWithEmails,
          emailTemplate.subject,
          emailTemplate.htmlContent,
          emailTemplate.textContent
        );

        console.log(`Email sent successfully for reminder ${reminder.id}:`, emailResponse);

        // Mark reminder as sent
        await supabase
          .from('reminders')
          .update({ is_sent: true })
          .eq('id', reminder.id);

        totalEmailsSent += usersWithEmails.length;
        await logEmailActivity(reminder.id, 'sent', undefined, usersWithEmails.length);

        emailResults.push({
          reminderId: reminder.id,
          parameterName: reminder.statutory_parameters.name,
          emailsSent: usersWithEmails.length,
          status: 'success'
        });

        // Add a small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

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
      message: 'Email processing completed',
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
