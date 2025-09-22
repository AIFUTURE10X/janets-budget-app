// Supabase Configuration for Janet's Budget App
// Replace these with your actual Supabase project credentials

const SUPABASE_CONFIG = {
    // Your Supabase project URL (from your Supabase dashboard)
    url: 'https://mmesxyymubtqcqbjohym.supabase.co',
    
    // Your Supabase anon/public key (from your Supabase dashboard)
    anonKey: 'sb_publishable_LAxQ1iXGYH6cQ-3dMb4GfA_V6127dne',
    
    // Database table names
    tables: {
        users: 'budget_users',
        transactions: 'budget_transactions',
        budgets: 'budget_budgets',
        settings: 'budget_settings',
        categories: 'budget_categories',
        sync_log: 'budget_sync_log'
    },
    
    // Sync settings
    syncSettings: {
        autoSyncInterval: 30000, // 30 seconds
        maxRetries: 3,
        retryDelay: 2000, // 2 seconds
        enableRealtime: true
    }
};

// Instructions for setup:
// 1. Go to https://supabase.com and create a new project
// 2. Copy your project URL and anon key from Settings > API
// 3. Replace YOUR_SUPABASE_URL and YOUR_SUPABASE_ANON_KEY above
// 4. Run the SQL schema provided in supabase-schema.sql in your Supabase SQL editor
// 5. Enable Row Level Security (RLS) for all tables

window.SUPABASE_CONFIG = SUPABASE_CONFIG;
console.log('Supabase config loaded:', window.SUPABASE_CONFIG);