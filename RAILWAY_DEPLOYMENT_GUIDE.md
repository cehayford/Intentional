# Railway Deployment Guide

This guide provides comprehensive instructions for deploying the Intentional application to Railway with high-level deployment logic, blue-green deployments, and automated rollback capabilities.

## 🚀 **Quick Start**

### Prerequisites
- Railway account and API token
- GitHub repository with the code
- Required secrets configured in GitHub

### Required GitHub Secrets
Add these secrets to your GitHub repository settings:

```bash
RAILWAY_TOKEN=your_railway_api_token
```

### One-Click Deployment
1. Push code to `main` branch
2. GitHub Actions will automatically deploy to staging
3. Manual approval required for production deployment

## 📁 **Project Structure**

```
intentional/
├── frontend/
│   ├── railway.toml           # Frontend Railway configuration
│   ├── Dockerfile              # Optimized for Railway
│   └── src/
├── backend/
│   ├── railway.toml           # Backend Railway configuration
│   ├── Dockerfile              # Optimized for Railway
│   └── src/
├── scripts/
│   ├── railway-deploy.sh       # High-level deployment script
│   ├── health-check.sh         # Comprehensive health monitoring
│   ├── rollback.sh             # Automated rollback script
│   └── init-db.sql             # Database initialization
├── .github/workflows/
│   ├── deploy-frontend.yml     # Frontend deployment workflow
│   ├── deploy-backend.yml      # Backend deployment workflow
│   └── ci.yml                  # CI pipeline
├── railway-environments.json   # Environment configuration
└── docker-compose.yml          # Local development
```

## 🌍 **Environments**

### Staging Environment
- **URL**: `https://intentional-staging.railway.app`
- **Database**: Staging PostgreSQL instance
- **Auto-deployment**: Enabled on push to main
- **Health checks**: Comprehensive monitoring

### Production Environment
- **URL**: `https://intentional-app.railway.app`
- **Database**: Production PostgreSQL instance
- **Auto-deployment**: Manual approval required
- **Blue-green deployment**: Zero downtime

## 🔧 **Deployment Strategies**

### 1. Standard Deployment
```bash
# Deploy to staging
./scripts/railway-deploy.sh staging all 300 true

# Deploy to production
./scripts/railway-deploy.sh production all 300 true
```

### 2. Blue-Green Deployment (Production Only)
- Creates temporary environment
- Deploys and tests new version
- Swaps to production if healthy
- Automatic rollback on failure

### 3. Manual Deployment via GitHub Actions
1. Go to Actions tab in GitHub
2. Select "Deploy Frontend to Railway" or "Deploy Backend to Railway"
3. Click "Run workflow"
4. Choose environment and options

## 🏥 **Health Checks**

### Frontend Health Checks
- **Endpoint**: `/health`
- **Response**: `200 OK` with "healthy" status
- **Frequency**: Every 30 seconds
- **Timeout**: 3 seconds

### Backend Health Checks
- **Endpoint**: `/health`
- **Database Check**: `/health/db`
- **Redis Check**: `/health/redis`
- **Frequency**: Every 30 seconds
- **Timeout**: 3 seconds

### Comprehensive Health Monitoring
```bash
# Run full health check
./scripts/health-check.sh staging all 300 10

# Check specific service
./scripts/health-check.sh production frontend 300 10
```

## 🔄 **Rollback Procedures**

### Automatic Rollback
- Triggered on health check failures
- Database migrations rolled back automatically
- Service restored to previous version

### Manual Rollback
```bash
# Rollback specific service
./scripts/rollback.sh production frontend "Performance issues" true

# Rollback all services
./scripts/rollback.sh staging all "Deployment failed" true

# Force rollback without confirmation
./scripts/rollback.sh production backend "Critical bug" true
```

### Rollback Features
- **Checkpoint creation**: Before rollback
- **Deployment history**: Track all changes
- **Health verification**: Post-rollback validation
- **Logging**: Complete rollback audit trail

## 📊 **Monitoring & Alerting**

### Resource Monitoring
- CPU usage alerts at 80%
- Memory usage alerts at 85%
- Response time alerts at 2000ms
- Error rate alerts at 5%

### Health Metrics
```bash
# View service metrics
railway metrics --environment production

# Check service status
railway status --environment production

# View deployment history
railway history --environment production
```

### Alert Configuration
Configure alerts in Railway dashboard:
- Service health failures
- High resource usage
- Database connection issues
- Deployment failures

## 🗄️ **Database Management**

### Database Migrations
```bash
# Run migrations
railway run "npm run migration:run" --environment production

# Rollback migrations
railway run "npm run migration:rollback" --environment production

# Check migration status
railway run "npm run migration:show" --environment production
```

### Database Backups
- **Frequency**: Daily at 2 AM UTC
- **Retention**: 30 days
- **Point-in-time recovery**: Enabled
- **Automated restoration**: On rollback

### Database Health
```bash
# Check database connectivity
curl -f https://intentional-api.railway.app/health/db

# Check Redis connectivity
curl -f https://intentional-api.railway.app/health/redis
```

## 🔐 **Security Configuration**

### Environment Variables
```json
{
  "NODE_ENV": "production",
  "DATABASE_URL": "${RAILWAY_DATABASE_URL}",
  "JWT_SECRET": "${RAILWAY_SECRET_JWT}",
  "REDIS_URL": "${RAILWAY_REDIS_URL}",
  "FRONTEND_URL": "https://intentional-app.railway.app",
  "BACKEND_URL": "https://intentional-api.railway.app"
}
```

### Security Features
- **SSL/TLS**: Automatic HTTPS
- **Secret management**: Railway environment variables
- **Network isolation**: Private networking
- **Access control**: Environment protection rules

## 🚀 **Performance Optimization**

### Scaling Configuration
```json
{
  "frontend": {
    "minInstances": 1,
    "maxInstances": 10,
    "targetMemoryPercent": 70,
    "targetCpuPercent": 80
  },
  "backend": {
    "minInstances": 1,
    "maxInstances": 20,
    "targetMemoryPercent": 75,
    "targetCpuPercent": 70
  }
}
```

### Caching Strategy
- **Redis**: Session storage and caching
- **Nginx**: Static asset caching
- **Database**: Connection pooling
- **CDN**: Automatic for static assets

## 🔧 **Local Development**

### Setup Local Environment
```bash
# Start all services
docker-compose up -d

# Start with production-like setup
docker-compose --profile production up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Local Health Checks
```bash
# Check frontend
curl http://localhost:3000/health

# Check backend
curl http://localhost:3001/health

# Check database
curl http://localhost:3001/health/db
```

## 📋 **Troubleshooting**

### Common Issues

#### 1. Health Check Failures
```bash
# Check service logs
railway logs --environment production

# Run manual health check
./scripts/health-check.sh production all 600 5

# Check resource usage
railway metrics --environment production
```

#### 2. Database Connection Issues
```bash
# Test database connection
railway run "psql $DATABASE_URL -c 'SELECT 1'" --environment production

# Check database logs
railway logs postgres --environment production

# Restart database service
railway restart postgres --environment production
```

#### 3. Deployment Failures
```bash
# Check deployment logs
railway logs --environment production

# View deployment status
railway status --environment production

# Manual rollback
./scripts/rollback.sh production all "Deployment failed" true
```

### Debug Mode
Enable debug logging:
```bash
# Set debug environment variable
export DEBUG=true

# Run deployment with debug
./scripts/railway-deploy.sh staging all 600 true
```

## 📞 **Support**

### Getting Help
- **Railway Documentation**: https://docs.railway.app/
- **GitHub Issues**: Create issue in repository
- **Monitoring**: Check Railway dashboard
- **Logs**: Use `railway logs` command

### Emergency Procedures
1. **Immediate rollback**: Use rollback script
2. **Service restoration**: Check health checks
3. **Data recovery**: Use database backups
4. **Communication**: Notify team members

---

## 🎯 **Best Practices**

1. **Always test in staging** before production
2. **Monitor health checks** after deployment
3. **Keep secrets secure** in Railway environment
4. **Use blue-green deployment** for zero downtime
5. **Monitor resource usage** and scaling
6. **Regular database backups** and testing
7. **Comprehensive logging** for debugging
8. **Automated rollback** on failures

This deployment setup provides enterprise-grade reliability, monitoring, and scalability for your Intentional application on Railway! 🚀
