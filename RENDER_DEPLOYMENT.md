# Render Deployment Guide

## Prerequisites

1. **Render Account** - Create account at [render.com](https://render.com)
2. **GitHub Repository** - Push your code to GitHub
3. **API Keys Ready:**
   - Pinecone API Key
   - Mistral API Key

## Step-by-Step Deployment

### 1. Deploy Backend Service

1. **New Service** → Web Service
2. Connect GitHub repository
3. Configuration:
   - **Name:** `ai-knowledge-assistant` (or your preferred name)
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start` (in backend directory)
   - **Root Directory:** `backend`

### 2. Set Environment Variables

In Render Dashboard → Your Service → Environment:

```
PINECONE_API_KEY=your_actual_pinecone_api_key
MISTRAL_API_KEY=your_actual_mistral_api_key
PINECONE_INDEX_NAME=ai-knowledge-assistant-v2
PINECONE_DIMENSION=1536
PINECONE_METRIC=cosine
PINECONE_SERVERLESS_CLOUD=aws
PINECONE_SERVERLESS_REGION=us-east-1
PINECONE_NAMESPACE=default
MISTRAL_CHAT_MODEL=mistral-small
MISTRAL_EMBED_MODEL=mistral-embed
PORT=4000
NODE_ENV=production
```

### 3. Deploy Frontend Service

1. **New Service** → Static Site
2. Connect GitHub repository
3. Configuration:
   - **Name:** `ai-knowledge-assistant-frontend`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`

### 4. Connect Frontend to Backend

1. After both services are deployed, note your backend URL:
   ```
   https://ai-knowledge-assistant-xxxx.onrender.com
   ```

2. In frontend deployment settings → Environment:
   ```
   VITE_API_BASE=https://ai-knowledge-assistant-xxxx.onrender.com
   ```

3. Redeploy frontend with this environment variable

## Troubleshooting

### Upload Returns 500 Error

**Issue:** `POST https://your-backend.onrender.com/api/upload 500 (Internal Server Error)`

**Solutions:**

1. **Check Environment Variables**
   - Verify all API keys are set correctly
   - Check for typos in variable names
   - Ensure no extra spaces in values

2. **Check Logs**
   ```bash
   Render Dashboard → Your Service → Logs
   ```
   Look for:
   - `[ERROR] PINECONE_API_KEY not set`
   - `[ERROR] MISTRAL_API_KEY not set`
   - `[UPLOAD] Indexing error`

3. **Verify Pinecone Connection**
   - Test API key validity
   - Ensure index exists in Pinecone
   - Check API key permissions

4. **Verify Mistral Connection**
   - Test API key validity
   - Ensure API key has embedding and chat permissions

5. **Check File Permissions**
   - Render has limited `/tmp` directory
   - System uses `uploadsDir` for temporary files
   - Files are deleted after processing

### Solve with Environment Variable Issues

If seeing "PINECONE_API_KEY not set":

1. Go to Render Dashboard
2. Select your backend service
3. Environment tab
4. Add missing variables
5. Click "Save Changes" (auto-deploys)

## Common Issues

### CORS Errors in Frontend

**Problem:** Frontend requests fail with CORS error

**Solution:** Backend already has CORS enabled with:
```javascript
app.use(cors());
```

If still seeing CORS errors:
- Clear browser cache
- Check that `VITE_API_BASE` is set in frontend
- Ensure backend URL is fully qualified (with https://)

### Files Not Uploading

**Symptoms:**
- Upload seems to hang
- 500 error after timeout
- "File upload failed" message

**Causes:**
- Backend `uploads/` directory doesn't exist
- Insufficient disk space
- Pinecone timeout
- Missing API keys

**Fix:**
- Verify all environment variables are set
- Check backend logs for specific errors
- Try with smaller files first
- Check Pinecone status

### Database Connection Issues

**Symptoms:**
- All API calls return 500
- Logs show Pinecone errors

**Solutions:**
```bash
1. Verify PINECONE_API_KEY
2. Check Pinecone dashboard for index status
3. Ensure INDEX_NAME matches actual index name
4. Test with curl: curl -X GET https://pinecone.io/api/health
```

## Monitoring

### Check Service Health

```bash
GET https://your-backend.onrender.com/api/health
```

Expected response:
```json
{
  "success": true,
  "status": "ok",
  "index": "ai-knowledge-assistant-v2"
}
```

### View Logs

Render Dashboard → Your Service → Logs

Look for messages like:
```
[UPLOAD] File: document.pdf, size: 245632, path: /tmp/xyz123
[UPLOAD] Extracted 5234 chars from document.pdf
[UPLOAD] Successfully indexed document.pdf with 12 chunks
```

## Performance Tips

### File Upload Optimization

- Max file size: 50MB
- Supported formats: PDF, DOCX, TXT, MD, HTML
- Processing time: ~1 second per MB
- Embedding generation: ~2-5 seconds per file

### Query Optimization

- Single query: topK=5 (fast)
- Compare: topK=100 (slower, covers more docs)
- LLM response: 2-10 seconds

### Cost Optimization

- Render free tier: Good for testing
- Paid tier: Recommended for production
- Pinecone: Serverless pricing (consumption-based)
- Mistral: Pay-per-API-call

## Redeploy Steps

After making code changes:

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "fix: issue description"
   git push
   ```

2. **Render Auto-Deploy**
   - Render automatically detects push
   - Rebuilds and redeploys automatically
   - Check "Deployments" tab for status

3. **Manual Redeploy**
   - Render Dashboard → Your Service
   - Click "Manual Deploy" → "Clear build cache & deploy"

## Environment Configuration Reference

### Required Variables
- `PINECONE_API_KEY` - Pinecone API authentication
- `MISTRAL_API_KEY` - Mistral AI API authentication

### Optional Variables (with defaults)
- `PORT` - Default: 4000
- `NODE_ENV` - Default: development
- `PINECONE_INDEX_NAME` - Default: ai-knowledge-assistant-v2
- `PINECONE_DIMENSION` - Default: 1536
- `PINECONE_METRIC` - Default: cosine
- `MISTRAL_CHAT_MODEL` - Default: mistral-small
- `MISTRAL_EMBED_MODEL` - Default: mistral-embed

## Security Checklist

- [ ] API keys stored only in environment variables
- [ ] Frontend `.env` does NOT contain API keys
- [ ] Backend `.env` is in `.gitignore`
- [ ] No credentials in git history
- [ ] API rate limits are reasonable
- [ ] CORS is properly configured
- [ ] File upload size limits are enforced (50MB)

## Support Resources

- [Render Documentation](https://render.com/docs)
- [Pinecone Documentation](https://docs.pinecone.io)
- [Mistral AI Documentation](https://docs.mistral.ai)
- Project Issues & Bug Reports: Create GitHub Issue
