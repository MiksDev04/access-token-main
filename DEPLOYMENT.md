# 🚀 Deploy to Vercel

## Quick Deploy

1. **Install Vercel CLI** (optional, for local testing)
   ```bash
   npm install -g vercel
   ```

2. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

3. **Deploy via Vercel Dashboard**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables (see below)
   - Click "Deploy"

## Environment Variables Setup

Add these in Vercel Dashboard → Project Settings → Environment Variables:

### `FIREBASE_SERVICE_ACCOUNT`
- Open your `private-key.json` file
- Copy the **entire content** as a single line
- Paste it as the value (no quotes needed in Vercel UI)

### `FIREBASE_PROJECT_ID`
- Your Firebase project ID (e.g., `nosql-demo-e5885`)

## Testing Locally

1. Create `.env.local` file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your values

3. Install Vercel CLI and run:
   ```bash
   vercel dev
   ```

## API Endpoints

Once deployed, your endpoints will be:

- `GET https://your-app.vercel.app/health`
- `GET https://your-app.vercel.app/api/token`
- `GET https://your-app.vercel.app/api/firestore/:collection`
- `GET https://your-app.vercel.app/api/firestore/:collection/:documentId`
- `POST https://your-app.vercel.app/api/firestore/:collection/:documentId`
- `DELETE https://your-app.vercel.app/api/firestore/:collection/:documentId`

## Example Usage

```bash
# Get access token
curl https://your-app.vercel.app/api/token

# Get all users
curl https://your-app.vercel.app/api/firestore/users

# Get specific user
curl https://your-app.vercel.app/api/firestore/users/user123

# Create/update user
curl -X POST https://your-app.vercel.app/api/firestore/users/user123 \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","age":30}'

# Delete user
curl -X DELETE https://your-app.vercel.app/api/firestore/users/user123
```

## Important Notes

- **Never commit `private-key.json`** to Git (already in .gitignore)
- The `.vercelignore` file prevents sensitive files from being uploaded
- Tokens are cached for 1 hour with a 5-minute buffer
- CORS is enabled for all origins (restrict in production if needed)
- Cold starts may take 1-2 seconds to generate a new token

## Troubleshooting

**Error: "Failed to get access token"**
- Check that `FIREBASE_SERVICE_ACCOUNT` is properly formatted JSON
- Verify the service account has necessary permissions in Firebase Console

**Error: 404 on routes**
- Check `vercel.json` is deployed
- Verify the route matches the endpoint patterns

**Slow first request**
- This is normal due to Vercel serverless cold starts
- Subsequent requests will be faster with cached tokens
