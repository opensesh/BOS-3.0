import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // #region agent log
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  fetch('http://127.0.0.1:7242/ingest/3e9d966b-9057-4dd8-8a82-1447a767070c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:createClient',message:'Supabase client config',data:{hasUrl:!!supabaseUrl,urlStart:supabaseUrl?.substring(0,30),hasKey:!!supabaseKey,keyLength:supabaseKey?.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

