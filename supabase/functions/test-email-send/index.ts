
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
    console.log('=== MANUAL TEST EMAIL FUNCTION STARTED ===');
    console.log('Manual test: Calling send-reminder-emails function...');
    console.log('Timestamp:', new Date().toISOString());
    
    // Call the send-reminder-emails function
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }
    
    console.log('Calling send-reminder-emails with test parameters...');
    console.log('Target URL:', `${supabaseUrl}/functions/v1/send-reminder-emails`);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/send-reminder-emails`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        source: 'manual-test',
        triggeredBy: 'test-email-send',
        timestamp: new Date().toISOString()
      }),
    });

    console.log('Response status from send-reminder-emails:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from send-reminder-emails:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const result = await response.json();
    console.log('Manual test result:', result);

    const finalResult = {
      success: true,
      message: 'Manual email test completed successfully',
      timestamp: new Date().toISOString(),
      testResults: result
    };

    return new Response(JSON.stringify(finalResult), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== ERROR IN MANUAL TEST FUNCTION ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Manual test failed',
      message: error.message,
      timestamp: new Date().toISOString(),
      errorType: error.constructor.name
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
