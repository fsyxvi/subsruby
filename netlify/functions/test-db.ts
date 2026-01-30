import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export const handler: Handler = async (event, context) => {
  try {
    console.log('Test DB function started');
    console.log('Supabase URL:', supabaseUrl ? 'Defined' : 'Missing');
    console.log('Supabase Key:', supabaseKey ? 'Defined (Length: ' + supabaseKey.length + ')' : 'Missing');

    // Try to fetch 1 row from 'profiles' table
    // We assume 'profiles' exists based on the project context
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Supabase connection error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: 'Supabase connection failed',
          error: error
        }),
      };
    }

    console.log('Supabase connection successful. Data:', data);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Supabase connection successful',
        data: data
      }),
    };

  } catch (err: any) {
    console.error('Unexpected error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: err.message
      }),
    };
  }
};
