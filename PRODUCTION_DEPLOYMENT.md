# Production Deployment Guide

## Overview
This guide covers deploying the Intentional Spending Tracker to production mode.

## Prerequisites

### Environment Setup
- ✅ Docker and Docker Compose installed
- ✅ Railway CLI installed (`npm install -g @railway/cli`)
- ✅ Railway account and project configured
- ✅ Domain names configured (if using custom domains)

### Security Requirements
- 🔒 Secure JWT secret (32+ characters)
- 🔒 Database password (strong password)
- 🔒 HTTPS certificates (for custom domains)
- 🔒 Environment variables secured

## Deployment Options

### Option 1: Railway Deployment (Recommended)

#### Frontend Deployment
```bash
# Deploy frontend to production
cd frontend
railway up --environment production

# Or use the deployment script
./scripts/railway-deploy.sh production frontend
```

#### Backend Deployment
```bash
# Deploy backend to production
cd backend
railway up --environment production

# Or use the deployment script
./scripts/railway-deploy.sh production backend
```

#### Full Production Deployment
```bash
# Deploy all services with blue-green strategy
./scripts/railway-deploy.sh production all 300 true
```

### Option 2: Self-Hosted with Docker

#### Local Production Deployment
```bash
# Copy environment template
cp .env.production .env.local

# Edit .env.local with your values
nano .env.local

# Deploy with Docker Compose
./scripts/deploy-production.sh
```

#### Cloud Server Deployment
```bash
# On your production server:
git clone <your-repo>
cd intentional

# Configure environment
cp .env.production .env
nano .env  # Update with production values

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

## Environment Configuration

### Production Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname
POSTGRES_DB=intentional
POSTGRES_USER=intentional
POSTGRES_PASSWORD=secure-password

# Security
JWT_SECRET=your-super-secure-jwt-secret-32-chars-minimum

# Services
REDIS_URL=redis://redis:6379
FRONTEND_URL=https://your-domain.com
NODE_ENV=production
```

### Railway Environment Variables
Set these in your Railway dashboard:

**Frontend Service:**
- `NODE_ENV=production`
- `REACT_APP_API_URL=https://your-backend-url.railway.app`

**Backend Service:**
- `NODE_ENV=production`
- `DATABASE_URL=${{RAILWAY_DATABASE_URL}}`
- `JWT_SECRET=${{RAILWAY_SECRET_JWT}}`
- `REDIS_URL=${{RAILWAY_REDIS_URL}}`
- `FRONTEND_URL=https://your-frontend-url.railway.app`

## Health Checks

### Frontend Health Check
```bash
curl https://your-frontend-url/health
# Expected: "healthy\n"
```

### Backend Health Check
```bash
curl https://your-backend-url/health
# Expected: JSON with status, timestamp, uptime, environment
```

## Monitoring and Logging

### Railway Monitoring
- Built-in metrics and logging
- Error tracking
- Performance monitoring
- Resource usage tracking

### Self-Hosted Monitoring
```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Check resource usage
docker stats
```

## Security Checklist

### ✅ Before Going Live
- [ ] Change all default passwords
- [ ] Use strong JWT secret
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up domain validation
- [ ] Enable rate limiting
- [ ] Configure backup strategy
- [ ] Set up monitoring alerts

### 🔒 Security Headers
The application includes these security headers:
- X-Frame-Options: SAMEORIGIN
- X-XSS-Protection: 1; mode=block
- X-Content-Type-Options: nosniff
- Referrer-Policy: no-referrer-when-downgrade
- Content-Security-Policy: default-src 'self' https: data: blob: 'unsafe-inline'

## Performance Optimization

### Frontend Optimizations
- ✅ Static asset caching (1 year)
- ✅ Gzip compression
- ✅ Minified bundles
- ✅ Code splitting
- ✅ Lazy loading

### Backend Optimizations
- ✅ Database connection pooling
- ✅ Redis caching
- ✅ Response compression
- ✅ Health checks
- ✅ Graceful shutdown

## Backup and Recovery

### Database Backups
```bash
# PostgreSQL backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore backup
psql $DATABASE_URL < backup-20240402.sql
```

### Railway Backups
- Automatic daily backups
- Point-in-time recovery
- Manual backup creation

## Rollback Procedures

### Railway Rollback
```bash
# Rollback frontend
railway rollback --service frontend --environment production

# Rollback backend
railway rollback --service backend --environment production
```

### Docker Rollback
```bash
# Stop current deployment
docker-compose -f docker-compose.prod.yml down

# Deploy previous version
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### Common Issues

#### Frontend Not Loading
1. Check environment variables
2. Verify build completed successfully
3. Check nginx configuration
4. Review health check logs

#### Backend API Errors
1. Verify database connection
2. Check JWT secret configuration
3. Review service logs
4. Test health endpoint

#### Database Connection Issues
1. Verify DATABASE_URL format
2. Check database service status
3. Review network configuration
4. Test connection manually

### Debug Commands
```bash
# Check service logs
docker-compose -f docker-compose.prod.yml logs service-name

# Test API endpoints
curl -X POST https://your-backend-url/api/v1/auth/health

# Check environment variables
railway variables --environment production
```

## Deployment Verification

### Post-Deployment Checklist
- [ ] Frontend loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] API endpoints respond
- [ ] Database connectivity confirmed
- [ ] Redis caching works
- [ ] Health checks pass
- [ ] SSL certificates valid
- [ ] Performance acceptable
- [ ] Monitoring configured

## Support

### Emergency Contacts
- Railway Support: https://railway.app/support
- Documentation: https://docs.railway.app
- Status Page: https://status.railway.app

### Additional Resources
- Railway Deployment Guide
- Docker Documentation
- Nginx Configuration Guide
- PostgreSQL Documentation
