import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

export const handler: Handler = async (event, context) => {
  const logPrefix = `[TestDB ${new Date().toISOString()}]`;
  console.log(`${logPrefix} Function started.`);

  // 1. Log environment variables (masked)
  const envUrl = process.env.SUPABASE_URL;
  const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log(`${logPrefix} Checking environment variables:`);
  console.log(`${logPrefix} SUPABASE_URL: ${envUrl ? 'Defined' : 'MISSING'}`);
  console.log(`${logPrefix} SUPABASE_SERVICE_ROLE_KEY: ${envKey ? `Defined (Length: ${envKey.length})` : 'MISSING'}`);

  if (!envUrl || !envKey) {
    console.error(`${logPrefix} Critical Error: Missing required environment variables.`);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Missing environment variables',
        details: {
          SUPABASE_URL: envUrl ? 'OK' : 'MISSING',
          SUPABASE_SERVICE_ROLE_KEY: envKey ? 'OK' : 'MISSING'
        }
      }),
    };
  }

  // 2. Initialize Supabase inside the handler to ensure env vars are loaded
  try {
    const supabase = createClient(envUrl, envKey);

    console.log(`${logPrefix} Attempting to connect to Supabase...`);
    
    // Try to fetch 1 row from 'profiles' table
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (error) {
      console.error(`${logPrefix} Supabase connection error:`, error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: 'Supabase connection failed',
          error: error
        }),
      };
    }

    console.log(`${logPrefix} Supabase connection successful. Data received.`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Supabase connection successful',
        data: data
      }),
    };

  } catch (err: any) {
    console.error(`${logPrefix} Unexpected error:`, err);
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
