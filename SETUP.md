# 🚀 Newroads Recruitment Agent - Setup & Deployment Guide

Welcome to the complete Newroads Recruitment Agent! This guide will help you set up and deploy a fully functional AI-powered recruitment platform.

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account
- Google AI Studio account (for Gemini API)
- Apify account (for Apollo scraping)
- Loxo CRM access (optional)

## 🏗️ Quick Setup (15 minutes)

### 1. Install Dependencies
```bash
npm install
npm install pdf-parse mammoth multiparty
```

### 2. Database Setup

**Step 1: Create Supabase Project**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for setup to complete

**Step 2: Enable Vector Extension**
1. Go to SQL Editor in Supabase dashboard
2. Run this command:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

**Step 3: Deploy Schema**
1. Copy the entire contents of `database-schema.sql`
2. Paste and execute in Supabase SQL Editor
3. Verify all tables are created (should see ~15 tables)

**Step 4: Configure Storage**
1. Go to Storage in Supabase dashboard
2. Create a new bucket named `candidate-cv`
3. Set bucket to public
4. Configure upload policies (allow authenticated uploads)

### 3. Environment Variables
Update `.env.local` with your credentials:

```bash
# Supabase (get from project settings)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini AI (get from ai.google.dev)
GOOGLE_GEMINI_API_KEY=your-gemini-api-key

# Apify (get from apify.com)
APIFY_API_TOKEN=your-apify-token
APOLLO_ACTOR_ID=code_crafter/apollo-io-scraper

# Loxo (optional - get from your Loxo account)
LOXO_API_KEY=your-loxo-api-key
LOXO_API_URL=https://api.loxo.co/v1

# Security
WEBHOOK_SECRET=your-secure-random-string

# Configuration
SUPABASE_STORAGE_BUCKET=candidate-cv
MAX_FILE_SIZE=10485760
```

### 4. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` - you should see the dashboard!

## 🧪 Testing the System

### 1. Upload a CV
1. Go to `/candidates`
2. Click "Upload CVs"
3. Upload a PDF or Word document
4. Check if candidate was created and text extracted

### 2. Test AI Search
1. Go to `/chat`
2. Try: "Find software engineers with React experience"
3. Verify AI responds and searches work

### 3. Test Apollo Integration
1. Go to `/scraping` (you'll need to create this page)
2. Start an Apollo scrape
3. Check webhook processing

## 🏭 Production Deployment

### Vercel Deployment (Recommended)

1. **Push to GitHub**
```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

2. **Deploy to Vercel**
- Connect GitHub repo to Vercel
- Add all environment variables in Vercel dashboard
- Deploy!

3. **Configure Webhooks**
Update webhook URLs to use your production domain:
```bash
WEBHOOK_URL=https://your-app.vercel.app/api/scrape/apollo/webhook
```

### Alternative Deployments
- **Railway**: `railway up`
- **Netlify**: Connect GitHub repo
- **Docker**: Use included Dockerfile

## 📊 System Features Overview

### Data Sources
- **Apollo.io**: Web scraping via Apify
- **Loxo CRM**: API sync (full/incremental)
- **CV Upload**: PDF/Word parsing with AI extraction
- **Manual Entry**: Direct candidate input

### AI Capabilities
- **Semantic Search**: Natural language queries
- **Vector Similarity**: 768-dimensional embeddings
- **Chat Interface**: Conversational recruitment assistant
- **Auto-extraction**: Skills, contact info from CVs
- **Deduplication**: Smart merging across sources

### Dashboard Analytics
- Real-time candidate statistics
- Source distribution tracking
- Processing pipeline monitoring
- AI completion rates

## 🔧 API Endpoints

### Core Endpoints
- `GET/POST /api/candidates` - Candidate management
- `POST /api/search/semantic` - AI-powered search
- `POST /api/upload/cv` - CV processing
- `GET /api/dashboard/stats` - Real-time metrics

### Integration Endpoints
- `POST /api/scrape/apollo/start` - Start Apollo scrape
- `POST /api/scrape/apollo/webhook` - Process scrape results
- `POST /api/sync/loxo/start` - Start Loxo sync
- `GET /api/sync/loxo/status` - Check sync progress

### AI & Processing
- `POST /api/embed/queue/run` - Process embedding jobs
- `GET/POST /api/chat/conversations` - Chat management
- `POST /api/chat/[id]/messages` - Send messages

## 🎯 Usage Examples

### Natural Language Search
```
"Find senior React developers in Amsterdam with 5+ years experience"
"Show me product managers from fintech companies"
"Backend engineers with Node.js and AWS experience"
```

### Bulk Operations
```javascript
// Start Apollo scrape
fetch('/api/scrape/apollo/start', {
  method: 'POST',
  body: JSON.stringify({
    searchUrl: 'https://app.apollo.io/...',
    maxResults: 1000
  })
})

// Process embedding queue
fetch('/api/embed/queue/run', {
  method: 'POST',
  body: JSON.stringify({ batchSize: 50 })
})
```

## 🔍 Troubleshooting

### Common Issues

**1. Vector Search Not Working**
- Verify pgvector extension is enabled
- Check if `match_candidates` function exists
- Ensure embeddings are generated

**2. CV Upload Fails**
- Check storage bucket permissions
- Verify file size limits
- Check PDF parsing dependencies

**3. Apollo Webhooks Not Processing**
- Verify webhook secret matches
- Check Apify actor configuration
- Review webhook URL accessibility

**4. Slow Search Performance**
- Check database indexes
- Monitor embedding completion rate
- Review query complexity

### Performance Optimization

**Database**
- Ensure proper indexes on search columns
- Monitor vector index performance
- Use connection pooling for high traffic

**AI Processing**
- Batch embedding jobs for efficiency
- Monitor Gemini API rate limits
- Implement caching for frequent queries

**Frontend**
- Enable React optimizations
- Implement virtual scrolling for large lists
- Use server-side rendering where appropriate

## 📈 Monitoring & Maintenance

### Key Metrics to Monitor
- Candidate ingestion rate
- Embedding completion percentage
- Search response times
- API error rates
- Storage usage

### Regular Maintenance
- Clean up failed embedding jobs
- Archive old conversations
- Monitor and rotate API keys
- Review and update RLS policies
- Backup database regularly

### Scaling Considerations
- Database connection limits
- API rate limiting
- Storage bucket policies
- Vector index optimization
- Caching strategies

## 🆘 Support & Resources

### Documentation
- [Supabase Docs](https://supabase.com/docs)
- [Google AI Docs](https://ai.google.dev/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Apify Docs](https://docs.apify.com)

### Community
- Create GitHub issues for bugs
- Join relevant Discord communities
- Check Stack Overflow for common issues

---

**🎉 Congratulations!** You now have a fully functional AI-powered recruitment platform. The system can handle thousands of candidates, perform semantic search, and provide intelligent insights to streamline your recruitment process.

Happy recruiting! 🚀