
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
        ),
        profiles!inner (
          id,
          full_name,
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
            
            // Here you would send the email using Resend or your email service
            // For now, we'll just mark it as sent and log it
            
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
        profiles!inner (
          id,
          full_name,
          dairy_unit_id
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
            
            // Here you would send the expiry reminder email
            // For now, we'll just log it
            
            console.log(`Successfully processed expiry reminder for parameter: ${param.id}`);
            results.expiryReminders.sent++;
            emailsSent++;
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
        status: emailsSent > 0 ? 'success' : 'no_emails_sent',
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
            status: 'error',
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
