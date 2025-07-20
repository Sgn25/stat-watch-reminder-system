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

// Function to send WhatsApp message using WhatsApp Business API
const sendWhatsAppMessage = async (phoneNumber: string, message: string) => {
  // Environment variables for WhatsApp API
  const whatsappApiUrl = Deno.env.get('WHATSAPP_API_URL');
  const whatsappApiKey = Deno.env.get('WHATSAPP_API_KEY');
  const whatsappPhoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
  const whatsappAccessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');

  if (!whatsappApiUrl || !whatsappApiKey || !whatsappPhoneNumberId || !whatsappAccessToken) {
    throw new Error('Missing WhatsApp API configuration');
  }

  // Format phone number (remove + if present and ensure proper format)
  const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;

  const response = await fetch(`${whatsappApiUrl}/${whatsappPhoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${whatsappAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'text',
      text: {
        body: message
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WhatsApp API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== SEND WHATSAPP MESSAGES FUNCTION STARTED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('IST Time:', new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    console.log('UTC Time:', new Date().toUTCString());

    // Environment variables check
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('Environment variables check:');
    console.log('- SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing');
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? 'Present (length: ' + serviceRoleKey.length + ')' : 'Missing');

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

    let messagesSent = 0;
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
      .eq('reminder_date', today);

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
            
            // Get all users in the same dairy unit
            const { data: dairyUnitUsers, error: usersError } = await supabase
              .from('profiles')
              .select('id, full_name')
              .eq('dairy_unit_id', reminder.dairy_unit_id);

            if (usersError) {
              console.error(`Error fetching users for dairy unit ${reminder.dairy_unit_id}:`, usersError);
              results.userReminders.errors++;
              continue;
            }

            for (const user of dairyUnitUsers || []) {
              // Check if user is subscribed to WhatsApp notifications
              const { data: whatsappSubscription, error: subscriptionError } = await supabase
                .from('whatsapp_subscriptions')
                .select('is_subscribed, whatsapp_number')
                .eq('user_id', user.id)
                .eq('dairy_unit_id', reminder.dairy_unit_id)
                .single();

              if (subscriptionError && subscriptionError.code !== 'PGRST116') {
                console.error(`Error checking WhatsApp subscription for user ${user.id}:`, subscriptionError);
              }

              // Only send WhatsApp if user is subscribed and has a number
              const isSubscribed = whatsappSubscription?.is_subscribed === true;
              const whatsappNumber = whatsappSubscription?.whatsapp_number;
              
              if (!isSubscribed || !whatsappNumber) {
                console.log(`Skipping user reminder WhatsApp for reminder ${reminder.id} to ${user.id} - user is unsubscribed or no WhatsApp number`);
                continue;
              }

              try {
                const terminology = getCategoryTerminology(reminder.statutory_parameters?.category || '');
                
                // Format dates as DD/MM/YYYY
                function formatDateDMY(dateStr) {
                  const d = new Date(dateStr);
                  return d.toLocaleDateString('en-GB');
                }
                const expiryDateDMY = formatDateDMY(reminder.statutory_parameters?.expiry_date);
                const reminderDateDMY = formatDateDMY(reminder.reminder_date);
                const daysUntilExpiry = Math.ceil((new Date(reminder.statutory_parameters?.expiry_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
                
                const messageContent = `🔔 *${terminology.title}*

Hello ${user.full_name || 'User'},

Your ${reminder.statutory_parameters?.category?.toLowerCase() || 'parameter'} *${reminder.statutory_parameters?.name}* reminder is due today.

📄 *${reminder.statutory_parameters?.category || 'Parameter'} Information:*
• Name: ${reminder.statutory_parameters?.name}
• Category: ${reminder.statutory_parameters?.category}
• Expiry Date: ${expiryDateDMY}
• Reminder Date: ${reminderDateDMY}
• Days Until Expiry: ${daysUntilExpiry} days

${reminder.custom_message ? `💬 *Custom Message:*\n${reminder.custom_message}\n\n` : ''}⚠️ *Action Required:*
This ${reminder.statutory_parameters?.category?.toLowerCase() || 'parameter'} expires in *${daysUntilExpiry} days*. Please take necessary action before the expiry date to maintain compliance.

${terminology.description}

---
*StatMonitor - Your Compliance Partner*
Reply STOP to unsubscribe from WhatsApp reminders.`;

                // Send WhatsApp message
                await sendWhatsAppMessage(whatsappNumber, messageContent);

                // Log the WhatsApp message
                await supabase
                  .from('whatsapp_logs')
                  .insert({
                    user_id: user.id,
                    dairy_unit_id: reminder.dairy_unit_id,
                    whatsapp_number: whatsappNumber,
                    message_type: 'reminder',
                    parameter_id: reminder.statutory_parameters?.id,
                    message_content: messageContent,
                    status: 'sent',
                    sent_at: new Date().toISOString()
                  });

                console.log(`User reminder WhatsApp sent successfully for reminder ${reminder.id} to ${whatsappNumber}`);
                results.userReminders.sent++;
                messagesSent++;
              } catch (whatsappError) {
                console.error(`Failed to send user reminder WhatsApp for reminder ${reminder.id} to ${whatsappNumber}:`, whatsappError);
                
                // Log the failed attempt
                await supabase
                  .from('whatsapp_logs')
                  .insert({
                    user_id: user.id,
                    dairy_unit_id: reminder.dairy_unit_id,
                    whatsapp_number: whatsappNumber,
                    message_type: 'reminder',
                    parameter_id: reminder.statutory_parameters?.id,
                    message_content: 'Failed to send message',
                    status: 'failed',
                    error_message: whatsappError.message,
                    sent_at: new Date().toISOString()
                  });
                
                results.userReminders.errors++;
                errorsEncountered++;
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
      .gte('expiry_date', today);

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

            // Send expiry reminder WhatsApp messages to all users in the dairy unit
            for (const user of dairyUnitUsers || []) {
              // Check if user is subscribed to WhatsApp notifications
              const { data: whatsappSubscription, error: subscriptionError } = await supabase
                .from('whatsapp_subscriptions')
                .select('is_subscribed, whatsapp_number')
                .eq('user_id', user.id)
                .eq('dairy_unit_id', param.dairy_unit_id)
                .single();

              if (subscriptionError && subscriptionError.code !== 'PGRST116') {
                console.error(`Error checking WhatsApp subscription for user ${user.id}:`, subscriptionError);
              }

              // Only send WhatsApp if user is subscribed and has a number
              const isSubscribed = whatsappSubscription?.is_subscribed === true;
              const whatsappNumber = whatsappSubscription?.whatsapp_number;
              
              if (!isSubscribed || !whatsappNumber) {
                console.log(`Skipping expiry WhatsApp for parameter ${param.id} to ${user.id} - user is unsubscribed or no WhatsApp number`);
                continue;
              }
              
              try {
                // Format dates as DD/MM/YYYY
                function formatDateDMY(dateStr) {
                  const d = new Date(dateStr);
                  return d.toLocaleDateString('en-GB');
                }
                const expiryDateDMY = formatDateDMY(param.expiry_date);
                const todayDMY = formatDateDMY(today);
                const daysUntilExpiry = Math.ceil((new Date(param.expiry_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
                const terminology = getCategoryTerminology(param.category);
                
                const messageContent = `🚨 *${terminology.title}*

Hello ${user.full_name || 'User'},

Your ${param.category.toLowerCase()} *${param.name}* expires on *${expiryDateDMY}*.

📄 *${param.category} Information:*
• Name: ${param.name}
• Category: ${param.category}
• Expiry Date: ${expiryDateDMY}

⚠️ *Action Required:*
This ${param.category.toLowerCase()} expires in *${daysUntilExpiry} days*. Please renew it to maintain compliance.

${terminology.description}

---
*StatMonitor - Your Compliance Partner*
Reply STOP to unsubscribe from WhatsApp reminders.`;

                // Send WhatsApp message
                await sendWhatsAppMessage(whatsappNumber, messageContent);

                // Log the WhatsApp message
                await supabase
                  .from('whatsapp_logs')
                  .insert({
                    user_id: user.id,
                    dairy_unit_id: param.dairy_unit_id,
                    whatsapp_number: whatsappNumber,
                    message_type: 'expiry',
                    parameter_id: param.id,
                    message_content: messageContent,
                    status: 'sent',
                    sent_at: new Date().toISOString()
                  });

                console.log(`Expiry WhatsApp sent successfully for parameter ${param.id} to ${whatsappNumber}`);
                results.expiryReminders.sent++;
                messagesSent++;
              } catch (whatsappError) {
                console.error(`Failed to send expiry WhatsApp for parameter ${param.id} to ${whatsappNumber}:`, whatsappError);
                
                // Log the failed attempt
                await supabase
                  .from('whatsapp_logs')
                  .insert({
                    user_id: user.id,
                    dairy_unit_id: param.dairy_unit_id,
                    whatsapp_number: whatsappNumber,
                    message_type: 'expiry',
                    parameter_id: param.id,
                    message_content: 'Failed to send message',
                    status: 'failed',
                    error_message: whatsappError.message,
                    sent_at: new Date().toISOString()
                  });
                
                results.expiryReminders.errors++;
                errorsEncountered++;
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
    const { data: expiredParameters, error: expiredError } = await supabase
      .from('statutory_parameters')
      .select(`
        *,
        dairy_units (
          id,
          name,
          code
        )
      `)
      .lt('expiry_date', today); // Only parameters that are expired

    if (expiredError) {
      console.error('Error fetching expired parameters:', expiredError);
      results.expiryReminders.errors++;
    } else {
      console.log(`Found ${expiredParameters?.length || 0} expired parameters for daily reminders`);

      if (expiredParameters && expiredParameters.length > 0) {
        for (const param of expiredParameters) {
          try {
            console.log(`Processing daily expired reminder for parameter: ${param.name} (expired: ${param.expiry_date})`);
            
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

            // Send daily expired reminder WhatsApp messages to all users in the dairy unit
            for (const user of dairyUnitUsers || []) {
              // Check if user is subscribed to WhatsApp notifications
              const { data: whatsappSubscription, error: subscriptionError } = await supabase
                .from('whatsapp_subscriptions')
                .select('is_subscribed, whatsapp_number')
                .eq('user_id', user.id)
                .eq('dairy_unit_id', param.dairy_unit_id)
                .single();

              if (subscriptionError && subscriptionError.code !== 'PGRST116') {
                console.error(`Error checking WhatsApp subscription for user ${user.id}:`, subscriptionError);
              }

              // Only send WhatsApp if user is subscribed and has a number
              const isSubscribed = whatsappSubscription?.is_subscribed === true;
              const whatsappNumber = whatsappSubscription?.whatsapp_number;
              
              if (!isSubscribed || !whatsappNumber) {
                console.log(`Skipping expired WhatsApp for parameter ${param.id} to ${user.id} - user is unsubscribed or no WhatsApp number`);
                continue;
              }
              
              try {
                // Format dates as DD/MM/YYYY
                function formatDateDMY(dateStr) {
                  const d = new Date(dateStr);
                  return d.toLocaleDateString('en-GB');
                }
                const expiryDateDMY = formatDateDMY(param.expiry_date);
                const todayDMY = formatDateDMY(today);
                const daysSinceExpiry = Math.abs(Math.ceil((new Date(param.expiry_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)));
                const terminology = getCategoryTerminology(param.category);
                
                const messageContent = `⏰ *${terminology.title} (Overdue)*

Hello ${user.full_name || 'User'},

Your ${param.category.toLowerCase()} *${param.name}* expired on *${expiryDateDMY}*.

📄 *${param.category} Information:*
• Name: ${param.name}
• Category: ${param.category}
• Expiry Date: ${expiryDateDMY}

⏰ *Overdue by:*
This ${param.category.toLowerCase()} is *${daysSinceExpiry} days overdue*. Please renew it immediately to restore compliance.

${terminology.description}

---
*StatMonitor - Your Compliance Partner*
Reply STOP to unsubscribe from WhatsApp reminders.`;

                // Send WhatsApp message
                await sendWhatsAppMessage(whatsappNumber, messageContent);

                // Log the WhatsApp message
                await supabase
                  .from('whatsapp_logs')
                  .insert({
                    user_id: user.id,
                    dairy_unit_id: param.dairy_unit_id,
                    whatsapp_number: whatsappNumber,
                    message_type: 'expiry',
                    parameter_id: param.id,
                    message_content: messageContent,
                    status: 'sent',
                    sent_at: new Date().toISOString()
                  });

                console.log(`Expired WhatsApp sent successfully for parameter ${param.id} to ${whatsappNumber}`);
                results.expiryReminders.sent++;
                messagesSent++;
              } catch (whatsappError) {
                console.error(`Failed to send expired WhatsApp for parameter ${param.id} to ${whatsappNumber}:`, whatsappError);
                
                // Log the failed attempt
                await supabase
                  .from('whatsapp_logs')
                  .insert({
                    user_id: user.id,
                    dairy_unit_id: param.dairy_unit_id,
                    whatsapp_number: whatsappNumber,
                    message_type: 'expiry',
                    parameter_id: param.id,
                    message_content: 'Failed to send message',
                    status: 'failed',
                    error_message: whatsappError.message,
                    sent_at: new Date().toISOString()
                  });
                
                results.expiryReminders.errors++;
                errorsEncountered++;
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

    const finalResult = {
      success: true,
      message: 'Daily WhatsApp reminder processing completed',
      timestamp: new Date().toISOString(),
      istTime: new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}),
      totalMessagesSent: messagesSent,
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
    console.error('=== ERROR IN SEND WHATSAPP MESSAGES ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Time of error:', new Date().toISOString());
    console.error('IST time of error:', new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      istTime: new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"})
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler); 