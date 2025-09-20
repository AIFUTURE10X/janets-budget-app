# Janet's Budget App 💰

A comprehensive, user-friendly budget tracking application with smart alerts and beautiful visualizations.

## 🌟 Features

### Core Functionality
- **Income & Expense Tracking**: Easily add and categorize all your financial transactions
- **Budget Setting**: Set monthly or weekly budgets for different spending categories
- **Real-time Balance**: View your current balance and spending progress at a glance
- **Smart Categories**: Pre-defined categories for expenses (Groceries, Utilities, Entertainment, etc.) and income sources

### Smart Alert System
- **Overspending Alerts**: Get notified when approaching (80%) or exceeding category budgets
- **Low Balance Warnings**: Alerts when your balance drops below a customizable threshold
- **Visual Indicators**: Color-coded progress bars and budget cards for quick status recognition
- **Browser Notifications**: Optional push notifications for important alerts

### User Interface
- **Clean Dashboard**: Intuitive overview showing balance, budgets, and recent transactions
- **Visual Progress Bars**: Easy-to-understand budget progress indicators
- **Interactive Charts**: Doughnut chart showing spending patterns by category
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Modern Styling**: Beautiful gradients, smooth animations, and professional design

### Technical Features
- **Secure Local Storage**: All financial data stored securely in your browser
- **Offline Capability**: Service worker enables expense entry without internet connection
- **Data Export**: Export all your financial data as JSON for backup or analysis
- **Real-time Updates**: Instant updates across all components when data changes
- **Filter & Search**: Advanced filtering for transactions by category, type, and date range

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Python 3.x (for local development server)

### Installation
1. Download or clone the project files
2. Open a terminal in the project directory
3. Start the local server:
   ```bash
   python -m http.server 8000
   ```
4. Open your browser and navigate to `http://localhost:8000`

### First Time Setup
1. **Add Your First Transaction**: Click "Add Transaction" to record income or expenses
2. **Set Budgets**: Click "Manage Budgets" to set spending limits for categories
3. **Configure Alerts**: Click "Settings" to customize notification preferences
4. **Enable Notifications**: Allow browser notifications for real-time alerts

## 📱 How to Use

### Adding Transactions
1. Click the "Add Transaction" button
2. Select transaction type (Income or Expense)
3. Enter the amount and select a category
4. Add an optional description
5. Set the date and save

### Managing Budgets
1. Click "Manage Budgets"
2. Select a category and set your budget amount
3. Choose between monthly or weekly periods
4. View and manage existing budgets

### Viewing Reports
- **Dashboard**: See your balance, budget progress, and recent transactions
- **Spending Chart**: Visual breakdown of expenses by category
- **All Transactions**: Detailed view with filtering options

### Settings & Preferences
- **Low Balance Threshold**: Set when to receive balance warnings
- **Overspending Alerts**: Choose at what percentage to get budget warnings
- **Notifications**: Enable/disable browser notifications
- **Data Management**: Export data or clear all information

## 🎨 Features Showcase

### Dashboard Overview
- **Current Balance**: Large, prominent display with color coding
- **Income vs Expenses**: Clear breakdown of your financial flow
- **Budget Categories**: Visual cards showing spending progress
- **Recent Transactions**: Quick view of latest financial activity

### Smart Alerts
- **Color-coded Warnings**: Green (safe), Yellow (approaching limit), Red (over budget)
- **Percentage Indicators**: Clear progress percentages on budget cards
- **Real-time Notifications**: Instant alerts for important financial events

### Data Visualization
- **Interactive Charts**: Hover for detailed spending information
- **Progress Bars**: Visual representation of budget usage
- **Responsive Design**: Adapts beautifully to any screen size

## 🔧 Technical Details

### Architecture
- **Frontend**: Pure HTML5, CSS3, and JavaScript (ES6+)
- **Charts**: Chart.js for beautiful data visualizations
- **Icons**: Font Awesome for consistent iconography
- **Storage**: Browser localStorage for data persistence
- **Offline**: Service Worker for offline functionality

### Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### Data Security
- All data stored locally in your browser
- No external servers or data transmission
- Complete privacy and control over your financial information

## 📊 Categories

### Expense Categories
- Groceries
- Utilities
- Entertainment
- Transportation
- Healthcare
- Shopping
- Dining
- Bills
- Other

### Income Categories
- Salary
- Freelance
- Investment
- Gift
- Other

## 🎯 Tips for Best Results

1. **Regular Updates**: Add transactions daily for accurate tracking
2. **Realistic Budgets**: Set achievable budget limits based on your spending patterns
3. **Use Categories**: Properly categorize transactions for meaningful insights
4. **Review Charts**: Check the spending chart monthly to identify trends
5. **Export Data**: Regularly backup your data using the export feature

## 🔄 Future Enhancements

Potential features for future versions:
- Bill reminder system with recurring transactions
- Savings goal tracking with progress indicators
- Multiple account support
- Advanced reporting and analytics
- Data import from bank statements
- Cloud synchronization options

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Support

For questions or issues:
1. Check the browser console for any error messages
2. Ensure JavaScript is enabled in your browser
3. Try clearing browser cache and reloading the page
4. Verify that localStorage is available and not disabled

---

**Enjoy managing your finances with Janet's Budget App!** 🎉