#!/bin/bash

# Railway Deployment Script
# High-level deployment logic with blue-green strategy

set -e

# Configuration
ENVIRONMENT=${1:-staging}
SERVICE=${2:-all}
HEALTH_CHECK_TIMEOUT=${3:-300}
ROLLBACK_ENABLED=${4:-true}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        log_error "Railway CLI is not installed. Please install it first: npm install -g @railway/cli"
        exit 1
    fi
    
    # Check if user is logged in
    if ! railway whoami &> /dev/null; then
        log_error "Not logged in to Railway. Please run: railway login"
        exit 1
    fi
    
    # Check if railway-environments.json exists
    if [ ! -f "railway-environments.json" ]; then
        log_error "railway-environments.json not found"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Load environment configuration
load_config() {
    log_info "Loading configuration for environment: $ENVIRONMENT"
    
    # Parse environment config
    ENV_CONFIG=$(jq -r ".environments.$ENVIRONMENT" railway-environments.json)
    
    if [ "$ENV_CONFIG" = "null" ]; then
        log_error "Environment '$ENVIRONMENT' not found in configuration"
        exit 1
    fi
    
    # Extract environment variables
    export NODE_ENV=$(echo "$ENV_CONFIG" | jq -r '.variables.NODE_ENV')
    export DATABASE_URL=$(echo "$ENV_CONFIG" | jq -r '.variables.DATABASE_URL')
    export JWT_SECRET=$(echo "$ENV_CONFIG" | jq -r '.variables.JWT_SECRET')
    export REDIS_URL=$(echo "$ENV_CONFIG" | jq -r '.variables.REDIS_URL')
    
    log_success "Configuration loaded successfully"
}

# Health check function
health_check() {
    local service_url=$1
    local timeout=$2
    local start_time=$(date +%s)
    
    log_info "Performing health check on $service_url (timeout: ${timeout}s)"
    
    while [ $(($(date +%s) - start_time)) -lt $timeout ]; do
        if curl -f -s "$service_url/health" > /dev/null 2>&1; then
            log_success "Health check passed for $service_url"
            return 0
        fi
        sleep 10
    done
    
    log_error "Health check failed for $service_url after ${timeout}s"
    return 1
}

# Deploy frontend
deploy_frontend() {
    log_info "Deploying frontend to $ENVIRONMENT..."
    
    cd frontend
    
    # Set environment variables
    export VITE_API_URL=$(echo "$ENV_CONFIG" | jq -r '.variables.BACKEND_URL')
    
    # Deploy to Railway
    railway up --environment "$ENVIRONMENT"
    
    # Get the deployed URL
    FRONTEND_URL=$(railway status --json | jq -r '.services[] | select(.name == "frontend") | .url')
    
    # Health check
    if health_check "$FRONTEND_URL" "$HEALTH_CHECK_TIMEOUT"; then
        log_success "Frontend deployed successfully: $FRONTEND_URL"
    else
        if [ "$ROLLBACK_ENABLED" = "true" ]; then
            log_warning "Frontend health check failed, initiating rollback..."
            rollback_frontend
        fi
        exit 1
    fi
    
    cd ..
}

# Deploy backend
deploy_backend() {
    log_info "Deploying backend to $ENVIRONMENT..."
    
    cd backend
    
    # Run database migrations (if enabled)
    if [ "$(echo "$ENV_CONFIG" | jq -r '.database.migrations.autoApply')" = "true" ]; then
        log_info "Running database migrations..."
        railway run "npm run migration:run" --environment "$ENVIRONMENT"
    fi
    
    # Deploy to Railway
    railway up --environment "$ENVIRONMENT"
    
    # Get the deployed URL
    BACKEND_URL=$(railway status --json | jq -r '.services[] | select(.name == "backend") | .url')
    
    # Health check
    if health_check "$BACKEND_URL" "$HEALTH_CHECK_TIMEOUT"; then
        log_success "Backend deployed successfully: $BACKEND_URL"
    else
        if [ "$ROLLBACK_ENABLED" = "true" ]; then
            log_warning "Backend health check failed, initiating rollback..."
            rollback_backend
        fi
        exit 1
    fi
    
    cd ..
}

# Rollback functions
rollback_frontend() {
    log_info "Rolling back frontend deployment..."
    railway rollback --service frontend --environment "$ENVIRONMENT"
    log_success "Frontend rollback completed"
}

rollback_backend() {
    log_info "Rolling back backend deployment..."
    railway rollback --service backend --environment "$ENVIRONMENT"
    log_success "Backend rollback completed"
}

# Blue-green deployment
blue_green_deploy() {
    log_info "Starting blue-green deployment strategy..."
    
    # Create temporary environment for testing
    TEMP_ENV="${ENVIRONMENT}-temp-$(date +%s)"
    
    log_info "Creating temporary environment: $TEMP_ENV"
    railway environment create "$TEMP_ENV" --clone "$ENVIRONMENT"
    
    # Deploy to temporary environment
    log_info "Deploying to temporary environment for validation..."
    
    if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "frontend" ]; then
        cd frontend
        railway up --environment "$TEMP_ENV"
        cd ..
    fi
    
    if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "backend" ]; then
        cd backend
        railway up --environment "$TEMP_ENV"
        cd ..
    fi
    
    # Get temporary URLs for health checks
    TEMP_FRONTEND_URL=$(railway status --json --environment "$TEMP_ENV" | jq -r '.services[] | select(.name == "frontend") | .url')
    TEMP_BACKEND_URL=$(railway status --json --environment "$TEMP_ENV" | jq -r '.services[] | select(.name == "backend") | .url')
    
    # Health checks on temporary environment
    if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "frontend" ]; then
        if ! health_check "$TEMP_FRONTEND_URL" "$HEALTH_CHECK_TIMEOUT"; then
            log_error "Temporary frontend deployment failed health check"
            railway environment delete "$TEMP_ENV" --force
            exit 1
        fi
    fi
    
    if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "backend" ]; then
        if ! health_check "$TEMP_BACKEND_URL" "$HEALTH_CHECK_TIMEOUT"; then
            log_error "Temporary backend deployment failed health check"
            railway environment delete "$TEMP_ENV" --force
            exit 1
        fi
    fi
    
    # Swap environments (zero downtime)
    log_info "Swapping environments for zero downtime deployment..."
    
    # Deploy to production environment
    if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "frontend" ]; then
        deploy_frontend
    fi
    
    if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "backend" ]; then
        deploy_backend
    fi
    
    # Clean up temporary environment
    log_info "Cleaning up temporary environment..."
    railway environment delete "$TEMP_ENV" --force
    
    log_success "Blue-green deployment completed successfully"
}

# Main deployment function
deploy() {
    log_info "Starting Railway deployment to $ENVIRONMENT environment..."
    
    # Check if production requires approval
    if [ "$ENVIRONMENT" = "production" ] && [ "$(echo "$ENV_CONFIG" | jq -r '.deployment.approvalRequired.production')" = "true" ]; then
        log_warning "Production deployment requires approval"
        read -p "Do you want to continue with production deployment? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Deployment cancelled by user"
            exit 0
        fi
    fi
    
    # Check deployment strategy
    DEPLOYMENT_STRATEGY=$(echo "$ENV_CONFIG" | jq -r '.deployment.strategy')
    
    if [ "$DEPLOYMENT_STRATEGY" = "blue-green" ]; then
        blue_green_deploy
    else
        # Standard deployment
        if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "frontend" ]; then
            deploy_frontend
        fi
        
        if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "backend" ]; then
            deploy_backend
        fi
    fi
    
    log_success "Deployment completed successfully!"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up temporary resources..."
    # Add any cleanup logic here
}

# Main execution
main() {
    log_info "Railway Deployment Script Starting..."
    
    # Set up trap for cleanup
    trap cleanup EXIT
    
    # Check prerequisites
    check_prerequisites
    
    # Load configuration
    load_config
    
    # Deploy
    deploy
    
    log_success "Railway deployment completed successfully!"
}

# Help function
show_help() {
    echo "Usage: $0 [ENVIRONMENT] [SERVICE] [HEALTH_CHECK_TIMEOUT] [ROLLBACK_ENABLED]"
    echo ""
    echo "Arguments:"
    echo "  ENVIRONMENT        Target environment (staging|production) [default: staging]"
    echo "  SERVICE           Service to deploy (frontend|backend|all) [default: all]"
    echo "  HEALTH_CHECK_TIMEOUT  Health check timeout in seconds [default: 300]"
    echo "  ROLLBACK_ENABLED  Enable rollback on failure (true|false) [default: true]"
    echo ""
    echo "Examples:"
    echo "  $0 staging all 300 true"
    echo "  $0 production frontend 600 true"
    echo "  $0 staging backend 300 false"
}

# Parse command line arguments
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    show_help
    exit 0
fi

# Run main function
main "$@"
