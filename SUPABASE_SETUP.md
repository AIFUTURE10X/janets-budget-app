# Supabase Setup Guide for Budget App

## Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Enter project name (e.g., "budget-app")
5. Enter a strong database password
6. Select a region close to your users
7. Click "Create new project"

## Step 2: Get API Keys

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project-id.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

## Step 3: Configure the App

1. Open `supabase-config.js` in your project
2. Replace the placeholder values:

```javascript
// Replace these with your actual Supabase credentials
const SUPABASE_CONFIG = {
    url: 'https://your-project-id.supabase.co',  // Your Project URL
    anonKey: 'your-anon-key-here',               // Your anon public key
    // ... rest of config
};
```

## Step 4: Set Up Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase-schema.sql`
3. Paste it into the SQL Editor
4. Click "Run" to create all tables and policies

## Step 5: Configure Row Level Security (RLS)

The schema includes RLS policies, but you may need to enable them:

1. Go to **Authentication** > **Policies**
2. Ensure RLS is enabled for all tables:
   - `user_devices`
   - `transactions`
   - `budgets`
   - `categories`
   - `settings`
   - `sync_logs`

## Step 6: Test the Integration

1. Open your budget app in a browser
2. Check the browser console for messages like:
   - "Supabase sync initialized successfully"
   - "Syncing to cloud..."
   - "Synced to cloud"

## Step 7: Test Cross-Device Sync

1. Open the app on two different devices/browsers
2. Add a transaction on one device
3. Click "Force Sync" on the other device
4. Verify the transaction appears on both devices

## Troubleshooting

### Common Issues:

1. **"Supabase not configured"**
   - Check that your API keys are correctly set in `supabase-config.js`
   - Ensure the file is being loaded (check browser Network tab)

2. **"Cloud sync failed"**
   - Check browser console for detailed error messages
   - Verify your Supabase project is active and accessible
   - Check that RLS policies are properly configured

3. **"Authentication failed"**
   - The app uses anonymous authentication by default
   - Check that anonymous sign-ins are enabled in Supabase Auth settings

### Enable Anonymous Authentication:

1. Go to **Authentication** > **Settings**
2. Scroll to "Auth Providers"
3. Ensure "Enable anonymous sign-ins" is checked

## Security Notes

- The app uses Row Level Security (RLS) to ensure users can only access their own data
- Each device gets a unique identifier for data isolation
- Anonymous authentication is used for simplicity, but you can extend this to use email/password authentication

## Next Steps

Once basic sync is working, you can:
- Add user registration/login for persistent accounts
- Implement real-time sync for instant updates
- Add data export/import features
- Set up backup and recovery options