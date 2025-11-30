import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://qrrwjuoekhdfdktyvamw.supabase.co';
export const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFycndqdW9la2hkZmRrdHl2YW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExODQ5NzgsImV4cCI6MjA2Njc2MDk3OH0._eTTqdRKj-QkN6Hd8xiKO528yBXwSlkZEjwla1IgrQg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
