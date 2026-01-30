import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

export const handler: Handler = async (event, context) => {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Missing environment variables',
        details: {
          SUPABASE_URL: SUPABASE_URL ? 'OK' : 'MISSING',
          SUPABASE_SERVICE_ROLE_KEY: SUPABASE_KEY ? 'OK' : 'MISSING',
          available_env_keys: Object.keys(process.env) // List all available env keys for debugging
        }
      })
    };
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // Simple query to test connection
    const { data, error } = await supabase.from('profiles').select('*').limit(1);

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data
      })
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        full_error: error
      })
    };
  }
};
