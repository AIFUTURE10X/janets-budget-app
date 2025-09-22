-- Supabase Database Schema for Janet's Budget App
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for device identification
CREATE TABLE budget_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    device_id TEXT UNIQUE NOT NULL,
    device_name TEXT,
    device_type TEXT, -- 'mobile' or 'desktop'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE budget_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES budget_users(id) ON DELETE CASCADE,
    transaction_id TEXT NOT NULL, -- Original app transaction ID
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount DECIMAL(10,2) NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, transaction_id)
);

-- Budgets table
CREATE TABLE budget_budgets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES budget_users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    period TEXT DEFAULT 'monthly',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category)
);

-- Settings table
CREATE TABLE budget_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES budget_users(id) ON DELETE CASCADE,
    settings_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE budget_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES budget_users(id) ON DELETE CASCADE,
    categories_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sync log table for tracking sync operations
CREATE TABLE budget_sync_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES budget_users(id) ON DELETE CASCADE,
    operation TEXT NOT NULL, -- 'upload', 'download', 'conflict'
    table_name TEXT NOT NULL,
    record_count INTEGER DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
    error_message TEXT,
    device_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_transactions_user_date ON budget_transactions(user_id, date DESC);
CREATE INDEX idx_budgets_user_category ON budget_budgets(user_id, category);
CREATE INDEX idx_sync_log_user_created ON budget_sync_log(user_id, created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE budget_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_sync_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (users can only access their own data)
CREATE POLICY "Users can view own data" ON budget_users FOR SELECT USING (device_id = current_setting('app.device_id'));
CREATE POLICY "Users can insert own data" ON budget_users FOR INSERT WITH CHECK (device_id = current_setting('app.device_id'));
CREATE POLICY "Users can update own data" ON budget_users FOR UPDATE USING (device_id = current_setting('app.device_id'));

CREATE POLICY "Users can view own transactions" ON budget_transactions FOR SELECT USING (user_id IN (SELECT id FROM budget_users WHERE device_id = current_setting('app.device_id')));
CREATE POLICY "Users can insert own transactions" ON budget_transactions FOR INSERT WITH CHECK (user_id IN (SELECT id FROM budget_users WHERE device_id = current_setting('app.device_id')));
CREATE POLICY "Users can update own transactions" ON budget_transactions FOR UPDATE USING (user_id IN (SELECT id FROM budget_users WHERE device_id = current_setting('app.device_id')));
CREATE POLICY "Users can delete own transactions" ON budget_transactions FOR DELETE USING (user_id IN (SELECT id FROM budget_users WHERE device_id = current_setting('app.device_id')));

CREATE POLICY "Users can view own budgets" ON budget_budgets FOR SELECT USING (user_id IN (SELECT id FROM budget_users WHERE device_id = current_setting('app.device_id')));
CREATE POLICY "Users can insert own budgets" ON budget_budgets FOR INSERT WITH CHECK (user_id IN (SELECT id FROM budget_users WHERE device_id = current_setting('app.device_id')));
CREATE POLICY "Users can update own budgets" ON budget_budgets FOR UPDATE USING (user_id IN (SELECT id FROM budget_users WHERE device_id = current_setting('app.device_id')));
CREATE POLICY "Users can delete own budgets" ON budget_budgets FOR DELETE USING (user_id IN (SELECT id FROM budget_users WHERE device_id = current_setting('app.device_id')));

CREATE POLICY "Users can view own settings" ON budget_settings FOR SELECT USING (user_id IN (SELECT id FROM budget_users WHERE device_id = current_setting('app.device_id')));
CREATE POLICY "Users can insert own settings" ON budget_settings FOR INSERT WITH CHECK (user_id IN (SELECT id FROM budget_users WHERE device_id = current_setting('app.device_id')));
CREATE POLICY "Users can update own settings" ON budget_settings FOR UPDATE USING (user_id IN (SELECT id FROM budget_users WHERE device_id = current_setting('app.device_id')));

CREATE POLICY "Users can view own categories" ON budget_categories FOR SELECT USING (user_id IN (SELECT id FROM budget_users WHERE device_id = current_setting('app.device_id')));
CREATE POLICY "Users can insert own categories" ON budget_categories FOR INSERT WITH CHECK (user_id IN (SELECT id FROM budget_users WHERE device_id = current_setting('app.device_id')));
CREATE POLICY "Users can update own categories" ON budget_categories FOR UPDATE USING (user_id IN (SELECT id FROM budget_users WHERE device_id = current_setting('app.device_id')));

CREATE POLICY "Users can view own sync log" ON budget_sync_log FOR SELECT USING (user_id IN (SELECT id FROM budget_users WHERE device_id = current_setting('app.device_id')));
CREATE POLICY "Users can insert own sync log" ON budget_sync_log FOR INSERT WITH CHECK (user_id IN (SELECT id FROM budget_users WHERE device_id = current_setting('app.device_id')));

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_budget_transactions_updated_at BEFORE UPDATE ON budget_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_budgets_updated_at BEFORE UPDATE ON budget_budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_settings_updated_at BEFORE UPDATE ON budget_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_categories_updated_at BEFORE UPDATE ON budget_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();