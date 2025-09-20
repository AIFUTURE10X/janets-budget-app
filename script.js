// Budget App JavaScript
class BudgetApp {
    constructor() {
        this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        this.budgets = JSON.parse(localStorage.getItem('budgets')) || {};
        this.settings = JSON.parse(localStorage.getItem('settings')) || {
            lowBalanceThreshold: 100,
            overspendingAlert: 80,
            enableNotifications: false
        };
        
        // Load categories from localStorage or use defaults
        this.categories = JSON.parse(localStorage.getItem('categories')) || {
            expense: ['Groceries', 'Utilities', 'Entertainment', 'Transportation', 'Healthcare', 'Shopping', 'Dining', 'Bills', 'Other'],
            income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other']
        };
        
        this.chart = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.populateCategories();
        this.updateDashboard();
        this.checkAlerts();
        this.requestNotificationPermission();
        
        // Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('transactionDate').value = today;
    }

    setupEventListeners() {
        // Modal controls
        console.log('Setting up event listeners...');
        const addBtn = document.getElementById('addTransactionBtn');
        console.log('Add Transaction Button found:', addBtn);
        
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                console.log('Add Transaction button clicked!');
                this.openTransactionModal();
            });
        } else {
            console.error('Add Transaction button not found!');
        }
        
        document.getElementById('manageBudgetsBtn').addEventListener('click', () => this.openBudgetModal());
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettingsModal());
        document.getElementById('viewAllTransactionsBtn').addEventListener('click', () => this.openAllTransactionsModal());

        // Close modal buttons
        document.querySelectorAll('.close-btn, #cancelTransaction').forEach(btn => {
            btn.addEventListener('click', (e) => this.closeModal(e.target.closest('.modal')));
        });

        // Form submissions
        document.getElementById('transactionForm').addEventListener('submit', (e) => this.handleTransactionSubmit(e));
        document.getElementById('budgetForm').addEventListener('submit', (e) => this.handleBudgetSubmit(e));
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());

        // Transaction type change
        document.getElementById('transactionType').addEventListener('change', (e) => this.updateCategoriesForType(e.target.value));

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
        
        document.getElementById('saveNewCategory').addEventListener('click', () => this.saveNewCategory());
        document.getElementById('cancelNewCategory').addEventListener('click', () => this.hideNewCategoryInput());
        document.getElementById('newCategoryName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveNewCategory();
            }
        });

        // Data management
        document.getElementById('exportDataBtn').addEventListener('click', () => this.exportData());
        document.getElementById('clearDataBtn').addEventListener('click', () => this.clearAllData());

        // Sync functionality
        document.getElementById('backupDataBtn').addEventListener('click', () => this.backupToCloud());
        document.getElementById('restoreDataBtn').addEventListener('click', () => this.restoreFromCloud());
        document.getElementById('syncFileInput').addEventListener('change', (e) => this.handleSyncFileRestore(e));

        // Filter transactions
        document.querySelectorAll('#filterCategory, #filterType, #filterDateFrom, #filterDateTo').forEach(filter => {
            filter.addEventListener('change', () => this.filterTransactions());
        });

        // Close modals when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });
    }

    // Data Management
    saveData() {
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
        localStorage.setItem('budgets', JSON.stringify(this.budgets));
        localStorage.setItem('settings', JSON.stringify(this.settings));
        localStorage.setItem('categories', JSON.stringify(this.categories));
    }

    // Transaction Management
    addTransaction(transaction) {
        transaction.id = Date.now().toString();
        transaction.date = new Date(transaction.date);
        this.transactions.unshift(transaction);
        this.saveData();
        this.updateDashboard();
        this.checkAlerts();
        this.showAlert('Transaction added successfully!', 'success');
    }

    deleteTransaction(id) {
        this.transactions = this.transactions.filter(t => t.id !== id);
        this.saveData();
        this.updateDashboard();
        this.showAlert('Transaction deleted successfully!', 'success');
    }

    // Budget Management
    setBudget(category, amount, period = 'monthly') {
        this.budgets[category] = { amount: parseFloat(amount), period };
        this.saveData();
        this.updateDashboard();
        this.updateBudgetsList();
        this.showAlert(`Budget set for ${category}!`, 'success');
    }

    removeBudget(category) {
        delete this.budgets[category];
        this.saveData();
        this.updateDashboard();
        this.updateBudgetsList();
        this.showAlert(`Budget removed for ${category}!`, 'success');
    }

    // Calculations
    calculateBalance() {
        const income = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const expenses = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        return { income, expenses, balance: income - expenses };
    }

    calculateCategorySpending(category, period = 'monthly') {
        const now = new Date();
        const startDate = new Date();
        
        if (period === 'monthly') {
            startDate.setMonth(now.getMonth(), 1);
        } else if (period === 'weekly') {
            startDate.setDate(now.getDate() - now.getDay());
        }
        
        return this.transactions
            .filter(t => t.type === 'expense' && 
                         t.category === category && 
                         new Date(t.date) >= startDate)
            .reduce((sum, t) => sum + t.amount, 0);
    }

    calculateTotalBudgetRemaining() {
        try {
            // If no budgets are set, return 0
            if (!this.budgets || typeof this.budgets !== 'object' || Object.keys(this.budgets).length === 0) {
                return 0;
            }

            let totalBudget = 0;
            let totalSpent = 0;

            // Calculate total budget and total spent across all categories
            for (const [category, budget] of Object.entries(this.budgets)) {
                if (budget && typeof budget === 'object' && typeof budget.amount === 'number' && !isNaN(budget.amount)) {
                    totalBudget += budget.amount;
                    const categorySpent = this.calculateCategorySpending(category, budget.period || 'monthly');
                    totalSpent += (typeof categorySpent === 'number' && !isNaN(categorySpent)) ? categorySpent : 0;
                }
            }

            // Return remaining budget (don't allow negative values)
            const remaining = totalBudget - totalSpent;
            return Math.max(0, remaining);
        } catch (error) {
            console.error('Error calculating total budget remaining:', error);
            return 0;
        }
    }

    // UI Updates
    updateDashboard() {
        this.updateBalanceDisplay();
        this.updateBudgetGrid();
        this.updateRecentTransactions();
        this.updateChart();
    }

    updateBalanceDisplay() {
        const { income, expenses, balance } = this.calculateBalance();
        const totalLeft = this.calculateTotalBudgetRemaining();
        
        document.getElementById('currentBalance').textContent = this.formatCurrency(balance);
        document.getElementById('totalIncome').textContent = this.formatCurrency(income);
        document.getElementById('totalExpenses').textContent = this.formatCurrency(expenses);
        
        const totalLeftElement = document.getElementById('totalLeft');
        
        if (totalLeftElement) {
            totalLeftElement.textContent = this.formatCurrency(totalLeft);
            
            // Update total left color based on amount
            if (totalLeft > 0) {
                totalLeftElement.style.color = '#27ae60'; // Green for positive remaining budget
            } else {
                totalLeftElement.style.color = '#7f8c8d'; // Gray for no budget remaining
            }
        }
        
        // Update balance color based on amount
        const balanceElement = document.getElementById('currentBalance');
        balanceElement.style.color = balance >= 0 ? '#27ae60' : '#e74c3c';
    }

    updateBudgetGrid() {
        const budgetGrid = document.getElementById('budgetGrid');
        budgetGrid.innerHTML = '';

        if (Object.keys(this.budgets).length === 0) {
            budgetGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-pie"></i>
                    <h3>No budgets set</h3>
                    <p>Click "Manage Budgets" to set your first budget</p>
                </div>
            `;
            return;
        }

        Object.entries(this.budgets).forEach(([category, budget]) => {
            const spent = this.calculateCategorySpending(category, budget.period);
            const percentage = (spent / budget.amount) * 100;
            const remaining = budget.amount - spent;
            
            let statusClass = '';
            let statusText = `${percentage.toFixed(0)}%`;
            
            if (percentage >= 100) {
                statusClass = 'danger';
                statusText = 'Over Budget';
            } else if (percentage >= this.settings.overspendingAlert) {
                statusClass = 'warning';
            }

            const budgetCard = document.createElement('div');
            budgetCard.className = `budget-card ${statusClass}`;
            budgetCard.innerHTML = `
                <div class="budget-header">
                    <div class="budget-category">${category}</div>
                    <div class="budget-percentage ${statusClass}">${statusText}</div>
                </div>
                <div class="budget-amounts">
                    <span class="budget-spent">${this.formatCurrency(spent)} spent</span>
                    <span class="budget-total">of ${this.formatCurrency(budget.amount)}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${statusClass}" style="width: ${Math.min(percentage, 100)}%"></div>
                </div>
                <div style="margin-top: 0.5rem; font-size: 0.9rem; color: ${remaining >= 0 ? '#27ae60' : '#e74c3c'};">
                    ${remaining >= 0 ? this.formatCurrency(remaining) + ' remaining' : this.formatCurrency(Math.abs(remaining)) + ' over budget'}
                </div>
            `;
            budgetGrid.appendChild(budgetCard);
        });
    }

    updateRecentTransactions() {
        const transactionsList = document.getElementById('transactionsList');
        const recentTransactions = this.transactions.slice(0, 5);

        if (recentTransactions.length === 0) {
            transactionsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <h3>No transactions yet</h3>
                    <p>Add your first transaction to get started</p>
                </div>
            `;
            return;
        }

        transactionsList.innerHTML = recentTransactions.map(transaction => `
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
                <button class="btn btn-danger" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="app.deleteTransaction('${transaction.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    updateChart() {
        const ctx = document.getElementById('spendingChart').getContext('2d');
        
        // Calculate spending by category for the current month
        const categorySpending = {};
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        this.transactions
            .filter(t => t.type === 'expense' && new Date(t.date) >= startOfMonth)
            .forEach(t => {
                categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
            });

        const labels = Object.keys(categorySpending);
        const data = Object.values(categorySpending);
        const colors = [
            '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
            '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#f1c40f'
        ];

        if (this.chart) {
            this.chart.destroy();
        }

        if (labels.length === 0) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.font = '16px Arial';
            ctx.fillStyle = '#7f8c8d';
            ctx.textAlign = 'center';
            ctx.fillText('No spending data for this month', ctx.canvas.width / 2, ctx.canvas.height / 2);
            return;
        }

        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = this.formatCurrency(context.raw);
                                const percentage = ((context.raw / data.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Modal Management
    openTransactionModal(transaction = null) {
        console.log('Opening transaction modal...');
        const modal = document.getElementById('transactionModal');
        const form = document.getElementById('transactionForm');
        console.log('Modal element found:', modal);
        console.log('Form element found:', form);
        
        if (transaction) {
            // Edit mode
            document.getElementById('transactionModalTitle').textContent = 'Edit Transaction';
            document.getElementById('transactionType').value = transaction.type;
            document.getElementById('transactionAmount').value = transaction.amount;
            document.getElementById('transactionCategory').value = transaction.category;
            document.getElementById('transactionDescription').value = transaction.description || '';
            document.getElementById('transactionDate').value = transaction.date.toISOString().split('T')[0];
            form.dataset.editId = transaction.id;
        } else {
            // Add mode
            document.getElementById('transactionModalTitle').textContent = 'Add Transaction';
            form.reset();
            delete form.dataset.editId;
            document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
        }
        
        this.updateCategoriesForType(document.getElementById('transactionType').value);
        
        // Ensure new category input is hidden
        this.hideNewCategoryInput();
        
        console.log('Adding active class to modal...');
        modal.classList.add('active');
        console.log('Modal classes after adding active:', modal.className);
    }

    openBudgetModal() {
        const modal = document.getElementById('budgetModal');
        this.populateBudgetCategories();
        this.updateBudgetsList();
        modal.classList.add('active');
    }

    openSettingsModal() {
        const modal = document.getElementById('settingsModal');
        
        // Populate current settings
        document.getElementById('lowBalanceThreshold').value = this.settings.lowBalanceThreshold;
        document.getElementById('overspendingAlert').value = this.settings.overspendingAlert;
        document.getElementById('enableNotifications').checked = this.settings.enableNotifications;
        
        modal.classList.add('active');
    }

    openAllTransactionsModal() {
        const modal = document.getElementById('allTransactionsModal');
        this.populateFilterCategories();
        this.displayAllTransactions();
        modal.classList.add('active');
    }

    closeModal(modal) {
        modal.classList.remove('active');
    }

    // Form Handlers
    handleTransactionSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const transaction = {
            type: document.getElementById('transactionType').value,
            amount: parseFloat(document.getElementById('transactionAmount').value),
            category: document.getElementById('transactionCategory').value,
            description: document.getElementById('transactionDescription').value,
            date: document.getElementById('transactionDate').value
        };

        if (form.dataset.editId) {
            // Edit existing transaction
            const index = this.transactions.findIndex(t => t.id === form.dataset.editId);
            if (index !== -1) {
                this.transactions[index] = { ...this.transactions[index], ...transaction };
                this.saveData();
                this.updateDashboard();
                this.showAlert('Transaction updated successfully!', 'success');
            }
        } else {
            // Add new transaction
            this.addTransaction(transaction);
        }

        this.closeModal(document.getElementById('transactionModal'));
        form.reset();
    }

    handleBudgetSubmit(e) {
        e.preventDefault();
        
        const category = document.getElementById('budgetCategory').value;
        const amount = document.getElementById('budgetAmount').value;
        const period = document.getElementById('budgetPeriod').value;
        
        this.setBudget(category, amount, period);
        
        // Reset form
        document.getElementById('budgetForm').reset();
    }

    // Category Management
    populateCategories() {
        this.updateCategoriesForType('expense');
    }

    updateCategoriesForType(type) {
        const categorySelect = document.getElementById('transactionCategory');
        categorySelect.innerHTML = '';
        
        this.categories[type].forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }

    populateBudgetCategories() {
        const categorySelect = document.getElementById('budgetCategory');
        categorySelect.innerHTML = '';
        
        this.categories.expense.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }

    populateFilterCategories() {
        const categorySelect = document.getElementById('filterCategory');
        categorySelect.innerHTML = '<option value="">All Categories</option>';
        
        const allCategories = [...new Set([...this.categories.expense, ...this.categories.income])];
        allCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
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
        
        newCategoryInput.style.display = 'none';
        addCategoryBtn.style.display = 'flex';
        
        // Clear the input
        document.getElementById('newCategoryName').value = '';
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
            if (budgetModal && budgetModal.style.display === 'block') {
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
                <button class="remove-btn" onclick="app.removeBudget('${category}')">Remove</button>
            </div>
        `).join('');
    }

    // Transaction Filtering
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

    displayAllTransactions() {
        this.displayFilteredTransactions(this.transactions);
    }

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

    // Settings Management
    saveSettings() {
        this.settings.lowBalanceThreshold = parseFloat(document.getElementById('lowBalanceThreshold').value) || 100;
        this.settings.overspendingAlert = parseInt(document.getElementById('overspendingAlert').value) || 80;
        this.settings.enableNotifications = document.getElementById('enableNotifications').checked;
        
        this.saveData();
        this.closeModal(document.getElementById('settingsModal'));
        this.showAlert('Settings saved successfully!', 'success');
        
        if (this.settings.enableNotifications) {
            this.requestNotificationPermission();
        }
    }

    // Alert System
    checkAlerts() {
        const { balance } = this.calculateBalance();
        
        // Low balance alert
        if (balance < this.settings.lowBalanceThreshold) {
            this.showAlert(`Low balance warning: ${this.formatCurrency(balance)}`, 'warning');
            this.sendNotification('Low Balance Warning', `Your balance is ${this.formatCurrency(balance)}`);
        }

        // Budget overspending alerts
        Object.entries(this.budgets).forEach(([category, budget]) => {
            const spent = this.calculateCategorySpending(category, budget.period);
            const percentage = (spent / budget.amount) * 100;
            
            if (percentage >= 100) {
                this.showAlert(`Budget exceeded for ${category}!`, 'danger');
                this.sendNotification('Budget Exceeded', `You've exceeded your ${category} budget`);
            } else if (percentage >= this.settings.overspendingAlert) {
                this.showAlert(`Approaching budget limit for ${category} (${percentage.toFixed(0)}%)`, 'warning');
            }
        });
    }

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

    // Notification System
    requestNotificationPermission() {
        if ('Notification' in window && this.settings.enableNotifications) {
            Notification.requestPermission();
        }
    }

    sendNotification(title, body) {
        if ('Notification' in window && 
            this.settings.enableNotifications && 
            Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%233498db"><path d="M21 18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v13z"/></svg>'
            });
        }
    }

    // Data Export/Import
    exportData() {
        const data = {
            transactions: this.transactions,
            budgets: this.budgets,
            settings: this.settings,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `budget-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showAlert('Data exported successfully!', 'success');
    }

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

    // Sync Functionality
    backupToCloud() {
        this.updateSyncStatus('Backing up...', 'syncing');
        
        // Simulate cloud backup with a delay
        setTimeout(() => {
            const data = {
                transactions: this.transactions,
                budgets: this.budgets,
                settings: this.settings,
                categories: this.categories,
                backupDate: new Date().toISOString(),
                version: '1.0'
            };
            
            // Create backup file
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `budget-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Store backup info in localStorage
            const backupInfo = {
                date: new Date().toISOString(),
                transactionCount: this.transactions.length,
                budgetCount: Object.keys(this.budgets).length
            };
            localStorage.setItem('lastBackup', JSON.stringify(backupInfo));
            
            this.updateSyncStatus('Backup completed successfully!', 'success');
            this.showAlert('Data backed up successfully! File downloaded to your device.', 'success');
            
            // Reset status after 3 seconds
            setTimeout(() => {
                this.updateSyncStatus('Ready to sync', 'ready');
            }, 3000);
        }, 1500);
    }

    restoreFromCloud() {
        // Trigger file input
        document.getElementById('syncFileInput').click();
    }

    handleSyncFileRestore(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.updateSyncStatus('Restoring data...', 'syncing');

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Validate backup file structure
                if (!data.transactions || !data.budgets || !data.settings) {
                    throw new Error('Invalid backup file format');
                }

                // Confirm restore
                const confirmMessage = `Restore data from backup?\n\nBackup Date: ${new Date(data.backupDate || data.exportDate).toLocaleDateString()}\nTransactions: ${data.transactions.length}\nBudgets: ${Object.keys(data.budgets).length}\n\nThis will replace all current data!`;
                
                if (confirm(confirmMessage)) {
                    // Restore data
                    this.transactions = data.transactions || [];
                    this.budgets = data.budgets || {};
                    this.settings = { ...this.settings, ...data.settings };
                    this.categories = data.categories || this.categories;
                    
                    // Save and update
                    this.saveData();
                    this.updateDashboard();
                    this.populateCategories();
                    
                    this.updateSyncStatus('Restore completed successfully!', 'success');
                    this.showAlert('Data restored successfully!', 'success');
                    
                    // Reset status after 3 seconds
                    setTimeout(() => {
                        this.updateSyncStatus('Ready to sync', 'ready');
                    }, 3000);
                } else {
                    this.updateSyncStatus('Restore cancelled', 'ready');
                }
            } catch (error) {
                console.error('Restore error:', error);
                this.updateSyncStatus('Restore failed', 'error');
                this.showAlert('Failed to restore data. Please check the backup file.', 'error');
                
                setTimeout(() => {
                    this.updateSyncStatus('Ready to sync', 'ready');
                }, 3000);
            }
        };

        reader.readAsText(file);
        
        // Clear the input
        event.target.value = '';
    }

    updateSyncStatus(message, status) {
        const statusElement = document.getElementById('syncStatusText');
        const statusContainer = document.getElementById('syncStatus');
        
        if (statusElement) {
            statusElement.textContent = message;
        }
        
        if (statusContainer) {
            // Remove existing status classes
            statusContainer.classList.remove('sync-ready', 'sync-syncing', 'sync-success', 'sync-error');
            
            // Add new status class
            statusContainer.classList.add(`sync-${status}`);
        }
    }

    // Utility Functions
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
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