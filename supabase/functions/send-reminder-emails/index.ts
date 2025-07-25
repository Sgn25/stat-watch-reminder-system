
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

// Import category-specific terminology helper
const getCategoryTerminology = (category: string) => {
  switch (category) {
    case 'License':
      return {
        title: 'License Renewal Required',
        actionText: 'Renew License Now',
        description: 'Don\'t let your license expire! Take action today to maintain compliance and avoid potential penalties.'
      };
    case 'Certificate':
      return {
        title: 'Certificate Renewal Required',
        actionText: 'Renew Certificate Now',
        description: 'Don\'t let your certificate expire! Take action today to maintain compliance and avoid potential penalties.'
      };
    case 'Permit':
      return {
        title: 'Permit Renewal Required',
        actionText: 'Renew Permit Now',
        description: 'Don\'t let your permit expire! Take action today to maintain compliance and avoid potential penalties.'
      };
    case 'Insurance':
      return {
        title: 'Insurance Renewal Required',
        actionText: 'Renew Insurance Now',
        description: 'Don\'t let your insurance expire! Take action today to maintain compliance and avoid potential penalties.'
      };
    case 'Contracts':
      return {
        title: 'Contract Renewal Required',
        actionText: 'Renew Contract Now',
        description: 'Don\'t let your contract expire! Take action today to maintain compliance and avoid potential penalties.'
      };
    case 'Approval':
      return {
        title: 'Approval Renewal Required',
        actionText: 'Renew Approval Now',
        description: 'Don\'t let your approval expire! Take action today to maintain compliance and avoid potential penalties.'
      };
    default:
      return {
        title: 'Parameter Renewal Required',
        actionText: 'Renew Parameter Now',
        description: 'Don\'t let your parameter expire! Take action today to maintain compliance and avoid potential penalties.'
      };
  }
};

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
    const filterUserId = requestData.user_id;
    const filterDairyUnitId = requestData.dairy_unit_id;

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
    
    let userRemindersQuery = supabase
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
      .eq('reminder_date', today);
    if (filterUserId && filterDairyUnitId) {
      userRemindersQuery = userRemindersQuery.eq('user_id', filterUserId).eq('dairy_unit_id', filterDairyUnitId);
    }
    const { data: userReminders, error: userRemindersError } = await userRemindersQuery;

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
            
            let dairyUnitUsersQuery = supabase
              .from('profiles')
              .select('id, full_name')
              .eq('dairy_unit_id', reminder.dairy_unit_id);
            if (filterUserId && filterDairyUnitId) {
              dairyUnitUsersQuery = dairyUnitUsersQuery.eq('id', filterUserId);
            }
            const { data: dairyUnitUsers, error: usersError } = await dairyUnitUsersQuery;

            if (usersError) {
              console.error(`Error fetching users for dairy unit ${reminder.dairy_unit_id}:`, usersError);
              results.userReminders.errors++;
              continue;
            }

            for (const user of dairyUnitUsers || []) {
              // Get user email from auth.users table
              const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user.id);

              if (authError || !authUser?.user?.email) {
                console.log(`Skipping user reminder email for reminder ${reminder.id} to ${user.id} - missing user email`);
                continue;
              }

              // Check if user is subscribed to email notifications
              const { data: emailSubscription, error: subscriptionError } = await supabase
                .from('email_subscriptions')
                .select('is_subscribed')
                .eq('user_id', user.id)
                .eq('dairy_unit_id', reminder.dairy_unit_id)
                .single();

              if (subscriptionError && subscriptionError.code !== 'PGRST116') {
                console.error(`Error checking email subscription for user ${user.id}:`, subscriptionError);
              }

              // Only send email if user is subscribed (only if a row exists and is_subscribed is true)
              const isSubscribed = emailSubscription?.is_subscribed === true;
              if (!isSubscribed) {
                console.log(`Skipping user reminder email for reminder ${reminder.id} to ${user.id} - user is unsubscribed or no subscription row found`);
                continue;
              }

              // Send email using Resend
              if (resendApiKey && resendFrom && authUser.user.email) {
                const terminology = getCategoryTerminology(reminder.statutory_parameters?.category || '');
                const emailSubject = `Reminder: ${reminder.statutory_parameters?.name} (${reminder.statutory_parameters?.category}) - ${reminder.reminder_date}`;
                
                // Format dates as DD/MM/YYYY
                function formatDateDMY(dateStr) {
                  const d = new Date(dateStr);
                  return d.toLocaleDateString('en-GB');
                }
                const expiryDateDMY = formatDateDMY(reminder.statutory_parameters?.expiry_date);
                const reminderDateDMY = formatDateDMY(reminder.reminder_date);
                const daysUntilExpiry = Math.ceil((new Date(reminder.statutory_parameters?.expiry_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
                
                const emailBody = `
                  <div style="font-family: Arial, sans-serif; background: #f7f9fb; padding: 0; margin: 0;">
                    <div style="max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.07);">
                      <div style="background: #059669; color: #fff; padding: 24px 0; text-align: center;">
                        <div style="font-size: 28px; font-weight: bold;">${terminology.title}</div>
                        <div style="font-size: 15px; margin-top: 4px;">StatMonitor - Your Compliance Partner</div>
                      </div>
                      <div style="padding: 32px 32px 24px 32px;">
                        <div style="font-size: 17px; margin-bottom: 16px;">Hello, ${user.full_name || 'User'},</div>
                        <div style="background: #ecfdf5; color: #065f46; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                          <div style="font-weight: bold; font-size: 16px; margin-bottom: 4px;">📅 Scheduled Reminder</div>
                          <div>Your ${reminder.statutory_parameters?.category?.toLowerCase() || 'parameter'} <b>${reminder.statutory_parameters?.name}</b> reminder is due today</div>
                        </div>
                        <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                          <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">📄 ${reminder.statutory_parameters?.category || 'Parameter'} Information</div>
                          <div><b>${reminder.statutory_parameters?.category || 'Parameter'} Name:</b> ${reminder.statutory_parameters?.name}</div>
                          <div><b>Category:</b> ${reminder.statutory_parameters?.category}</div>
                          <div><b>Expiry Date:</b> ${expiryDateDMY}</div>
                          <div><b>Reminder Date:</b> ${reminderDateDMY}</div>
                          <div><b>Days Until Expiry:</b> ${daysUntilExpiry} days</div>
                        </div>
                        ${reminder.custom_message ? `
                        <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                          <div style="font-weight: bold; font-size: 15px; margin-bottom: 4px;">💬 Custom Message</div>
                          <div>${reminder.custom_message}</div>
                        </div>
                        ` : ''}
                        <div style="background: #e0edff; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                          <div style="font-weight: bold; font-size: 15px; margin-bottom: 4px;">ℹ️ Action Required</div>
                          <div>This ${reminder.statutory_parameters?.category?.toLowerCase() || 'parameter'} expires in <b>${daysUntilExpiry} days</b>. Please take necessary action before the expiry date to maintain compliance.</div>
                        </div>
                        <div style="text-align: center; margin-bottom: 24px;">
                          <a href="#" style="background: #059669; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px;">${terminology.actionText}</a>
                        </div>
                        <div style="font-size: 14px; color: #374151;">${terminology.description}</div>
                      </div>
                      <div style="background: #f1f5f9; color: #64748b; font-size: 13px; text-align: center; padding: 18px 0;">
                        This is an automated reminder from <b>StatMonitor</b><br>
                        Need help? Contact your administrator or reply to this email.<br>
                        © 2024 StatMonitor. All rights reserved.<br>
                        <a href="#" style="color: #059669;">Unsubscribe from these emails</a>
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
                  console.error(`Failed to send user reminder email for reminder ${reminder.id} to ${authUser.user.email}:`, errorText);
                  results.userReminders.errors++;
                  continue;
                }

                console.log(`User reminder email sent successfully for reminder ${reminder.id} to ${authUser.user.email}`);
              } else {
                console.log(`Skipping user reminder email for reminder ${reminder.id} to ${authUser?.user?.email || user.id} - missing email configuration`);
              }
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

    let expiringParametersQuery = supabase
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
      .gte('expiry_date', today);
    if (filterDairyUnitId) {
      expiringParametersQuery = expiringParametersQuery.eq('dairy_unit_id', filterDairyUnitId);
    }
    const { data: expiringParameters, error: expiryError } = await expiringParametersQuery;

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
            
            let dairyUnitUsersQuery2 = supabase
              .from('profiles')
              .select('id, full_name')
              .eq('dairy_unit_id', param.dairy_unit_id);
            if (filterUserId && filterDairyUnitId) {
              dairyUnitUsersQuery2 = dairyUnitUsersQuery2.eq('id', filterUserId);
            }
            const { data: dairyUnitUsers, error: usersError } = await dairyUnitUsersQuery2;

            if (usersError) {
              console.error(`Error fetching users for dairy unit ${param.dairy_unit_id}:`, usersError);
              results.expiryReminders.errors++;
              continue;
            }

            // Send expiry reminder emails to all users in the dairy unit
            for (const user of dairyUnitUsers || []) {
              // Get user email from auth.users table
              const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user.id);
              
              if (authError || !authUser?.user?.email) {
                console.log(`Skipping expiry email for parameter ${param.id} to ${user.id} - missing user email`);
                continue;
              }

              // Check if user is subscribed to email notifications
              const { data: emailSubscription, error: subscriptionError } = await supabase
                .from('email_subscriptions')
                .select('is_subscribed')
                .eq('user_id', user.id)
                .eq('dairy_unit_id', param.dairy_unit_id)
                .single();

              if (subscriptionError && subscriptionError.code !== 'PGRST116') {
                console.error(`Error checking email subscription for user ${user.id}:`, subscriptionError);
              }

              // Only send email if user is subscribed (only if a row exists and is_subscribed is true)
              const isSubscribed = emailSubscription?.is_subscribed === true;
              
              if (!isSubscribed) {
                console.log(`Skipping expiry email for parameter ${param.id} to ${user.id} - user is unsubscribed or no subscription row found`);
                continue;
              }
              
              if (resendApiKey && resendFrom) {
                // Format dates as DD/MM/YYYY
                function formatDateDMY(dateStr) {
                  const d = new Date(dateStr);
                  return d.toLocaleDateString('en-GB');
                }
                const expiryDateDMY = formatDateDMY(param.expiry_date);
                const todayDMY = formatDateDMY(today);
                const daysUntilExpiry = Math.ceil((new Date(param.expiry_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
                const terminology = getCategoryTerminology(param.category);
                const emailSubject = `Urgent ! "${param.name}" expires on "${expiryDateDMY}"`;
                const emailBody = `
                  <div style="font-family: Arial, sans-serif; background: #f7f9fb; padding: 0; margin: 0;">
                    <div style="max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.07);">
                      <div style="background: #2563eb; color: #fff; padding: 24px 0; text-align: center;">
                        <div style="font-size: 28px; font-weight: bold;">${terminology.title}</div>
                        <div style="font-size: 15px; margin-top: 4px;">StatMonitor - Your Compliance Partner</div>
                      </div>
                      <div style="padding: 32px 32px 24px 32px;">
                        <div style="font-size: 17px; margin-bottom: 16px;">Hello, ${user.full_name || 'User'},</div>
                        <div style="background: #fee2e2; color: #b91c1c; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                          <div style="font-weight: bold; font-size: 16px; margin-bottom: 4px;">⚠️ Action Required</div>
                          <div>Your ${param.category.toLowerCase()} <b>${param.name}</b> expires on <b>${expiryDateDMY}</b></div>
                        </div>
                        <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                          <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">📄 ${param.category} Information</div>
                          <div><b>${param.category} Name:</b> ${param.name}</div>
                          <div><b>Category:</b> ${param.category}</div>
                          <div><b>Expiry Date:</b> ${expiryDateDMY}</div>
                        </div>
                        <div style="background: #e0edff; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                          <div style="font-weight: bold; font-size: 15px; margin-bottom: 4px;">ℹ️ Additional Note</div>
                          <div>This ${param.category.toLowerCase()} expires in <b>${daysUntilExpiry} days</b>. Please renew it to maintain compliance.</div>
                        </div>
                        <div style="text-align: center; margin-bottom: 24px;">
                          <a href="#" style="background: #2563eb; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px;">${terminology.actionText}</a>
                        </div>
                        <div style="font-size: 14px; color: #374151;">${terminology.description}</div>
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

    // 2b. PROCESS EXPIRED PARAMETERS (send daily reminders until renewed)
    console.log('\n=== PROCESSING EXPIRED PARAMETERS FOR DAILY REMINDERS ===');
    let expiredParametersQuery = supabase
      .from('statutory_parameters')
      .select(`
        *,
        dairy_units (
          id,
          name,
          code
        )
      `)
      .lt('expiry_date', today);
    if (filterDairyUnitId) {
      expiredParametersQuery = expiredParametersQuery.eq('dairy_unit_id', filterDairyUnitId);
    }
    const { data: expiredParameters, error: expiredError } = await expiredParametersQuery;

    if (expiredError) {
      console.error('Error fetching expired parameters:', expiredError);
      results.expiryReminders.errors++;
    } else {
      console.log(`Found ${expiredParameters?.length || 0} parameters expired and not renewed`);
      // We'll count these as processed for reporting
      results.expiryReminders.processed += expiredParameters?.length || 0;

      if (expiredParameters && expiredParameters.length > 0) {
        for (const param of expiredParameters) {
          try {
            console.log(`Processing daily expired reminder for parameter: ${param.name} (expired: ${param.expiry_date})`);

            let dairyUnitUsersQuery3 = supabase
              .from('profiles')
              .select('id, full_name')
              .eq('dairy_unit_id', param.dairy_unit_id);
            if (filterUserId && filterDairyUnitId) {
              dairyUnitUsersQuery3 = dairyUnitUsersQuery3.eq('id', filterUserId);
            }
            const { data: dairyUnitUsers, error: usersError } = await dairyUnitUsersQuery3;

            if (usersError) {
              console.error(`Error fetching users for dairy unit ${param.dairy_unit_id}:`, usersError);
              results.expiryReminders.errors++;
              continue;
            }

            // Send daily expired reminder emails to all users in the dairy unit
            for (const user of dairyUnitUsers || []) {
              // Get user email from auth.users table
              const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user.id);
              
              if (authError || !authUser?.user?.email) {
                console.log(`Skipping expired email for parameter ${param.id} to ${user.id} - missing user email`);
                continue;
              }

              // Check if user is subscribed to email notifications
              const { data: emailSubscription, error: subscriptionError } = await supabase
                .from('email_subscriptions')
                .select('is_subscribed')
                .eq('user_id', user.id)
                .eq('dairy_unit_id', param.dairy_unit_id)
                .single();

              if (subscriptionError && subscriptionError.code !== 'PGRST116') {
                console.error(`Error checking email subscription for user ${user.id}:`, subscriptionError);
              }

              // Only send email if user is subscribed (only if a row exists and is_subscribed is true)
              const isSubscribed = emailSubscription?.is_subscribed === true;
              
              if (!isSubscribed) {
                console.log(`Skipping expired email for parameter ${param.id} to ${user.id} - user is unsubscribed or no subscription row found`);
                continue;
              }
              
              if (resendApiKey && resendFrom) {
                // Format dates as DD/MM/YYYY
                function formatDateDMY(dateStr) {
                  const d = new Date(dateStr);
                  return d.toLocaleDateString('en-GB');
                }
                const expiryDateDMY = formatDateDMY(param.expiry_date);
                const todayDMY = formatDateDMY(today);
                const daysSinceExpiry = Math.abs(Math.ceil((new Date(param.expiry_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)));
                const terminology = getCategoryTerminology(param.category);
                const emailSubject = `Overdue! "${param.name}" expired on "${expiryDateDMY}"`;
                const emailBody = `
                  <div style="font-family: Arial, sans-serif; background: #f7f9fb; padding: 0; margin: 0;">
                    <div style="max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.07);">
                      <div style="background: #b91c1c; color: #fff; padding: 24px 0; text-align: center;">
                        <div style="font-size: 28px; font-weight: bold;">${terminology.title} (Overdue)</div>
                        <div style="font-size: 15px; margin-top: 4px;">StatMonitor - Your Compliance Partner</div>
                      </div>
                      <div style="padding: 32px 32px 24px 32px;">
                        <div style="font-size: 17px; margin-bottom: 16px;">Hello, ${user.full_name || 'User'},</div>
                        <div style="background: #fee2e2; color: #b91c1c; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                          <div style="font-weight: bold; font-size: 16px; margin-bottom: 4px;">⚠️ Overdue Action Required</div>
                          <div>Your ${param.category.toLowerCase()} <b>${param.name}</b> expired on <b>${expiryDateDMY}</b></div>
                        </div>
                        <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                          <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">📄 ${param.category} Information</div>
                          <div><b>${param.category} Name:</b> ${param.name}</div>
                          <div><b>Category:</b> ${param.category}</div>
                          <div><b>Expiry Date:</b> ${expiryDateDMY}</div>
                        </div>
                        <div style="background: #fee2e2; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                          <div style="font-weight: bold; font-size: 15px; margin-bottom: 4px;">⏰ Overdue by</div>
                          <div>This ${param.category.toLowerCase()} is <b>${daysSinceExpiry} days overdue</b>. Please renew it immediately to restore compliance.</div>
                        </div>
                        <div style="text-align: center; margin-bottom: 24px;">
                          <a href="#" style="background: #b91c1c; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px;">${terminology.actionText}</a>
                        </div>
                        <div style="font-size: 14px; color: #374151;">${terminology.description}</div>
                      </div>
                      <div style="background: #f1f5f9; color: #64748b; font-size: 13px; text-align: center; padding: 18px 0;">
                        This is an automated reminder from <b>StatMonitor</b><br>
                        Need help? Contact your administrator or reply to this email.<br>
                        © 2024 StatMonitor. All rights reserved.<br>
                        <a href="#" style="color: #b91c1c;">Unsubscribe from these emails</a>
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
                  console.error(`Failed to send expired email for parameter ${param.id} to ${authUser.user.email}:`, errorText);
                  results.expiryReminders.errors++;
                } else {
                  console.log(`Expired email sent successfully for parameter ${param.id} to ${authUser.user.email}`);
                  results.expiryReminders.sent++;
                  emailsSent++;
                }
              } else {
                console.log(`Skipping expired email for parameter ${param.id} to ${authUser?.user?.email || user.id} - missing email configuration`);
              }
            }
            console.log(`Successfully processed daily expired reminder for parameter: ${param.id}`);
          } catch (error) {
            console.error(`Error processing daily expired reminder for parameter ${param.id}:`, error);
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
