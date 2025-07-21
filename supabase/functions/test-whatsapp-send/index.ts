import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

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
    console.log('=== TEST WHATSAPP SEND FUNCTION STARTED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('IST Time:', new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));

    // Parse user_id and dairy_unit_id from request body
    let user_id = undefined;
    let dairy_unit_id = undefined;
    try {
      const body = await req.json();
      user_id = body.user_id;
      dairy_unit_id = body.dairy_unit_id;
      console.log('Received user_id:', user_id, 'dairy_unit_id:', dairy_unit_id);
    } catch (e) {
      console.log('No JSON body or failed to parse user_id/dairy_unit_id');
    }

    // Environment variables check
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('Environment variables check:');
    console.log('- SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing');
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? 'Present (length: ' + serviceRoleKey.length + ')' : 'Missing');
    console.log('- WHATSAPP_API_URL:', Deno.env.get('WHATSAPP_API_URL') ? 'Present' : 'Missing');
    console.log('- WHATSAPP_API_KEY:', Deno.env.get('WHATSAPP_API_KEY') ? 'Present' : 'Missing');
    console.log('- WHATSAPP_PHONE_NUMBER_ID:', Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') ? 'Present' : 'Missing');
    console.log('- WHATSAPP_ACCESS_TOKEN:', Deno.env.get('WHATSAPP_ACCESS_TOKEN') ? 'Present' : 'Missing');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing required Supabase environment variables');
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('Supabase client initialized successfully');

    // Instead of picking a test user, call send-whatsapp-messages with these params
    const response = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'manual-test',
        triggeredBy: 'test-whatsapp-send',
        timestamp: new Date().toISOString(),
        user_id,
        dairy_unit_id
      }),
    });
    const result = await response.json();
    return new Response(JSON.stringify({
      success: true,
      message: 'Manual WhatsApp test completed',
      timestamp: new Date().toISOString(),
      testResults: result
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== ERROR IN TEST WHATSAPP SEND ===');
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