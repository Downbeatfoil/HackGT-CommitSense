import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://yiahfvqgeljmqljsaqqg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpYWhmdnFnZWxqbXFsanNhcXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMjAzNjIsImV4cCI6MjA3NDU5NjM2Mn0.GMRYYnwayw563AmOTfMngQJROj2IPEM9awDFwLwi4r4";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});