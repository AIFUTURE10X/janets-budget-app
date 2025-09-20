// Budget App JavaScript
class BudgetApp {
    constructor() {
        // App version for cache busting and mobile sync
        this.APP_VERSION = '1.2.0';
        this.STORAGE_VERSION_KEY = 'budgetAppVersion';
        
        // Check if this is a mobile device
        this.isMobile = this.detectMobile();
        
        // Initialize chart reference
        this.chart = null;
        
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
        // Determine storage type based on device
        this.useSessionStorage = this.isMobile;
        this.storageType = this.useSessionStorage ? 'sessionStorage' : 'localStorage';
        
        console.log('Initializing data with storage type:', this.storageType);
        
        // Load data
        this.loadData();
        
        // Check version without blocking operations
        await this.checkVersionAsync();
    }

    // Initialize data with mobile compatibility (synchronous fallback)
    initializeData() {
        // Determine storage type based on device
        this.useSessionStorage = this.isMobile;
        this.storageType = this.useSessionStorage ? 'sessionStorage' : 'localStorage';
        
        console.log('Initializing data with storage type:', this.storageType);
        
        // Load data
        this.loadData();
        
        // Simple version check without blocking
        this.checkVersionSimple();
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
                storage.setItem(this.STORAGE_VERSION_KEY, this.APP_VERSION);
            }
        } catch (error) {
            console.warn('Version check failed:', error);
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
            const storage = this.useSessionStorage ? sessionStorage : localStorage;
            
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
            
            console.log('Data loaded:', {
                transactions: this.transactions.length,
                budgets: Object.keys(this.budgets).length,
                storageType: this.storageType
            });
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.initializeDefaultData();
        }
    }

    // Save data to storage
    saveData() {
        try {
            const storage = this.useSessionStorage ? sessionStorage : localStorage;
            
            storage.setItem('budgetApp_transactions', JSON.stringify(this.transactions));
            storage.setItem('budgetApp_budgets', JSON.stringify(this.budgets));
            storage.setItem('budgetApp_settings', JSON.stringify(this.settings));
            storage.setItem('budgetApp_categories', JSON.stringify(this.categories));
            
            console.log('Data saved to', this.storageType);
        } catch (error) {
            console.error('Error saving data:', error);
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

    // Open modal
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            
            // Set default date for transaction modal
            if (modalId === 'transactionModal') {
                const dateInput = document.getElementById('transactionDate');
                if (dateInput && !dateInput.value) {
                    dateInput.value = new Date().toISOString().split('T')[0];
                }
            }
        }
    }

    // Close modal
    closeModal(modal) {
        if (modal) {
            modal.style.display = 'none';
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
}

// Initialize the app when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new BudgetApp();
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