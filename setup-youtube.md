# YouTube Upload Setup Guide

This guide will help you set up YouTube Data API v3 integration for automatic video uploads.

## Prerequisites

1. **Google Cloud Project**: You need a Google Cloud project with YouTube Data API v3 enabled
2. **OAuth2 Credentials**: Download OAuth2 credentials for a desktop application
3. **YouTube Channel**: Access to the YouTube channel where you want to upload videos

## Step 1: Enable YouTube Data API v3

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Library**
4. Search for "YouTube Data API v3" and enable it
5. Go to **APIs & Services** > **Credentials**

## Step 2: Create OAuth2 Credentials

1. Click **Create Credentials** > **OAuth client ID**
2. Choose **Desktop application** as the application type
3. Name your OAuth client (e.g., "Excalidraw Video Pipeline")
4. Download the credentials JSON file
5. Save it as `credentials.json` in the project root directory

## Step 3: Configure Scopes

The application requires the following OAuth2 scope:
- `https://www.googleapis.com/auth/youtube.upload` - Upload videos to YouTube

## Step 4: First-Time Authorization

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the pipeline to trigger authorization:
   ```bash
   npm start
   ```

3. When prompted, visit the authorization URL and grant permissions
4. Copy the authorization code and run:
   ```bash
   node src/upload/authorize.js [YOUR_AUTH_CODE]
   ```

5. The token will be saved to `token.json` for future use

## Step 5: Upload Limits

- **Daily Upload Limit**: 50 videos per day per channel
- **API Quota**: 10,000 units per day (default)
- **Upload Cost**: ~1,600 quota units per video

## Security Notes

- Keep `credentials.json` and `token.json` secure and private
- Add them to `.gitignore` to prevent accidental commits
- The refresh token allows long-term access without re-authorization

## Channel Information

After setup, you can verify the connection:
```bash
node -e "
import('./src/upload/youtubeUploader.js').then(async ({ YouTubeUploader }) => {
  const uploader = new YouTubeUploader();
  await uploader.initialize();
  await uploader.getChannelInfo();
});
"
```

This will display your channel name, subscriber count, and upload statistics.