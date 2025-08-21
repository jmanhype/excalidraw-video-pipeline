# Fix YouTube Upload - Add Test User

## Quick Fix (30 seconds)

1. Go to: https://console.cloud.google.com
2. Select your project
3. Navigate to: **APIs & Services** → **OAuth consent screen**
4. Scroll to **Test users** section
5. Click **+ ADD USERS**
6. Add: `straughterguthrie@gmail.com`
7. Click **SAVE**

## Then run:
```bash
node youtube-oauth-upload.js
```

It will open your browser, you'll sign in, and the video will upload automatically!

## Why this happens
Google requires OAuth apps in "Testing" mode to explicitly list allowed test users. This prevents random people from using your OAuth credentials.