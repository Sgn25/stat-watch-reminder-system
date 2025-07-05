
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== SEND REMINDER EMAILS FUNCTION STARTED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('IST Time:', new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    console.log('UTC Time:', new Date().toUTCString());

    // Environment variables check
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const resendFrom = Deno.env.get('RESEND_FROM');

    console.log('Environment variables check:');
    console.log('- SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing');
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? 'Present (length: ' + serviceRoleKey.length + ')' : 'Missing');
    console.log('- RESEND_API_KEY:', resendApiKey ? 'Present' : 'Missing');
    console.log('- RESEND_FROM:', resendFrom ? 'Present' : 'Missing');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing required Supabase environment variables');
    }

    // Parse request body
    let requestData = {};
    try {
      requestData = await req.json();
      console.log('Request data:', requestData);
    } catch (e) {
      console.log('No JSON body provided, using empty object');
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('Supabase client initialized successfully');

    // Get current date in IST
    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const today = istNow.toISOString().split('T')[0];
    
    console.log('Current IST date for reminder check:', today);
    console.log('Current IST time:', istNow.toISOString());

    let emailsSent = 0;
    let errorsEncountered = 0;
    const results = {
      userReminders: { processed: 0, sent: 0, errors: 0 },
      expiryReminders: { processed: 0, sent: 0, errors: 0 },
      cleanupResults: { deletedReminders: 0, errors: 0 }
    };

    // 1. PROCESS USER-SET REMINDERS DUE TODAY
    console.log('\n=== PROCESSING USER-SET REMINDERS ===');
    
    const { data: userReminders, error: userRemindersError } = await supabase
      .from('reminders')
      .select(`
        *,
        statutory_parameters (
          id,
          name,
          category,
          expiry_date,
          dairy_unit_id
        )
      `)
      .eq('reminder_date', today)
      .eq('is_sent', false);

    if (userRemindersError) {
      console.error('Error fetching user reminders:', userRemindersError);
      results.userReminders.errors++;
    } else {
      console.log(`Found ${userReminders?.length || 0} user-set reminders for today`);
      results.userReminders.processed = userReminders?.length || 0;

      if (userReminders && userReminders.length > 0) {
        for (const reminder of userReminders) {
          try {
            console.log(`Processing user reminder: ${reminder.id} for parameter: ${reminder.statutory_parameters?.name}`);
            
            // Get user email from auth.users table
            const { data: userProfile, error: profileError } = await supabase
              .from('profiles')
              .select('id, full_name')
              .eq('id', reminder.user_id)
              .single();

            // Get user email from auth.users table
            const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(reminder.user_id);

            if (profileError || !userProfile || authError || !authUser) {
              console.error(`Error fetching user data for reminder ${reminder.id}:`, profileError || authError);
              results.userReminders.errors++;
              continue;
            }

            // Send email using Resend
            if (resendApiKey && resendFrom && authUser.user.email) {
              const emailSubject = `Reminder: ${reminder.statutory_parameters?.name} - ${reminder.reminder_date}`;
              const emailBody = `
                <h2>Reminder Notification</h2>
                <p>Hello ${userProfile.full_name || 'User'},</p>
                <p>This is a reminder for your statutory parameter:</p>
                <ul>
                  <li><strong>Parameter:</strong> ${reminder.statutory_parameters?.name}</li>
                  <li><strong>Category:</strong> ${reminder.statutory_parameters?.category}</li>
                  <li><strong>Expiry Date:</strong> ${reminder.statutory_parameters?.expiry_date}</li>
                  <li><strong>Reminder Date:</strong> ${reminder.reminder_date}</li>
                </ul>
                ${reminder.custom_message ? `<p><strong>Custom Message:</strong> ${reminder.custom_message}</p>` : ''}
                <p>Please take necessary action before the expiry date.</p>
                <p>Best regards,<br>Stat Watch Reminder System</p>
              `;

              const emailResponse = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${resendApiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  from: resendFrom,
                  to: authUser.user.email,
                  subject: emailSubject,
                  html: emailBody,
                }),
              });

              if (!emailResponse.ok) {
                const errorText = await emailResponse.text();
                console.error(`Failed to send email for reminder ${reminder.id}:`, errorText);
                results.userReminders.errors++;
                continue;
              }

              console.log(`Email sent successfully for reminder ${reminder.id} to ${authUser.user.email}`);
            } else {
              console.log(`Skipping email for reminder ${reminder.id} - missing email configuration or user email`);
            }
            
            // Mark reminder as sent
            const { error: updateError } = await supabase
              .from('reminders')
              .update({ is_sent: true, updated_at: new Date().toISOString() })
              .eq('id', reminder.id);

            if (updateError) {
              console.error(`Error updating reminder ${reminder.id}:`, updateError);
              results.userReminders.errors++;
            } else {
              console.log(`Successfully processed user reminder: ${reminder.id}`);
              results.userReminders.sent++;
              emailsSent++;
            }
          } catch (error) {
            console.error(`Error processing user reminder ${reminder.id}:`, error);
            results.userReminders.errors++;
            errorsEncountered++;
          }
        }
      }
    }

    // 2. PROCESS 5-DAY EXPIRY REMINDERS
    console.log('\n=== PROCESSING 5-DAY EXPIRY REMINDERS ===');
    
    // Calculate date 5 days from now in IST
    const fiveDaysFromNow = new Date(istNow);
    fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
    const expiryCheckDate = fiveDaysFromNow.toISOString().split('T')[0];
    
    console.log('Checking for parameters expiring on or before:', expiryCheckDate);

    const { data: expiringParameters, error: expiryError } = await supabase
      .from('statutory_parameters')
      .select(`
        *,
        dairy_units (
          id,
          name,
          code
        )
      `)
      .lte('expiry_date', expiryCheckDate)
      .gte('expiry_date', today); // Only parameters that haven't expired yet

    if (expiryError) {
      console.error('Error fetching expiring parameters:', expiryError);
      results.expiryReminders.errors++;
    } else {
      console.log(`Found ${expiringParameters?.length || 0} parameters expiring within 5 days`);
      results.expiryReminders.processed = expiringParameters?.length || 0;

      if (expiringParameters && expiringParameters.length > 0) {
        for (const param of expiringParameters) {
          try {
            console.log(`Processing expiry reminder for parameter: ${param.name} (expires: ${param.expiry_date})`);
            
            // Get users from the same dairy unit for this parameter
            const { data: dairyUnitUsers, error: usersError } = await supabase
              .from('profiles')
              .select('id, full_name')
              .eq('dairy_unit_id', param.dairy_unit_id);

            if (usersError) {
              console.error(`Error fetching users for dairy unit ${param.dairy_unit_id}:`, usersError);
              results.expiryReminders.errors++;
              continue;
            }

            // Send expiry reminder emails to all users in the dairy unit
            for (const user of dairyUnitUsers || []) {
              // Get user email from auth.users table
              const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user.id);
              
              if (resendApiKey && resendFrom && authUser?.user?.email) {
                // Format dates as DD/MM/YYYY
                function formatDateDMY(dateStr) {
                  const d = new Date(dateStr);
                  return d.toLocaleDateString('en-GB');
                }
                const expiryDateDMY = formatDateDMY(param.expiry_date);
                const todayDMY = formatDateDMY(today);
                const daysUntilExpiry = Math.ceil((new Date(param.expiry_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
                const emailSubject = `Urgent ! "${param.name}" expires on "${expiryDateDMY}"`;
                const emailBody = `
                  <div style="font-family: Arial, sans-serif; background: #f7f9fb; padding: 0; margin: 0;">
                    <div style="max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.07);">
                      <div style="background: #2563eb; color: #fff; padding: 24px 0; text-align: center;">
                        <div style="font-size: 28px; font-weight: bold;">License Renewal Required</div>
                        <div style="font-size: 15px; margin-top: 4px;">StatMonitor - Your Compliance Partner</div>
                      </div>
                      <div style="padding: 32px 32px 24px 32px;">
                        <div style="font-size: 17px; margin-bottom: 16px;">Hello, ${user.full_name || 'User'},</div>
                        <div style="background: #fee2e2; color: #b91c1c; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                          <div style="font-weight: bold; font-size: 16px; margin-bottom: 4px;">⚠️ Action Required</div>
                          <div>Your license <b>${param.name}</b> expires on <b>${expiryDateDMY}</b></div>
                        </div>
                        <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                          <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">📄 License Information</div>
                          <div><b>License Name:</b> ${param.name}</div>
                          <div><b>Category:</b> ${param.category}</div>
                          <div><b>Expiry Date:</b> ${expiryDateDMY}</div>
                        </div>
                        <div style="background: #e0edff; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                          <div style="font-weight: bold; font-size: 15px; margin-bottom: 4px;">ℹ️ Additional Note</div>
                          <div>This license expires in <b>${daysUntilExpiry} days</b>. Please renew it to maintain compliance.</div>
                        </div>
                        <div style="text-align: center; margin-bottom: 24px;">
                          <a href="#" style="background: #2563eb; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px;">Renew License Now</a>
                        </div>
                        <div style="font-size: 14px; color: #374151;">Don't let your license expire! Take action today to maintain compliance and avoid potential penalties.</div>
                      </div>
                      <div style="background: #f1f5f9; color: #64748b; font-size: 13px; text-align: center; padding: 18px 0;">
                        This is an automated reminder from <b>StatMonitor</b><br>
                        Need help? Contact your administrator or reply to this email.<br>
                        © 2024 StatMonitor. All rights reserved.<br>
                        <a href="#" style="color: #2563eb;">Unsubscribe from these emails</a>
                      </div>
                    </div>
                  </div>
                `;
                const emailResponse = await fetch('https://api.resend.com/emails', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${resendApiKey}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    from: resendFrom,
                    to: authUser.user.email,
                    subject: emailSubject,
                    html: emailBody,
                  }),
                });
                if (!emailResponse.ok) {
                  const errorText = await emailResponse.text();
                  console.error(`Failed to send expiry email for parameter ${param.id} to ${authUser.user.email}:`, errorText);
                  results.expiryReminders.errors++;
                } else {
                  console.log(`Expiry email sent successfully for parameter ${param.id} to ${authUser.user.email}`);
                  results.expiryReminders.sent++;
                  emailsSent++;
                }
              } else {
                console.log(`Skipping expiry email for parameter ${param.id} to ${authUser?.user?.email || user.id} - missing email configuration`);
              }
            }
            
            console.log(`Successfully processed expiry reminder for parameter: ${param.id}`);
          } catch (error) {
            console.error(`Error processing expiry reminder for parameter ${param.id}:`, error);
            results.expiryReminders.errors++;
            errorsEncountered++;
          }
        }
      }
    }

    // 3. CLEANUP EXPIRED REMINDERS
    console.log('\n=== CLEANING UP EXPIRED REMINDERS ===');
    
    // Get yesterday's date to delete old reminders
    const yesterday = new Date(istNow);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    console.log('Deleting reminders older than:', yesterdayStr);

    const { data: deletedReminders, error: deleteError } = await supabase
      .from('reminders')
      .delete()
      .lt('reminder_date', yesterdayStr)
      .select('id');

    if (deleteError) {
      console.error('Error deleting old reminders:', deleteError);
      results.cleanupResults.errors++;
    } else {
      const deletedCount = deletedReminders?.length || 0;
      console.log(`Successfully deleted ${deletedCount} old reminders`);
      results.cleanupResults.deletedReminders = deletedCount;
    }

    // Log email activity
    const { error: logError } = await supabase
      .from('email_logs')
      .insert({
        status: emailsSent > 0 ? 'sent' : 'failed',
        emails_sent: emailsSent,
        error_message: errorsEncountered > 0 ? `${errorsEncountered} errors encountered` : null,
        sent_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Error logging email activity:', logError);
    }

    const finalResult = {
      success: true,
      message: 'Daily reminder processing completed',
      timestamp: new Date().toISOString(),
      istTime: new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}),
      totalEmailsSent: emailsSent,
      totalErrors: errorsEncountered,
      details: results,
      processedAt: {
        utc: new Date().toISOString(),
        ist: istNow.toISOString(),
        date: today
      }
    };

    console.log('=== FINAL RESULTS ===');
    console.log(JSON.stringify(finalResult, null, 2));

    return new Response(JSON.stringify(finalResult), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== ERROR IN SEND REMINDER EMAILS ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Time of error:', new Date().toISOString());
    console.error('IST time of error:', new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));

    // Log the error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (supabaseUrl && serviceRoleKey) {
        const supabase = createClient(supabaseUrl, serviceRoleKey);
        await supabase
          .from('email_logs')
          .insert({
            status: 'failed',
            emails_sent: 0,
            error_message: error.message,
            sent_at: new Date().toISOString()
          });
      }
    } catch (logError) {
      console.error('Failed to log error to database:', logError);
    }

    const errorResult = {
      success: false,
      error: 'Send reminder emails failed',
      message: error.message,
      timestamp: new Date().toISOString(),
      istTime: new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}),
      errorType: error.constructor.name
    };

    return new Response(JSON.stringify(errorResult), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
