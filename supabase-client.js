// Supabase Client for Janet's Budget App
// Handles all cloud sync operations

class SupabaseSync {
    constructor(config) {
        this.config = config;
        this.supabase = null;
        this.userId = null;
        this.deviceId = this.generateDeviceId();
        this.isOnline = navigator.onLine;
        this.syncInProgress = false;
        this.realtimeSubscription = null;
        
        // Initialize online/offline detection
        this.setupNetworkDetection();
    }

    // Initialize Supabase client
    async initialize() {
        try {
            // Load Supabase library if not already loaded
            if (typeof window.supabase === 'undefined') {
                await this.loadSupabaseLibrary();
            }

            // Create Supabase client
            this.supabase = window.supabase.createClient(
                this.config.url,
                this.config.anonKey
            );

            // Set device context for RLS
            await this.supabase.rpc('set_config', {
                setting_name: 'app.device_id',
                setting_value: this.deviceId
            });

            // Register or get user
            await this.registerDevice();

            console.log('Supabase client initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize Supabase:', error);
            return false;
        }
    }

    // Load Supabase library dynamically
    async loadSupabaseLibrary() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Generate unique device ID
    generateDeviceId() {
        let deviceId = localStorage.getItem('budget_device_id');
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('budget_device_id', deviceId);
        }
        return deviceId;
    }

    // Register device and get user ID
    async registerDevice() {
        try {
            const deviceInfo = {
                device_id: this.deviceId,
                device_name: this.getDeviceName(),
                device_type: this.getDeviceType(),
                last_active: new Date().toISOString()
            };

            // Try to get existing user
            const { data: existingUser } = await this.supabase
                .from(this.config.tables.users)
                .select('id')
                .eq('device_id', this.deviceId)
                .single();

            if (existingUser) {
                this.userId = existingUser.id;
                // Update last active
                await this.supabase
                    .from(this.config.tables.users)
                    .update({ last_active: deviceInfo.last_active })
                    .eq('device_id', this.deviceId);
            } else {
                // Create new user
                const { data: newUser, error } = await this.supabase
                    .from(this.config.tables.users)
                    .insert(deviceInfo)
                    .select('id')
                    .single();

                if (error) throw error;
                this.userId = newUser.id;
            }

            console.log('Device registered with user ID:', this.userId);
        } catch (error) {
            console.error('Failed to register device:', error);
            throw error;
        }
    }

    // Get device name
    getDeviceName() {
        const userAgent = navigator.userAgent;
        if (/Android/i.test(userAgent)) return 'Android Device';
        if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS Device';
        if (/Windows/i.test(userAgent)) return 'Windows PC';
        if (/Mac/i.test(userAgent)) return 'Mac';
        if (/Linux/i.test(userAgent)) return 'Linux PC';
        return 'Unknown Device';
    }

    // Get device type
    getDeviceType() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
    }

    // Setup network detection
    setupNetworkDetection() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('Device is online - enabling sync');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('Device is offline - disabling sync');
        });
    }

    // Upload local data to cloud
    async uploadToCloud(localData) {
        if (!this.isOnline || this.syncInProgress) return false;

        this.syncInProgress = true;
        const startTime = Date.now();

        try {
            console.log('Starting upload to cloud...');

            // Upload transactions
            if (localData.transactions && localData.transactions.length > 0) {
                await this.uploadTransactions(localData.transactions);
            }

            // Upload budgets
            if (localData.budgets && Object.keys(localData.budgets).length > 0) {
                await this.uploadBudgets(localData.budgets);
            }

            // Upload settings
            if (localData.settings) {
                await this.uploadSettings(localData.settings);
            }

            // Upload categories
            if (localData.categories) {
                await this.uploadCategories(localData.categories);
            }

            // Log successful sync
            await this.logSyncOperation('upload', 'all', localData.transactions?.length || 0, 'success');

            const duration = Date.now() - startTime;
            console.log(`Upload completed in ${duration}ms`);
            return true;

        } catch (error) {
            console.error('Upload failed:', error);
            await this.logSyncOperation('upload', 'all', 0, 'error', error.message);
            return false;
        } finally {
            this.syncInProgress = false;
        }
    }

    // Download data from cloud
    async downloadFromCloud() {
        if (!this.isOnline || this.syncInProgress) return null;

        this.syncInProgress = true;
        const startTime = Date.now();

        try {
            console.log('Starting download from cloud...');

            const cloudData = {
                transactions: await this.downloadTransactions(),
                budgets: await this.downloadBudgets(),
                settings: await this.downloadSettings(),
                categories: await this.downloadCategories()
            };

            // Log successful sync
            await this.logSyncOperation('download', 'all', cloudData.transactions?.length || 0, 'success');

            const duration = Date.now() - startTime;
            console.log(`Download completed in ${duration}ms`);
            return cloudData;

        } catch (error) {
            console.error('Download failed:', error);
            await this.logSyncOperation('download', 'all', 0, 'error', error.message);
            return null;
        } finally {
            this.syncInProgress = false;
        }
    }

    // Upload transactions
    async uploadTransactions(transactions) {
        const supabaseTransactions = transactions.map(t => ({
            user_id: this.userId,
            transaction_id: t.id,
            type: t.type,
            amount: parseFloat(t.amount),
            category: t.category,
            description: t.description,
            date: t.date
        }));

        // Use upsert to handle duplicates
        const { error } = await this.supabase
            .from(this.config.tables.transactions)
            .upsert(supabaseTransactions, { 
                onConflict: 'user_id,transaction_id',
                ignoreDuplicates: false 
            });

        if (error) throw error;
        console.log(`Uploaded ${transactions.length} transactions`);
    }

    // Upload budgets
    async uploadBudgets(budgets) {
        const supabaseBudgets = Object.entries(budgets).map(([category, amount]) => ({
            user_id: this.userId,
            category: category,
            amount: parseFloat(amount)
        }));

        const { error } = await this.supabase
            .from(this.config.tables.budgets)
            .upsert(supabaseBudgets, { 
                onConflict: 'user_id,category',
                ignoreDuplicates: false 
            });

        if (error) throw error;
        console.log(`Uploaded ${Object.keys(budgets).length} budgets`);
    }

    // Upload settings
    async uploadSettings(settings) {
        const { error } = await this.supabase
            .from(this.config.tables.settings)
            .upsert({
                user_id: this.userId,
                settings_data: settings
            }, { 
                onConflict: 'user_id',
                ignoreDuplicates: false 
            });

        if (error) throw error;
        console.log('Uploaded settings');
    }

    // Upload categories
    async uploadCategories(categories) {
        const { error } = await this.supabase
            .from(this.config.tables.categories)
            .upsert({
                user_id: this.userId,
                categories_data: categories
            }, { 
                onConflict: 'user_id',
                ignoreDuplicates: false 
            });

        if (error) throw error;
        console.log('Uploaded categories');
    }

    // Download transactions
    async downloadTransactions() {
        const { data, error } = await this.supabase
            .from(this.config.tables.transactions)
            .select('*')
            .eq('user_id', this.userId)
            .order('date', { ascending: false });

        if (error) throw error;

        return data.map(t => ({
            id: t.transaction_id,
            type: t.type,
            amount: t.amount.toString(),
            category: t.category,
            description: t.description,
            date: t.date
        }));
    }

    // Download budgets
    async downloadBudgets() {
        const { data, error } = await this.supabase
            .from(this.config.tables.budgets)
            .select('*')
            .eq('user_id', this.userId);

        if (error) throw error;

        const budgets = {};
        data.forEach(b => {
            budgets[b.category] = b.amount.toString();
        });
        return budgets;
    }

    // Download settings
    async downloadSettings() {
        const { data, error } = await this.supabase
            .from(this.config.tables.settings)
            .select('settings_data')
            .eq('user_id', this.userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" error
        return data?.settings_data || null;
    }

    // Download categories
    async downloadCategories() {
        const { data, error } = await this.supabase
            .from(this.config.tables.categories)
            .select('categories_data')
            .eq('user_id', this.userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" error
        return data?.categories_data || null;
    }

    // Log sync operation
    async logSyncOperation(operation, tableName, recordCount, status, errorMessage = null) {
        try {
            await this.supabase
                .from(this.config.tables.sync_log)
                .insert({
                    user_id: this.userId,
                    operation: operation,
                    table_name: tableName,
                    record_count: recordCount,
                    status: status,
                    error_message: errorMessage,
                    device_id: this.deviceId
                });
        } catch (error) {
            console.warn('Failed to log sync operation:', error);
        }
    }

    // Get sync status
    async getSyncStatus() {
        try {
            const { data, error } = await this.supabase
                .from(this.config.tables.sync_log)
                .select('*')
                .eq('user_id', this.userId)
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Failed to get sync status:', error);
            return [];
        }
    }

    // Setup real-time sync
    setupRealtimeSync(onDataChange) {
        if (!this.config.syncSettings.enableRealtime) return;

        try {
            // Subscribe to changes in transactions table
            this.realtimeSubscription = this.supabase
                .channel('budget_changes')
                .on('postgres_changes', 
                    { 
                        event: '*', 
                        schema: 'public', 
                        table: this.config.tables.transactions,
                        filter: `user_id=eq.${this.userId}`
                    }, 
                    (payload) => {
                        console.log('Real-time change detected:', payload);
                        if (onDataChange) onDataChange(payload);
                    }
                )
                .subscribe();

            console.log('Real-time sync enabled');
        } catch (error) {
            console.error('Failed to setup real-time sync:', error);
        }
    }

    // Cleanup
    cleanup() {
        if (this.realtimeSubscription) {
            this.supabase.removeChannel(this.realtimeSubscription);
            this.realtimeSubscription = null;
        }
    }
}

// Export for use in main app
window.SupabaseSync = SupabaseSync;
console.log('SupabaseSync class loaded:', typeof window.SupabaseSync);