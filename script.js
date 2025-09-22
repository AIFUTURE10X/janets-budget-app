// Budget App JavaScript
console.log('Script.js is loading...');

// Simple Supabase Test Function
function testSupabaseConnection() {
    console.log('Testing Supabase connection...');
    
    if (typeof window.SUPABASE_CONFIG === 'undefined') {
        alert('❌ SUPABASE_CONFIG not found');
        return;
    }
    
    if (typeof window.SupabaseSync === 'undefined') {
        alert('❌ SupabaseSync class not found');
        return;
    }
    
    try {
        const sync = new window.SupabaseSync(window.SUPABASE_CONFIG);
        alert('✅ Supabase connection test successful!');
        console.log('Supabase test passed:', sync);
    } catch (error) {
        alert('❌ Supabase connection failed: ' + error.message);
        console.error('Supabase test failed:', error);
    }
}

class BudgetApp {
    constructor() {
        // App version for cache busting and mobile sync
        this.APP_VERSION = '1.2.0';
        this.STORAGE_VERSION_KEY = 'budgetAppVersion';
        
        // Check if this is a mobile device
        this.isMobile = this.detectMobile();
        
        // Initialize chart reference
        this.chart = null;
        
        // Supabase integration
        this.supabaseSync = null;
        this.cloudSyncEnabled = false;
        this.lastCloudSync = null;
        
        // Initialize data and UI asynchronously to prevent blocking
        this.initializeAsync();
    }

    // Detect if running on mobile device
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (window.innerWidth <= 768 && 'ontouchstart' in window);
    }

    // Asynchronous initialization to prevent blocking
    async initializeAsync() {
        try {
            // Initialize data first
            await this.initializeDataAsync();
            
            // Initialize Supabase cloud sync
            await this.initializeSupabaseSync();
            
            // Then initialize UI
            await this.initAsync();
            
            console.log('App initialized successfully');
        } catch (error) {
            console.error('Initialization failed:', error);
            // Fallback to basic initialization
            this.initializeDefaultData();
            this.init();
        }
    }

    // Asynchronous data initialization
    async initializeDataAsync() {
        // Use localStorage for both mobile and desktop to ensure sync
        this.useSessionStorage = false;
        this.storageType = 'localStorage';
        
        console.log('Initializing data with storage type:', this.storageType, 'isMobile:', this.isMobile);
        
        // Load data
        this.loadData();
        
        // Check version without blocking operations
        await this.checkVersionAsync();
        
        // Force sync if mobile device to ensure data consistency
        if (this.isMobile) {
            await this.ensureMobileSync();
        }
    }

    // Initialize data with mobile compatibility (synchronous fallback)
    initializeData() {
        // Use localStorage for both mobile and desktop to ensure sync
        this.useSessionStorage = false;
        this.storageType = 'localStorage';
        
        console.log('Initializing data with storage type:', this.storageType, 'isMobile:', this.isMobile);
        
        // Load data
        this.loadData();
        
        // Simple version check without blocking
        this.checkVersionSimple();
        
        // Force sync if mobile device to ensure data consistency
        if (this.isMobile) {
            this.ensureMobileSyncSimple();
        }
    }

    // Async version check without blocking operations
    async checkVersionAsync() {
        try {
            const storage = this.useSessionStorage ? sessionStorage : localStorage;
            const storedVersion = storage.getItem(this.STORAGE_VERSION_KEY);
            
            console.log('App version check:', {
                current: this.APP_VERSION,
                stored: storedVersion,
                isMobile: this.isMobile
            });
            
            // If version mismatch, just update version without heavy operations
            if (storedVersion !== this.APP_VERSION) {
                console.log('Version updated to:', this.APP_VERSION);
                storage.setItem(this.STORAGE_VERSION_KEY, this.APP_VERSION);
            }
        } catch (error) {
            console.warn('Version check failed:', error);
        }
    }

    // Simple version check without blocking operations
    checkVersionSimple() {
        try {
            const storage = this.useSessionStorage ? sessionStorage : localStorage;
            const storedVersion = storage.getItem(this.STORAGE_VERSION_KEY);
            
            if (storedVersion !== this.APP_VERSION) {
                console.log('Version updated to:', this.APP_VERSION);
                storage.setItem(this.STORAGE_VERSION_KEY, this.APP_VERSION);
            }
        } catch (error) {
            console.warn('Version check failed:', error);
        }
    }

    // Ensure mobile sync (async version)
    async ensureMobileSync() {
        try {
            console.log('Ensuring mobile sync...');
            
            // Check if there's any sessionStorage data that needs to be migrated
            await this.migrateMobileData();
            
            // Force refresh of UI to ensure consistency
            await new Promise(resolve => requestAnimationFrame(resolve));
            this.updateDashboard();
            this.displayAllTransactions();
            
            console.log('Mobile sync completed');
        } catch (error) {
            console.error('Mobile sync failed:', error);
        }
    }

    // Ensure mobile sync (synchronous version)
    ensureMobileSyncSimple() {
        try {
            console.log('Ensuring mobile sync (simple)...');
            
            // Check if there's any sessionStorage data that needs to be migrated
            this.migrateMobileDataSimple();
            
            // Force refresh of UI to ensure consistency
            this.updateDashboard();
            this.displayAllTransactions();
            
            console.log('Mobile sync completed (simple)');
        } catch (error) {
            console.error('Mobile sync failed:', error);
        }
    }

    // Migrate data from sessionStorage to localStorage if needed (async)
    async migrateMobileData() {
        try {
            // Check if there's data in sessionStorage that's not in localStorage
            const sessionTransactions = sessionStorage.getItem('budgetApp_transactions');
            const localTransactions = localStorage.getItem('budgetApp_transactions');
            
            if (sessionTransactions && !localTransactions) {
                console.log('Migrating data from sessionStorage to localStorage...');
                
                // Migrate all data
                const keys = ['budgetApp_transactions', 'budgetApp_budgets', 'budgetApp_settings', 'budgetApp_categories'];
                for (const key of keys) {
                    const sessionData = sessionStorage.getItem(key);
                    if (sessionData) {
                        localStorage.setItem(key, sessionData);
                    }
                }
                
                // Clear sessionStorage after migration
                sessionStorage.clear();
                
                // Reload data from localStorage
                this.loadData();
                
                console.log('Data migration completed');
            }
        } catch (error) {
            console.error('Data migration failed:', error);
        }
    }

    // Migrate data from sessionStorage to localStorage if needed (sync)
    migrateMobileDataSimple() {
        try {
            // Check if there's data in sessionStorage that's not in localStorage
            const sessionTransactions = sessionStorage.getItem('budgetApp_transactions');
            const localTransactions = localStorage.getItem('budgetApp_transactions');
            
            if (sessionTransactions && !localTransactions) {
                console.log('Migrating data from sessionStorage to localStorage...');
                
                // Migrate all data
                const keys = ['budgetApp_transactions', 'budgetApp_budgets', 'budgetApp_settings', 'budgetApp_categories'];
                for (const key of keys) {
                    const sessionData = sessionStorage.getItem(key);
                    if (sessionData) {
                        localStorage.setItem(key, sessionData);
                    }
                }
                
                // Clear sessionStorage after migration
                sessionStorage.clear();
                
                // Reload data from localStorage
                this.loadData();
                
                console.log('Data migration completed');
            }
        } catch (error) {
            console.error('Data migration failed:', error);
        }
    }

    // Check version and force sync if needed (original method - kept for compatibility)
    checkVersionAndSync() {
        try {
            const storage = this.useSessionStorage ? sessionStorage : localStorage;
            const storedVersion = storage.getItem(this.STORAGE_VERSION_KEY);
            
            console.log('App version check:', {
                current: this.APP_VERSION,
                stored: storedVersion,
                isMobile: this.isMobile
            });
            
            // If version mismatch or mobile device, force sync
            if (storedVersion !== this.APP_VERSION || this.isMobile) {
                console.log('Version mismatch or mobile device detected, forcing sync...');
                this.forceMobileSync();
                
                // Update stored version
                storage.setItem(this.STORAGE_VERSION_KEY, this.APP_VERSION);
            }
        } catch (error) {
            console.warn('Version check failed:', error);
            // Force sync anyway on error
            this.forceMobileSync();
        }
    }

    // Force mobile sync - clear cache and reload data
    forceMobileSync() {
        console.log('Forcing mobile sync...');
        
        try {
            // Clear any cached data that might be stale
            if (this.isMobile) {
                console.log('Mobile device: clearing potential cache issues');
                
                // Use aggressive mobile refresh
                this.forceMobileRefresh();
                
                // Add a small delay to ensure DOM is ready
                setTimeout(() => {
                    this.forceRefresh();
                    this.showMobileSyncNotification();
                }, 400);
            } else {
                // For desktop, just do normal refresh
                this.reloadAllData();
                setTimeout(() => {
                    this.forceRefresh();
                }, 200);
            }
        } catch (error) {
            console.error('Mobile sync failed:', error);
            // Initialize with defaults if sync fails
            this.initializeDefaultData();
            this.updateDashboard();
        }
    }

    // Reload all data from storage with fresh parsing
    reloadAllData() {
        console.log('Reloading all data from storage...');
        
        // Clear current data
        this.transactions = [];
        this.budgets = {};
        this.settings = {};
        this.categories = {};
        
        // Reload with fresh parsing
        this.initializeData();
    }

    // Show notification that mobile sync occurred
    showMobileSyncNotification() {
        if (this.isMobile) {
            console.log('Mobile sync completed');
            // You could add a visual notification here if desired
        }
    }

    // Force mobile refresh with cache clearing
    forceMobileRefresh() {
        try {
            // Clear mobile cache
            this.clearMobileCache();
            
            // Force reload from storage
            this.loadData();
            
            console.log('Mobile refresh completed');
        } catch (error) {
            console.error('Mobile refresh failed:', error);
        }
    }

    // Clear mobile cache
    clearMobileCache() {
        try {
            if (this.isMobile) {
                // Clear session storage on mobile
                sessionStorage.clear();
                console.log('Mobile cache cleared');
            }
        } catch (error) {
            console.warn('Cache clear failed:', error);
        }
    }

    // Initialize default data
    initializeDefaultData() {
        this.transactions = [];
        this.budgets = {};
        this.settings = {
            lowBalanceThreshold: 100,
            overspendingAlert: 80,
            enableNotifications: false
        };
        this.categories = {
            income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],
            expense: ['Food', 'Transportation', 'Entertainment', 'Bills', 'Shopping', 'Healthcare', 'Other']
        };
    }

    // Load data from storage
    loadData() {
        try {
            // Always use localStorage for consistency between mobile and desktop
            const storage = localStorage;
            
            // Load transactions
            const transactionsData = storage.getItem('budgetApp_transactions');
            this.transactions = transactionsData ? JSON.parse(transactionsData) : [];
            
            // Load budgets
            const budgetsData = storage.getItem('budgetApp_budgets');
            this.budgets = budgetsData ? JSON.parse(budgetsData) : {};
            
            // Load settings
            const settingsData = storage.getItem('budgetApp_settings');
            this.settings = settingsData ? JSON.parse(settingsData) : {
                lowBalanceThreshold: 100,
                overspendingAlert: 80,
                enableNotifications: false
            };
            
            // Load categories
            const categoriesData = storage.getItem('budgetApp_categories');
            this.categories = categoriesData ? JSON.parse(categoriesData) : {
                income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],
                expense: ['Food', 'Transportation', 'Entertainment', 'Bills', 'Shopping', 'Healthcare', 'Other']
            };
            
            console.log('Data loaded from localStorage:', {
                transactions: this.transactions.length,
                budgets: Object.keys(this.budgets).length,
                isMobile: this.isMobile,
                lastSave: storage.getItem('budgetApp_lastSave')
            });
            
        } catch (error) {
            console.error('Error loading data from localStorage:', error);
            // Try fallback to sessionStorage
            try {
                console.log('Trying fallback to sessionStorage...');
                const sessionStorage = window.sessionStorage;
                const transactionsData = sessionStorage.getItem('budgetApp_transactions');
                if (transactionsData) {
                    this.transactions = JSON.parse(transactionsData);
                    console.log('Loaded transactions from sessionStorage as fallback');
                } else {
                    this.initializeDefaultData();
                }
            } catch (fallbackError) {
                console.error('Fallback load also failed:', fallbackError);
                this.initializeDefaultData();
            }
        }
    }

    // Save data to storage
    saveData() {
        try {
            // Always use localStorage for consistency between mobile and desktop
            const storage = localStorage;
            
            storage.setItem('budgetApp_transactions', JSON.stringify(this.transactions));
            storage.setItem('budgetApp_budgets', JSON.stringify(this.budgets));
            storage.setItem('budgetApp_settings', JSON.stringify(this.settings));
            storage.setItem('budgetApp_categories', JSON.stringify(this.categories));
            
            console.log('Data saved to localStorage (mobile:', this.isMobile, ')');
            
            // Add sync timestamp for debugging
            storage.setItem('budgetApp_lastSave', new Date().toISOString());
            
            // Update sync status
            if (typeof this.updateSyncStatus === 'function') {
                this.updateSyncStatus('Data saved', 'success');
            }
            
            // Trigger cloud sync if enabled (async, don't wait)
            if (this.cloudSyncEnabled && this.supabaseSync) {
                this.performCloudSync().catch(error => {
                    console.error('Background cloud sync failed:', error);
                });
            }
            
        } catch (error) {
            console.error('Error saving data:', error);
            // Fallback to sessionStorage if localStorage fails
            try {
                sessionStorage.setItem('budgetApp_transactions', JSON.stringify(this.transactions));
                sessionStorage.setItem('budgetApp_budgets', JSON.stringify(this.budgets));
                sessionStorage.setItem('budgetApp_settings', JSON.stringify(this.settings));
                sessionStorage.setItem('budgetApp_categories', JSON.stringify(this.categories));
                console.log('Fallback: Data saved to sessionStorage');
                
                // Update sync status for fallback
                if (typeof this.updateSyncStatus === 'function') {
                    this.updateSyncStatus('Data saved (fallback)', 'success');
                }
            } catch (fallbackError) {
                console.error('Fallback save also failed:', fallbackError);
                if (typeof this.updateSyncStatus === 'function') {
                    this.updateSyncStatus('Save failed', 'error');
                }
            }
        }
    }

    // Initialize the app
    // Async initialization to prevent blocking
    async initAsync() {
        // Setup event listeners first
        this.setupEventListeners();
        
        // Use requestAnimationFrame to break up heavy operations
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        // Initialize UI components in chunks
        this.updateDashboard();
        
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        this.populateCategories();
        this.populateFilterCategories();
        
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        this.populateBudgetCategories();
        this.updateBudgetsList();
        
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        this.displayAllTransactions();
        this.checkAlerts();
        
        // Request notification permission if enabled
        if (this.settings && this.settings.enableNotifications) {
            this.requestNotificationPermission();
        }
    }

    // Synchronous init (fallback)
    init() {
        this.setupEventListeners();
        this.updateDashboard();
        this.populateCategories();
        this.populateFilterCategories();
        this.populateBudgetCategories();
        this.updateBudgetsList();
        this.displayAllTransactions();
        this.checkAlerts();
        
        // Initialize sync status
        this.initializeSyncStatus();
        
        // Request notification permission if enabled
        if (this.settings && this.settings.enableNotifications) {
            this.requestNotificationPermission();
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Transaction form
        const transactionForm = document.getElementById('transactionForm');
        if (transactionForm) {
            transactionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addTransaction();
            });
        }

        // Sync controls
        const exportBtn = document.getElementById('exportDataBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        const importBtn = document.getElementById('importDataBtn');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.triggerImport());
        }

        const importFileInput = document.getElementById('importFileInput');
        if (importFileInput) {
            importFileInput.addEventListener('change', (e) => this.importData(e));
        }

        const forceSyncBtn = document.getElementById('forceSyncBtn');
        if (forceSyncBtn) {
            forceSyncBtn.addEventListener('click', () => this.forceSync());
        }

        // Listen for storage changes from other tabs/windows
        window.addEventListener('storage', (e) => this.handleStorageChange(e));

        // Budget form
        const budgetForm = document.getElementById('budgetForm');
        if (budgetForm) {
            budgetForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addBudget();
            });
        }

        // Modal close buttons
        document.querySelectorAll('.close-btn').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });

        // Transaction type change
        const transactionType = document.getElementById('transactionType');
        if (transactionType) {
            transactionType.addEventListener('change', (e) => {
                this.updateCategoriesForType(e.target.value);
            });
        }

        // Main buttons
        const addTransactionBtn = document.getElementById('addTransactionBtn');
        if (addTransactionBtn) {
            addTransactionBtn.addEventListener('click', () => this.openModal('transactionModal'));
        }

        const manageBudgetsBtn = document.getElementById('manageBudgetsBtn');
        if (manageBudgetsBtn) {
            manageBudgetsBtn.addEventListener('click', () => this.openModal('budgetModal'));
        }

        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.openModal('settingsModal'));
        }

        const viewAllTransactionsBtn = document.getElementById('viewAllTransactionsBtn');
        if (viewAllTransactionsBtn) {
            viewAllTransactionsBtn.addEventListener('click', () => this.openModal('allTransactionsModal'));
        }

        // Sync buttons - Updated to use debug methods
        const mobileSyncBtn = document.getElementById('mobileSyncBtn');
        if (mobileSyncBtn) {
            mobileSyncBtn.addEventListener('click', () => this.performDebugSync());
        }

        const debugSyncBtn = document.getElementById('debugSyncBtn');
        if (debugSyncBtn) {
            debugSyncBtn.addEventListener('click', () => this.performDebugSync());
        }

        const debugStatusBtn = document.getElementById('debugStatusBtn');
        if (debugStatusBtn) {
            debugStatusBtn.addEventListener('click', () => this.showDebugStatus());
        }

        // Settings and other buttons
        const clearDataBtn = document.getElementById('clearDataBtn');
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => this.clearAllData());
        }

        const exportDataBtn = document.getElementById('exportDataBtn');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => this.exportData());
        }

        // Sync button
        const syncBtn = document.getElementById('syncBtn');
        if (syncBtn) {
            syncBtn.addEventListener('click', () => this.syncToCloud());
        }

        // Cancel buttons
        const cancelTransaction = document.getElementById('cancelTransaction');
        if (cancelTransaction) {
            cancelTransaction.addEventListener('click', () => this.closeModal(document.getElementById('transactionModal')));
        }

        // New category functionality
        const addCategoryBtn = document.getElementById('addCategoryBtn');
        if (addCategoryBtn) {
            console.log('Add Category button found, attaching event listener');
            addCategoryBtn.addEventListener('click', (e) => {
                console.log('Add Category button clicked');
                e.preventDefault();
                e.stopPropagation();
                this.showNewCategoryInput();
            });
        } else {
            console.error('Add Category button not found!');
        }
        
        const saveNewCategory = document.getElementById('saveNewCategory');
        if (saveNewCategory) {
            saveNewCategory.addEventListener('click', () => this.saveNewCategory());
        }
        
        const cancelNewCategory = document.getElementById('cancelNewCategory');
        if (cancelNewCategory) {
            cancelNewCategory.addEventListener('click', () => this.hideNewCategoryInput());
        }
        
        const newCategoryName = document.getElementById('newCategoryName');
        if (newCategoryName) {
            newCategoryName.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.saveNewCategory();
                }
            });
        }
    }

    // Debug methods for troubleshooting
    performDebugSync() {
        console.log('=== DEBUG SYNC STARTED ===');
        console.log('Current data before sync:', {
            transactions: this.transactions,
            transactionCount: this.transactions.length,
            balance: this.calculateBalance(),
            isMobile: this.isMobile,
            storageType: this.storageType,
            localStorage: localStorage.getItem('budgetApp_transactions'),
            sessionStorage: sessionStorage.getItem('budgetApp_transactions')
        });
        
        // Show status in UI
        this.showDebugStatus();
        
        // Force complete data reload
        this.clearMobileCache();
        this.loadData();
        this.updateDisplay();
        this.showAlert('Data synced and refreshed! Check debug info below.', 'success');
        
        // Log after sync
        setTimeout(() => {
            console.log('=== DEBUG SYNC COMPLETED ===');
            console.log('Current data after sync:', {
                transactions: this.transactions,
                transactionCount: this.transactions.length,
                balance: this.calculateBalance()
            });
            this.showDebugStatus();
        }, 500);
    }

    showDebugStatus() {
        const debugInfo = document.getElementById('debugInfo');
        const debugText = document.getElementById('debugText');
        
        if (debugInfo && debugText) {
            const balance = this.calculateBalance();
            const localData = localStorage.getItem('budgetApp_transactions');
            const sessionData = sessionStorage.getItem('budgetApp_transactions');
            
            const statusText = `
                <strong>Current Status:</strong><br>
                • Transactions: ${this.transactions.length} items<br>
                • Balance: $${balance.balance.toFixed(2)}<br>
                • Income: $${balance.income.toFixed(2)}<br>
                • Expenses: $${balance.expenses.toFixed(2)}<br>
                • Storage Type: ${this.storageType}<br>
                • Is Mobile: ${this.isMobile}<br>
                • LocalStorage: ${localData ? 'Has data' : 'Empty'}<br>
                • SessionStorage: ${sessionData ? 'Has data' : 'Empty'}<br>
                • Last Updated: ${new Date().toLocaleTimeString()}
            `;
            
            debugText.innerHTML = statusText;
            debugInfo.style.display = 'block';
            
            // Also log to console
            console.log('Debug Status:', {
                transactions: this.transactions,
                balance: balance,
                storageType: this.storageType,
                isMobile: this.isMobile,
                localStorageData: localData,
                sessionStorageData: sessionData
            });
        }
    }

    // Update display (refresh all UI components)
    updateDisplay() {
        this.updateDashboard();
        this.displayAllTransactions();
        this.updateBudgetsList();
    }

    // Force refresh all data and UI
    forceRefresh() {
        this.updateDisplay();
        this.populateCategories();
        this.populateFilterCategories();
        this.populateBudgetCategories();
    }

    // Calculate balance
    calculateBalance() {
        const income = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const expenses = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        return {
            income: income,
            expenses: expenses,
            balance: income - expenses
        };
    }

    // Add transaction
    addTransaction() {
        const type = document.getElementById('transactionType').value;
        const amount = parseFloat(document.getElementById('transactionAmount').value);
        const category = document.getElementById('transactionCategory').value;
        const description = document.getElementById('transactionDescription').value;
        const date = document.getElementById('transactionDate').value;

        if (!amount || !category || !date) {
            this.showAlert('Please fill in all required fields', 'error');
            return;
        }

        const transaction = {
            id: Date.now().toString(),
            type: type,
            amount: amount,
            category: category,
            description: description,
            date: date
        };

        this.transactions.push(transaction);
        this.saveData();
        this.updateDashboard();
        this.displayAllTransactions();
        this.closeModal(document.getElementById('transactionModal'));
        this.showAlert('Transaction added successfully!', 'success');
        
        // Reset form
        document.getElementById('transactionForm').reset();
        document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
        
        // Check for alerts
        this.checkAlerts();
    }

    // Update dashboard
    updateDashboard() {
        const { income, expenses, balance } = this.calculateBalance();
        
        document.getElementById('totalIncome').textContent = this.formatCurrency(income);
        document.getElementById('totalExpenses').textContent = this.formatCurrency(expenses);
        document.getElementById('currentBalance').textContent = this.formatCurrency(balance);
        
        // Update balance color
        const balanceElement = document.getElementById('currentBalance');
        balanceElement.className = balance >= 0 ? 'positive' : 'negative';
        
        this.updateChart();
        this.updateRecentTransactions();
    }

    // Update chart
    updateChart() {
        const ctx = document.getElementById('spendingChart');
        if (!ctx) return;

        const expensesByCategory = {};
        this.transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
            });

        const labels = Object.keys(expensesByCategory);
        const data = Object.values(expensesByCategory);

        if (this.chart) {
            this.chart.destroy();
        }

        if (labels.length === 0) {
            ctx.style.display = 'none';
            return;
        }

        ctx.style.display = 'block';

        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Update recent transactions
    updateRecentTransactions() {
        const container = document.getElementById('transactionsList');
        const recent = this.transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        if (recent.length === 0) {
            container.innerHTML = '<p style="color: #7f8c8d; text-align: center;">No transactions yet</p>';
            return;
        }

        container.innerHTML = recent.map(transaction => `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-icon ${transaction.type}">
                        <i class="fas fa-${transaction.type === 'income' ? 'plus' : 'minus'}"></i>
                    </div>
                    <div class="transaction-details">
                        <h4>${transaction.description || transaction.category}</h4>
                        <p>${transaction.category} • ${this.formatDate(transaction.date)}</p>
                    </div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(transaction.amount)}
                </div>
            </div>
        `).join('');
    }

    // Populate categories
    populateCategories() {
        const typeSelect = document.getElementById('transactionType');
        const categorySelect = document.getElementById('transactionCategory');
        
        if (typeSelect && categorySelect) {
            this.updateCategoriesForType(typeSelect.value);
        }
    }

    // Update categories for type
    updateCategoriesForType(type) {
        const categorySelect = document.getElementById('transactionCategory');
        const categories = this.categories[type] || [];
        
        categorySelect.innerHTML = categories.map(cat => 
            `<option value="${cat}">${cat}</option>`
        ).join('');
    }

    // Populate filter categories
    populateFilterCategories() {
        const filterCategory = document.getElementById('filterCategory');
        if (!filterCategory) return;
        
        const allCategories = [...this.categories.income, ...this.categories.expense];
        const uniqueCategories = [...new Set(allCategories)];
        
        filterCategory.innerHTML = '<option value="">All Categories</option>' +
            uniqueCategories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    }

    // Populate budget categories
    populateBudgetCategories() {
        const budgetCategory = document.getElementById('budgetCategory');
        if (!budgetCategory) return;
        
        const expenseCategories = this.categories.expense || [];
        budgetCategory.innerHTML = expenseCategories.map(cat => 
            `<option value="${cat}">${cat}</option>`
        ).join('');
    }

    // New Category Management
    showNewCategoryInput() {
        console.log('showNewCategoryInput called');
        const newCategoryInput = document.getElementById('newCategoryInput');
        const addCategoryBtn = document.getElementById('addCategoryBtn');
        
        if (newCategoryInput && addCategoryBtn) {
            console.log('Elements found, showing new category input');
            newCategoryInput.style.display = 'block';
            addCategoryBtn.style.display = 'none';
            
            // Focus on the input field
            const nameInput = document.getElementById('newCategoryName');
            if (nameInput) {
                nameInput.focus();
            }
        } else {
            console.error('Required elements not found:', { newCategoryInput, addCategoryBtn });
        }
    }

    hideNewCategoryInput() {
        const newCategoryInput = document.getElementById('newCategoryInput');
        const addCategoryBtn = document.getElementById('addCategoryBtn');
        
        if (newCategoryInput && addCategoryBtn) {
            newCategoryInput.style.display = 'none';
            addCategoryBtn.style.display = 'flex';
            
            // Clear the input
            const nameInput = document.getElementById('newCategoryName');
            if (nameInput) {
                nameInput.value = '';
            }
        }
    }

    saveNewCategory() {
        const newCategoryName = document.getElementById('newCategoryName').value.trim();
        const transactionType = document.getElementById('transactionType').value;
        
        if (!newCategoryName) {
            this.showAlert('Please enter a category name', 'error');
            return;
        }

        // Check if category already exists
        if (this.categories[transactionType].includes(newCategoryName)) {
            this.showAlert('Category already exists', 'error');
            return;
        }

        // Add the new category
        this.categories[transactionType].push(newCategoryName);
        
        // Save to localStorage
        this.saveData();
        
        // Update the category dropdown
        this.updateCategoriesForType(transactionType);
        
        // Select the new category
        document.getElementById('transactionCategory').value = newCategoryName;
        
        // Hide the input and show success message
        this.hideNewCategoryInput();
        this.showAlert(`Category "${newCategoryName}" added successfully!`, 'success');
        
        // Update other category dropdowns immediately
        this.populateFilterCategories();
        
        // If it's an expense category, update budget categories dropdown
        if (transactionType === 'expense') {
            this.populateBudgetCategories();
            
            // If budget modal is open, also update the budget category dropdown
            const budgetModal = document.getElementById('budgetModal');
            if (budgetModal && budgetModal.classList.contains('active')) {
                // Add the new category to budget dropdown and select it
                const budgetCategorySelect = document.getElementById('budgetCategory');
                if (budgetCategorySelect) {
                    const option = document.createElement('option');
                    option.value = newCategoryName;
                    option.textContent = newCategoryName;
                    budgetCategorySelect.appendChild(option);
                    budgetCategorySelect.value = newCategoryName;
                }
            }
        }
    }

    // Open modal
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            
            // Set default date for transaction modal
            if (modalId === 'transactionModal') {
                const dateInput = document.getElementById('transactionDate');
                if (dateInput && !dateInput.value) {
                    dateInput.value = new Date().toISOString().split('T')[0];
                }
                
                // Ensure new category input is hidden
                this.hideNewCategoryInput();
            }
        }
    }

    // Close modal
    closeModal(modal) {
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // Show alert
    showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alertContainer');
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `
            ${message}
            <button class="alert-close">&times;</button>
        `;
        
        alertContainer.appendChild(alert);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
        
        // Manual close
        alert.querySelector('.alert-close').addEventListener('click', () => {
            alert.remove();
        });
    }

    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    // Format date
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Add budget
    addBudget() {
        const category = document.getElementById('budgetCategory').value;
        const amount = parseFloat(document.getElementById('budgetAmount').value);
        const period = document.getElementById('budgetPeriod').value;

        if (!category || !amount || !period) {
            this.showAlert('Please fill in all fields', 'error');
            return;
        }

        this.budgets[category] = { amount, period };
        this.saveData();
        this.updateBudgetsList();
        this.closeModal(document.getElementById('budgetModal'));
        this.showAlert('Budget added successfully!', 'success');
        
        // Reset form
        document.getElementById('budgetForm').reset();
    }

    // Update budgets list
    updateBudgetsList() {
        const budgetsList = document.getElementById('currentBudgetsList');
        
        if (Object.keys(this.budgets).length === 0) {
            budgetsList.innerHTML = '<p style="color: #7f8c8d; text-align: center;">No budgets set</p>';
            return;
        }

        budgetsList.innerHTML = Object.entries(this.budgets).map(([category, budget]) => `
            <div class="budget-list-item">
                <div>
                    <div class="category">${category}</div>
                    <div style="font-size: 0.8rem; color: #7f8c8d;">${budget.period}</div>
                </div>
                <div class="amount">${this.formatCurrency(budget.amount)}</div>
                <div class="budget-actions">
                    <button class="btn btn-outline" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; margin-right: 0.5rem;" onclick="app.editBudget('${category}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="remove-btn" onclick="app.removeBudget('${category}')">Remove</button>
                </div>
            </div>
        `).join('');
    }

    // Remove budget
    removeBudget(category) {
        if (confirm(`Remove budget for ${category}?`)) {
            delete this.budgets[category];
            this.saveData();
            this.updateBudgetsList();
            this.showAlert('Budget removed successfully!', 'success');
        }
    }

    // Display all transactions
    displayAllTransactions() {
        this.displayFilteredTransactions(this.transactions);
    }

    // Display filtered transactions
    displayFilteredTransactions(transactions) {
        const container = document.getElementById('allTransactionsList');
        
        if (transactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No transactions found</h3>
                    <p>Try adjusting your filters</p>
                </div>
            `;
            return;
        }

        container.innerHTML = transactions.map(transaction => `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-icon ${transaction.type}">
                        <i class="fas fa-${transaction.type === 'income' ? 'plus' : 'minus'}"></i>
                    </div>
                    <div class="transaction-details">
                        <h4>${transaction.description || transaction.category}</h4>
                        <p>${transaction.category} • ${this.formatDate(transaction.date)}</p>
                    </div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(transaction.amount)}
                </div>
                <div class="transaction-actions">
                    <button class="btn btn-outline" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; margin-right: 0.5rem;" onclick="app.openTransactionModal(app.transactions.find(t => t.id === '${transaction.id}'))">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="app.deleteTransaction('${transaction.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Filter transactions
    filterTransactions() {
        const category = document.getElementById('filterCategory').value;
        const type = document.getElementById('filterType').value;
        const dateFrom = document.getElementById('filterDateFrom').value;
        const dateTo = document.getElementById('filterDateTo').value;

        let filtered = [...this.transactions];

        if (category) {
            filtered = filtered.filter(t => t.category === category);
        }

        if (type) {
            filtered = filtered.filter(t => t.type === type);
        }

        if (dateFrom) {
            filtered = filtered.filter(t => new Date(t.date) >= new Date(dateFrom));
        }

        if (dateTo) {
            filtered = filtered.filter(t => new Date(t.date) <= new Date(dateTo));
        }

        this.displayFilteredTransactions(filtered);
    }

    // Delete transaction
    deleteTransaction(id) {
        if (confirm('Delete this transaction?')) {
            this.transactions = this.transactions.filter(t => t.id !== id);
            this.saveData();
            this.updateDashboard();
            this.displayAllTransactions();
            this.showAlert('Transaction deleted successfully!', 'success');
        }
    }

    // Check alerts
    checkAlerts() {
        const { balance } = this.calculateBalance();
        
        // Low balance alert
        if (balance < this.settings.lowBalanceThreshold) {
            this.showAlert(`Low balance warning: ${this.formatCurrency(balance)}`, 'warning');
        }

        // Budget overspending alerts
        Object.entries(this.budgets).forEach(([category, budget]) => {
            const spent = this.calculateCategorySpending(category, budget.period);
            const percentage = (spent / budget.amount) * 100;
            
            if (percentage >= 100) {
                this.showAlert(`Budget exceeded for ${category}!`, 'danger');
            } else if (percentage >= this.settings.overspendingAlert) {
                this.showAlert(`Approaching budget limit for ${category} (${percentage.toFixed(0)}%)`, 'warning');
            }
        });
    }

    // Calculate category spending
    calculateCategorySpending(category, period) {
        const now = new Date();
        let startDate;

        switch (period) {
            case 'weekly':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
                break;
            case 'monthly':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'yearly':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        return this.transactions
            .filter(t => t.type === 'expense' && 
                        t.category === category && 
                        new Date(t.date) >= startDate)
            .reduce((sum, t) => sum + t.amount, 0);
    }

    // Request notification permission
    requestNotificationPermission() {
        if ('Notification' in window && this.settings.enableNotifications) {
            Notification.requestPermission();
        }
    }

    // Sync to cloud functionality
    async syncToCloud() {
        const syncBtn = document.getElementById('syncBtn');
        const originalText = syncBtn.innerHTML;
        
        try {
            // Update button to show syncing state
            syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Syncing...';
            syncBtn.disabled = true;
            
            // Prepare data for sync
            const syncData = {
                transactions: this.transactions,
                budgets: this.budgets,
                settings: this.settings,
                categories: this.categories,
                lastSync: new Date().toISOString(),
                version: this.APP_VERSION,
                deviceInfo: {
                    userAgent: navigator.userAgent,
                    isMobile: this.isMobile,
                    storageType: this.storageType
                }
            };
            
            // Simulate cloud sync (in a real app, this would be an API call)
            await this.performCloudSync(syncData);
            
            // Update last sync time in local storage
            const storage = this.useSessionStorage ? sessionStorage : localStorage;
            storage.setItem('budgetApp_lastSync', new Date().toISOString());
            
            // Show success message
            this.showAlert('Data synced to cloud successfully!', 'success');
            
            // Update sync status in UI if available
            this.updateSyncStatus('synced');
            
        } catch (error) {
            console.error('Sync failed:', error);
            this.showAlert('Sync failed. Please try again later.', 'error');
            this.updateSyncStatus('error');
        } finally {
            // Restore button state
            syncBtn.innerHTML = originalText;
            syncBtn.disabled = false;
        }
    }
    
    // Perform cloud sync (simulated)
    async performCloudSync(data) {
        // Simulate network delay (reduced to prevent blocking)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // In a real implementation, this would make an API call to your backend
        // For now, we'll create a backup file and store sync info locally
        
        // Create backup file
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        // Store backup info in localStorage for persistence
        const backupInfo = {
            timestamp: new Date().toISOString(),
            size: dataStr.length,
            transactionCount: data.transactions.length,
            budgetCount: Object.keys(data.budgets).length
        };
        
        localStorage.setItem('budgetApp_lastBackup', JSON.stringify(backupInfo));
        
        // Auto-download backup file
        const link = document.createElement('a');
        link.href = url;
        link.download = `budget-sync-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('Cloud sync completed:', backupInfo);
    }
    
    // Update sync status in UI
    updateSyncStatus(status) {
        const syncStatusElement = document.getElementById('syncStatusText');
        const syncStatusIcon = document.querySelector('#syncStatus i');
        
        if (syncStatusElement && syncStatusIcon) {
            const now = new Date().toLocaleString();
            
            switch (status) {
                case 'synced':
                    syncStatusElement.textContent = `Last synced: ${now}`;
                    syncStatusIcon.className = 'fas fa-cloud-upload-alt';
                    break;
                case 'syncing':
                    syncStatusElement.textContent = 'Syncing...';
                    syncStatusIcon.className = 'fas fa-spinner fa-spin';
                    break;
                case 'error':
                    syncStatusElement.textContent = 'Sync failed';
                    syncStatusIcon.className = 'fas fa-exclamation-triangle';
                    break;
                default:
                    syncStatusElement.textContent = 'Ready to sync';
                    syncStatusIcon.className = 'fas fa-cloud';
            }
        }
    }
    
    // Get last sync info
    getLastSyncInfo() {
        try {
            const lastBackup = localStorage.getItem('budgetApp_lastBackup');
            const lastSync = localStorage.getItem('budgetApp_lastSync');
            
            return {
                lastBackup: lastBackup ? JSON.parse(lastBackup) : null,
                lastSync: lastSync ? new Date(lastSync) : null
            };
        } catch (error) {
            console.warn('Error getting sync info:', error);
            return { lastBackup: null, lastSync: null };
        }
    }

    // Export data
    exportData() {
        const data = {
            transactions: this.transactions,
            budgets: this.budgets,
            settings: this.settings,
            categories: this.categories,
            exportDate: new Date().toISOString(),
            version: this.APP_VERSION
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `budget-app-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.showAlert('Data exported successfully!', 'success');
    }

    // Clear all data
    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            this.transactions = [];
            this.budgets = {};
            this.settings = {
                lowBalanceThreshold: 100,
                overspendingAlert: 80,
                enableNotifications: false
            };
            
            this.saveData();
            this.updateDashboard();
            this.closeModal(document.getElementById('settingsModal'));
            this.showAlert('All data cleared successfully!', 'success');
        }
    }

    // Trigger import file dialog
    triggerImport() {
        const fileInput = document.getElementById('importFileInput');
        if (fileInput) {
            fileInput.click();
        }
    }

    // Import data from file
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.updateSyncStatus('Importing data...', 'syncing');

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Validate imported data structure
                if (!this.validateImportedData(importedData)) {
                    throw new Error('Invalid data format');
                }

                // Backup current data before import
                const backupData = {
                    transactions: this.transactions,
                    budgets: this.budgets,
                    settings: this.settings,
                    categories: this.categories
                };
                localStorage.setItem('budgetApp_backup_before_import', JSON.stringify(backupData));

                // Import the data
                this.transactions = importedData.transactions || [];
                this.budgets = importedData.budgets || {};
                this.settings = importedData.settings || this.settings;
                this.categories = importedData.categories || this.categories;

                // Save imported data
                this.saveData();

                // Update UI
                this.updateDashboard();
                this.displayAllTransactions();
                this.populateCategories();
                this.updateBudgetsList();

                this.showAlert(`Data imported successfully! ${this.transactions.length} transactions loaded.`, 'success');
                this.updateSyncStatus('Import completed', 'success');

                console.log('Data imported:', {
                    transactions: this.transactions.length,
                    budgets: Object.keys(this.budgets).length,
                    from: importedData.exportDate || 'unknown date'
                });

            } catch (error) {
                console.error('Import failed:', error);
                this.showAlert('Failed to import data. Please check the file format.', 'error');
                this.updateSyncStatus('Import failed', 'error');
            }
        };

        reader.readAsText(file);
        event.target.value = ''; // Clear the input
    }

    // Validate imported data structure
    validateImportedData(data) {
        if (!data || typeof data !== 'object') return false;
        if (!Array.isArray(data.transactions)) return false;
        if (data.budgets && typeof data.budgets !== 'object') return false;
        if (data.settings && typeof data.settings !== 'object') return false;
        if (data.categories && typeof data.categories !== 'object') return false;
        return true;
    }

    // Force sync - refresh all data and UI
    async forceSync() {
        this.updateSyncStatus('Syncing...', 'syncing');
        
        try {
            // If cloud sync is enabled, perform cloud sync first
            if (this.cloudSyncEnabled && this.supabaseSync) {
                this.updateSyncStatus('Syncing with cloud...', 'syncing');
                
                // Download latest data from cloud
                const cloudData = await this.supabaseSync.downloadData();
                if (cloudData) {
                    await this.mergeCloudData(cloudData);
                }
                
                // Upload current data to cloud
                await this.performCloudSync();
            } else {
                // Reload data from local storage
                this.loadData();
            }
            
            // Update all UI components
            this.updateDashboard();
            this.displayAllTransactions();
            this.populateCategories();
            this.populateFilterCategories();
            this.populateBudgetCategories();
            this.updateBudgetsList();
            
            // Check for alerts
            this.checkAlerts();
            
            const syncMessage = this.cloudSyncEnabled ? 'Data synced with cloud!' : 'Data synced locally!';
            this.showAlert(syncMessage, 'success');
            this.updateSyncStatus('Sync completed', 'success');
            
            console.log('Force sync completed:', {
                transactions: this.transactions.length,
                budgets: Object.keys(this.budgets).length,
                cloudSync: this.cloudSyncEnabled,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('Force sync failed:', error);
            this.showAlert('Sync failed. Please try again.', 'error');
            this.updateSyncStatus('Sync failed', 'error');
        }
    }

    // Handle storage changes from other tabs/windows
    handleStorageChange(event) {
        if (!event.key || !event.key.startsWith('budgetApp_')) return;
        
        console.log('Storage change detected:', event.key);
        
        // Debounce rapid changes
        clearTimeout(this.storageChangeTimeout);
        this.storageChangeTimeout = setTimeout(() => {
            this.updateSyncStatus('External change detected', 'syncing');
            
            // Reload data and update UI
            this.loadData();
            this.updateDashboard();
            this.displayAllTransactions();
            
            this.updateSyncStatus('Data updated', 'success');
            this.showAlert('Data updated from another tab/device', 'info');
        }, 500);
    }

    // Update sync status indicator
    updateSyncStatus(message, status) {
        const statusElement = document.getElementById('syncStatusText');
        const statusIcon = document.getElementById('syncStatusIcon');
        const statusContainer = document.getElementById('syncStatus');
        const lastUpdateElement = document.getElementById('syncLastUpdate');
        
        if (statusElement) {
            statusElement.textContent = message;
        }
        
        if (statusContainer) {
            // Remove existing status classes
            statusContainer.classList.remove('sync-ready', 'sync-syncing', 'sync-success', 'sync-error');
            // Add new status class
            statusContainer.classList.add(`sync-${status}`);
        }
        
        if (lastUpdateElement) {
            lastUpdateElement.textContent = `Last update: ${new Date().toLocaleTimeString()}`;
        }
        
        // Auto-reset success/error status after 3 seconds
        if (status === 'success' || status === 'error') {
            setTimeout(() => {
                if (statusContainer) {
                    statusContainer.classList.remove(`sync-${status}`);
                    statusContainer.classList.add('sync-ready');
                }
                if (statusElement) {
                    statusElement.textContent = 'Ready to sync';
                }
            }, 3000);
        }
    }

    // Initialize sync status on app start
    initializeSyncStatus() {
        const lastSave = localStorage.getItem('budgetApp_lastSave');
        const deviceInfo = this.isMobile ? 'Mobile' : 'Desktop';
        
        if (lastSave) {
            const lastSaveDate = new Date(lastSave);
            this.updateSyncStatus(`${deviceInfo} - Ready`, 'ready');
            
            const lastUpdateElement = document.getElementById('syncLastUpdate');
            if (lastUpdateElement) {
                lastUpdateElement.textContent = `Last save: ${lastSaveDate.toLocaleString()}`;
            }
        } else {
            this.updateSyncStatus(`${deviceInfo} - No data`, 'ready');
        }
    }

    // Initialize Supabase cloud sync
    async initializeSupabaseSync() {
        try {
            console.log('Starting Supabase initialization...');
            console.log('SupabaseSync available:', typeof window.SupabaseSync !== 'undefined');
            console.log('SUPABASE_CONFIG available:', !!window.SUPABASE_CONFIG);
            
            // Check if Supabase is available and configured
            if (typeof window.SupabaseSync !== 'undefined' && window.SUPABASE_CONFIG) {
                console.log('Creating SupabaseSync instance...');
                this.supabaseSync = new window.SupabaseSync(window.SUPABASE_CONFIG);
                
                // Initialize the client
                console.log('Initializing Supabase client...');
                const initialized = await this.supabaseSync.initialize();
                
                if (initialized) {
                    this.cloudSyncEnabled = true;
                    console.log('Supabase sync initialized successfully');
                    
                    // Set up real-time sync if enabled
                    if (window.SUPABASE_CONFIG.enableRealTimeSync) {
                        await this.setupRealTimeSync();
                    }
                    
                    // Perform initial sync
                    await this.performCloudSync();
                } else {
                    console.warn('Supabase sync initialization failed');
                }
            } else {
                console.log('Supabase not configured, using local sync only');
                console.log('Missing components:', {
                    SupabaseSync: typeof window.SupabaseSync === 'undefined',
                    SUPABASE_CONFIG: !window.SUPABASE_CONFIG
                });
            }
        } catch (error) {
            console.error('Error initializing Supabase sync:', error);
            this.cloudSyncEnabled = false;
        }
    }

    // Set up real-time sync listeners
    async setupRealTimeSync() {
        if (!this.supabaseSync || !this.cloudSyncEnabled) return;

        try {
            // Listen for changes from other devices
            await this.supabaseSync.setupRealTimeSync((payload) => {
                console.log('Real-time sync update received:', payload);
                this.handleCloudDataUpdate(payload);
            });
        } catch (error) {
            console.error('Error setting up real-time sync:', error);
        }
    }

    // Handle incoming cloud data updates
    async handleCloudDataUpdate(payload) {
        try {
            // Check if the update is from a different device
            if (payload.device_id !== this.supabaseSync.deviceId) {
                this.updateSyncStatus('Syncing from cloud...', 'syncing');
                
                // Download and merge the latest data
                const cloudData = await this.supabaseSync.downloadData();
                if (cloudData) {
                    await this.mergeCloudData(cloudData);
                    this.updateSyncStatus('Synced with cloud', 'success');
                } else {
                    this.updateSyncStatus('Cloud sync failed', 'error');
                }
            }
        } catch (error) {
            console.error('Error handling cloud data update:', error);
            this.updateSyncStatus('Cloud sync error', 'error');
        }
    }

    // Perform true two-way cloud sync (download first, then upload merged data)
    async performCloudSync() {
        if (!this.supabaseSync || !this.cloudSyncEnabled) return false;

        try {
            this.updateSyncStatus('Syncing with cloud...', 'syncing');
            
            // Step 1: Download existing cloud data first
            console.log('Downloading cloud data...');
            const cloudData = await this.supabaseSync.downloadData();
            
            if (cloudData) {
                console.log('Cloud data found, merging with local data...');
                // Step 2: Merge cloud data with local data
                await this.mergeCloudData(cloudData);
            } else {
                console.log('No cloud data found, will upload local data...');
            }
            
            // Step 3: Upload the merged data back to cloud
            console.log('Uploading merged data to cloud...');
            const dataToSync = {
                transactions: this.transactions || [],
                budgets: this.budgets || [],
                categories: this.categories || [],
                settings: this.getAppSettings(),
                lastModified: new Date().toISOString()
            };

            const success = await this.supabaseSync.uploadData(dataToSync);
            
            if (success) {
                this.lastCloudSync = new Date();
                this.updateSyncStatus('Synced with cloud', 'success');
                console.log('Two-way sync completed successfully');
                return true;
            } else {
                this.updateSyncStatus('Cloud sync failed', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error performing cloud sync:', error);
            this.updateSyncStatus('Cloud sync error', 'error');
            return false;
        }
    }

    // Download and merge cloud data
    async mergeCloudData(cloudData) {
        try {
            if (!cloudData) return;

            console.log('Merging cloud data:', cloudData);

            // Merge transactions
            if (cloudData.transactions) {
                const originalCount = this.transactions ? this.transactions.length : 0;
                this.transactions = this.mergeArrayData(this.transactions || [], cloudData.transactions, 'id');
                console.log(`Transactions merged: ${originalCount} local + ${cloudData.transactions.length} cloud = ${this.transactions.length} total`);
            }

            // Merge budgets
            if (cloudData.budgets) {
                this.budgets = this.mergeArrayData(this.budgets || [], cloudData.budgets, 'category');
            }

            // Merge categories
            if (cloudData.categories) {
                this.categories = this.mergeArrayData(this.categories || [], cloudData.categories, 'name');
            }

            // Update settings
            if (cloudData.settings) {
                this.mergeSettings(cloudData.settings);
            }

            // Save merged data locally
            this.saveData();
            
            // Update UI to reflect merged data
            this.updateDisplay();
            this.updateChart();

            console.log('Cloud data merge completed');

        } catch (error) {
            console.error('Error merging cloud data:', error);
            throw error;
        }
    }

    // Merge array data with conflict resolution
    mergeArrayData(localArray, cloudArray, keyField) {
        const merged = [...localArray];
        const localKeys = new Set(localArray.map(item => item[keyField]));

        cloudArray.forEach(cloudItem => {
            if (!localKeys.has(cloudItem[keyField])) {
                // New item from cloud
                merged.push(cloudItem);
            } else {
                // Conflict resolution: use the most recent timestamp
                const localIndex = merged.findIndex(item => item[keyField] === cloudItem[keyField]);
                const localItem = merged[localIndex];
                
                const cloudTime = new Date(cloudItem.timestamp || cloudItem.date || 0);
                const localTime = new Date(localItem.timestamp || localItem.date || 0);
                
                if (cloudTime > localTime) {
                    merged[localIndex] = cloudItem;
                }
            }
        });

        return merged;
    }

    // Merge settings with cloud data
    mergeSettings(cloudSettings) {
        // Simple merge - cloud settings take precedence for most values
        // but preserve local device-specific settings
        const localSettings = this.getAppSettings();
        const mergedSettings = { ...localSettings, ...cloudSettings };
        
        // Preserve device-specific settings
        mergedSettings.deviceId = localSettings.deviceId;
        mergedSettings.lastLocalSync = localSettings.lastLocalSync;
        
        this.saveAppSettings(mergedSettings);
    }

    // Get current app settings
    getAppSettings() {
        try {
            const settings = localStorage.getItem('budgetApp_settings');
            return settings ? JSON.parse(settings) : {};
        } catch (error) {
            console.error('Error getting app settings:', error);
            return {};
        }
    }

    // Save app settings
    saveAppSettings(settings) {
        try {
            localStorage.setItem('budgetApp_settings', JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving app settings:', error);
        }
    }
}

// Initialize the app when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new BudgetApp();
    
    // Add test button event listener
    const testButton = document.getElementById('testSupabase');
    if (testButton) {
        testButton.addEventListener('click', testSupabaseConnection);
    }
});

// Service Worker for offline functionality (basic implementation)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}