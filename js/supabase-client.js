const supabaseUrl = 'https://cgudnnlcwcotovcslgzu.supabase.co';
const supabaseKey = 'sb_publishable_hE34ndDf80WDmA2QwkiRKQ_lS9zIBh7';

// Supabase ya debe estar cargado globalmente desde index.html
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

console.log("Supabase Client Initialized");
