# YouTube OAuth2 Setup Guide

This guide will help you set up YouTube Data API v3 OAuth2 credentials for the Excalidraw video pipeline.

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **YouTube Data API v3**:
   - Go to "APIs & Services" → "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"

## Step 2: Create OAuth2 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Configure OAuth consent screen (if prompted):
   - Choose "External" user type
   - Fill in basic app information
   - Add your email as a test user
4. Create OAuth2 Client ID:
   - Application type: **Desktop application**
   - Name: "Excalidraw Video Pipeline"
   - Click "Create"

## Step 3: Download Credentials

1. Download the JSON credentials file
2. Rename it to `credentials.json`
3. Place it in the root directory of this project:
   ```
   /Users/speed/Downloads/excalidraw-video-pipeline/credentials.json
   ```

## Step 4: Configure OAuth2 Scopes

The application uses these scopes (already configured):
- `https://www.googleapis.com/auth/youtube.upload` - Upload videos
- `https://www.googleapis.com/auth/youtube.force-ssl` - Full access

## Step 5: Run Authorization Flow

1. Run the pipeline:
   ```bash
   node src/index.js
   ```

2. The application will display an authorization URL
3. Copy the URL and open it in your browser
4. Sign in with your Google account
5. Grant permissions to the application
6. Copy the authorization code from the redirect
7. Create an authorize script to handle the code:

```javascript
// src/upload/authorize.js
import { YouTubeUploader } from './youtubeUploader.js';

async function authorize() {
    const code = process.argv[2];
    if (!code) {
        console.error('Usage: node src/upload/authorize.js [authorization_code]');
        process.exit(1);
    }

    try {
        const uploader = new YouTubeUploader();
        await uploader.initialize();
        await uploader.handleAuthCode(code);
        console.log('✅ Authorization completed! You can now upload videos.');
    } catch (error) {
        console.error('❌ Authorization failed:', error.message);
    }
}

authorize();
```

## Step 6: Complete Authorization

Run the authorize script with your code:
```bash
node src/upload/authorize.js YOUR_AUTHORIZATION_CODE
```

This will create a `token.json` file with your refresh token for future uploads.

## Security Notes

- Keep `credentials.json` and `token.json` secure and private
- Add both files to `.gitignore`
- Never commit these files to version control
- The refresh token allows ongoing access without re-authorization

## Channel Requirements

Your YouTube channel (@jmanhype1) needs:
- Verified phone number
- No live streaming restrictions in the past 90 days
- Channel in good standing

## Upload Limits

- **Daily uploads**: 50 videos per day
- **API quota**: 10,000 units per day (default)
- **Upload cost**: ~1,600 quota units per video

## Troubleshooting

### "Credentials file not found"
- Ensure `credentials.json` is in the project root
- Check file permissions

### "redirect_uri_mismatch"
- Verify redirect URI in Google Cloud Console
- Should be set to `urn:ietf:wg:oauth:2.0:oob` for desktop apps

### "insufficient_scope"
- Ensure YouTube Data API v3 is enabled
- Check OAuth consent screen configuration

## Testing

Once configured, test the upload:
```bash
node src/index.js
```

The pipeline will:
1. ✅ Parse Excalidraw file with timestamps
2. ✅ Generate animation using dai-shi/excalidraw-animate approach
3. ✅ Create YouTube-optimized video with FFmpeg
4. ✅ Upload to https://www.youtube.com/@jmanhype1

## Context7 Integration

This setup was created using **Context7 MCP server** for up-to-date YouTube Data API v3 documentation, ensuring:
- Current OAuth2 best practices
- Latest API requirements
- Security recommendations
- Real-time documentation accuracy