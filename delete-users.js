import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mnrsqiinquoeeismvnua.supabase.co'; // <-- Replace with your project URL
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ucnNxaWlucXVvZWVpc212bnVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTA5NDkwMCwiZXhwIjoyMDY2NjcwOTAwfQ.TBKP1M2ij7hg_stHTvpOBxiVgmGbr2GC41vyDnGvScs'; // <-- Replace with your service_role key

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function deleteUser(userId) {
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) {
    console.error(`Failed to delete user ${userId}:`, error.message);
  } else {
    console.log(`Deleted user ${userId}`);
  }
}

// List user IDs to delete here:
const userIds = [
  '2580a270-995e-4e68-ae44-50c5b7355998', // <-- Replace with actual user ID
  '29cc571c-d782-40d8-8e98-c6e897f8a427'  // <-- Replace with actual user ID
];

for (const id of userIds) {
  await deleteUser(id);
}