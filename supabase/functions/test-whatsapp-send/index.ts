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

    // Get a test user with WhatsApp subscription
    const { data: testSubscription, error: subscriptionError } = await supabase
      .from('whatsapp_subscriptions')
      .select(`
        *,
        profiles!inner (
          id,
          full_name,
          whatsapp_number
        )
      `)
      .eq('is_subscribed', true)
      .not('whatsapp_number', 'is', null)
      .limit(1)
      .single();

    if (subscriptionError) {
      console.error('Error fetching test WhatsApp subscription:', subscriptionError);
      throw new Error('No test WhatsApp subscription found. Please ensure at least one user has subscribed to WhatsApp notifications with a valid number.');
    }

    if (!testSubscription) {
      throw new Error('No test WhatsApp subscription found. Please ensure at least one user has subscribed to WhatsApp notifications with a valid number.');
    }

    console.log('Found test subscription:', {
      user_id: testSubscription.user_id,
      whatsapp_number: testSubscription.whatsapp_number,
      user_name: testSubscription.profiles?.full_name
    });

    // Create test message
    const testMessage = `🧪 *WhatsApp Test Message*

Hello ${testSubscription.profiles?.full_name || 'Test User'},

This is a test WhatsApp message from StatMonitor to verify that WhatsApp notifications are working correctly.

📅 *Test Details:*
• Sent at: ${new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"})}
• Function: test-whatsapp-send
• Status: Testing WhatsApp Integration

If you receive this message, WhatsApp notifications are working properly!

---
*StatMonitor - Your Compliance Partner*
Reply STOP to unsubscribe from WhatsApp reminders.`;

    console.log('Sending test WhatsApp message to:', testSubscription.whatsapp_number);

    // Send test WhatsApp message
    const whatsappResult = await sendWhatsAppMessage(testSubscription.whatsapp_number, testMessage);

    console.log('WhatsApp API response:', whatsappResult);

    // Log the test message
    const { error: logError } = await supabase
      .from('whatsapp_logs')
      .insert({
        user_id: testSubscription.user_id,
        dairy_unit_id: testSubscription.dairy_unit_id,
        whatsapp_number: testSubscription.whatsapp_number,
        message_type: 'test',
        parameter_id: null,
        message_content: testMessage,
        status: 'sent',
        sent_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Error logging test WhatsApp message:', logError);
    }

    const finalResult = {
      success: true,
      message: 'Test WhatsApp message sent successfully',
      timestamp: new Date().toISOString(),
      istTime: new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}),
      sentTo: {
        user_id: testSubscription.user_id,
        user_name: testSubscription.profiles?.full_name,
        whatsapp_number: testSubscription.whatsapp_number
      },
      whatsappApiResponse: whatsappResult,
      note: 'Check the WhatsApp number above to see if the test message was received'
    };

    console.log('=== FINAL RESULTS ===');
    console.log(JSON.stringify(finalResult, null, 2));

    return new Response(JSON.stringify(finalResult), {
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