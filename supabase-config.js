window.WELLORA_SUPABASE_URL = "https://iturtqgexvklgtgqyzdz.supabase.co";
window.WELLORA_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dXJ0cWdleHZrbGd0Z3F5emR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNjE3OTcsImV4cCI6MjA5MTkzNzc5N30.hARuSHJ2PHPwIqEHxEjtR4qLQVWCk2Ej8vBLdCLTOE8";

window.createWelloraSupabaseClient = function createWelloraSupabaseClient() {
  if (!window.supabase) {
    throw new Error("Supabase failed to load on this page.");
  }

  if (!window.WELLORA_SUPABASE_URL || !window.WELLORA_SUPABASE_ANON_KEY) {
    throw new Error("Supabase credentials are missing from supabase-config.js.");
  }

  return window.supabase.createClient(
    window.WELLORA_SUPABASE_URL,
    window.WELLORA_SUPABASE_ANON_KEY
  );
};
