# YouTube Upload Setup Guide

## Quick Manual Upload
Your video is ready at: `output/youtube-ready.mp4`
Just drag it to https://studio.youtube.com

## For Automated Upload (OAuth)

### 1. Create Google Cloud Project
1. Go to https://console.cloud.google.com
2. Create new project or select existing
3. Enable "YouTube Data API v3"

### 2. Create OAuth Credentials
1. Go to APIs & Services > Credentials
2. Create Credentials > OAuth client ID
3. Application type: Web application
4. Add authorized redirect URI: `http://localhost:3333/oauth2callback`
5. Download the credentials

### 3. Update the Script
Edit `youtube-oauth-upload.js` and replace:
- CLIENT_ID with your client ID
- CLIENT_SECRET with your client secret

### 4. Run Upload
```bash
node youtube-oauth-upload.js
```

## Why This is Complex
Google requires personal authentication for YouTube uploads to prevent spam and abuse. There's no way around the OAuth dance - even The Everything Agent has to respect Google's security.

## The Easy Way
Just drag `output/youtube-ready.mp4` to YouTube Studio. The video is perfectly encoded and ready!