# Vercel Deployment Guide

## Quick Deploy to Vercel

### 1. Prerequisites
- Vercel account
- PostgreSQL database (Neon, Supabase, or Vercel Postgres)
- Google Gemini API key

### 2. Environment Variables
Set these in your Vercel dashboard:

```
DATABASE_URL=postgresql://username:password@host:port/database
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=production
```

### 3. Database Setup
1. Create a PostgreSQL database
2. Run database migrations:
   ```bash
   npm run db:push
   ```

### 4. Deploy to Vercel

#### Option A: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add GEMINI_API_KEY
```

#### Option B: GitHub Integration
1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Vercel will auto-detect the configuration from `vercel.json`

### 5. Build Configuration
The `vercel.json` file is already configured with:
- **Root Directory:** `./`
- **Build Command:** `npm run build`
- **Output Directory:** `dist/public`
- **Node.js Runtime:** Latest

### 6. File Structure
```
/
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types
├── vercel.json      # Vercel configuration
├── .vercelignore    # Files to ignore
└── package.json     # Dependencies
```

### 7. Routes Configuration
- `/api/*` → Express server
- `/uploads/*` → Static files
- `/*` → React app

### 8. Troubleshooting

#### Build Issues
- Ensure all dependencies are in `package.json`
- Check that `vercel.json` routes are correct
- Verify environment variables are set

#### Database Issues
- Check `DATABASE_URL` format
- Ensure database is accessible from Vercel
- Run migrations after deployment

#### API Issues
- Verify `GEMINI_API_KEY` is set
- Check server logs in Vercel dashboard
- Ensure file uploads directory exists

### 9. Post-Deployment
1. Test all API endpoints
2. Verify file uploads work
3. Check database connections
4. Test AI generation features

### 10. Monitoring
- Use Vercel dashboard for logs
- Monitor function execution time
- Check database performance
- Set up error tracking if needed
