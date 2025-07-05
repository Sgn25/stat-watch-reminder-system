
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== SCHEDULE REMINDER CHECK FUNCTION TRIGGERED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('IST Time:', new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    console.log('UTC Time:', new Date().toUTCString());
    
    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Environment check:');
    console.log('- SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing');
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? 'Present (length: ' + serviceRoleKey.length + ')' : 'Missing');
    
    if (!supabaseUrl || !serviceRoleKey) {
      const missingVars = [];
      if (!supabaseUrl) missingVars.push('SUPABASE_URL');
      if (!serviceRoleKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    
    // Parse request body to check source
    let requestData = {};
    try {
      requestData = await req.json();
      console.log('Request data:', requestData);
    } catch (e) {
      console.log('No JSON body provided or invalid JSON, using empty object');
    }
    
    console.log('Calling send-reminder-emails function...');
    console.log('Target URL:', `${supabaseUrl}/functions/v1/send-reminder-emails`);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/send-reminder-emails`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
      },
      body: JSON.stringify({ 
        source: 'scheduled-cron',
        triggeredBy: 'schedule-reminder-check',
        originalSource: requestData,
        timestamp: new Date().toISOString(),
        istTime: new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}),
        utcTime: new Date().toUTCString()
      }),
    });

    console.log('Response status from send-reminder-emails:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from send-reminder-emails:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Send-reminder-emails result:', result);
    
    const finalResult = {
      success: true,
      message: 'Scheduled reminder check completed successfully',
      timestamp: new Date().toISOString(),
      istTime: new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}),
      functionCalled: 'send-reminder-emails',
      result: result
    };
    
    console.log('Final result:', finalResult);

    return new Response(JSON.stringify(finalResult), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== ERROR IN SCHEDULE REMINDER CHECK ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Time of error:', new Date().toISOString());
    console.error('IST time of error:', new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    
    const errorResult = {
      success: false,
      error: 'Schedule reminder check failed',
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
