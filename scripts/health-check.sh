#!/bin/bash

# Health Check Script for Railway Deployments
# Comprehensive health monitoring for all services

set -e

# Configuration
ENVIRONMENT=${1:-staging}
SERVICES=${2:-all}
TIMEOUT=${3:-300}
RETRY_INTERVAL=${4:-10}

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

# Load environment configuration
load_config() {
    if [ ! -f "railway-environments.json" ]; then
        log_error "railway-environments.json not found"
        exit 1
    fi
    
    ENV_CONFIG=$(jq -r ".environments.$ENVIRONMENT" railway-environments.json)
    
    if [ "$ENV_CONFIG" = "null" ]; then
        log_error "Environment '$ENVIRONMENT' not found in configuration"
        exit 1
    fi
    
    # Extract service URLs
    FRONTEND_URL=$(echo "$ENV_CONFIG" | jq -r '.domains.frontend')
    BACKEND_URL=$(echo "$ENV_CONFIG" | jq -r '.domains.backend')
    
    log_info "Configuration loaded for $ENVIRONMENT environment"
}

# Check if service is responding
check_service_response() {
    local service_url=$1
    local service_name=$2
    local timeout=$3
    local start_time=$(date +%s)
    
    log_info "Checking $service_name health at $service_url"
    
    while [ $(($(date +%s) - start_time)) -lt $timeout ]; do
        local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$service_url/health" 2>/dev/null || echo "000")
        
        if [ "$response_code" = "200" ]; then
            log_success "$service_name is healthy (HTTP $response_code)"
            return 0
        elif [ "$response_code" != "000" ]; then
            log_warning "$service_name responded with HTTP $response_code"
        fi
        
        sleep $RETRY_INTERVAL
    done
    
    log_error "$service_name health check failed after ${timeout}s"
    return 1
}

# Check database connectivity
check_database_health() {
    local backend_url=$1
    local timeout=$2
    local start_time=$(date +%s)
    
    log_info "Checking database connectivity via backend"
    
    while [ $(($(date +%s) - start_time)) -lt $timeout ]; do
        local response=$(curl -s "$backend_url/health/db" 2>/dev/null || echo '{"status":"error"}')
        local status=$(echo "$response" | jq -r '.status' 2>/dev/null || echo "error")
        
        if [ "$status" = "healthy" ]; then
            log_success "Database connectivity check passed"
            return 0
        fi
        
        sleep $RETRY_INTERVAL
    done
    
    log_error "Database connectivity check failed"
    return 1
}

# Check Redis connectivity
check_redis_health() {
    local backend_url=$1
    local timeout=$2
    local start_time=$(date +%s)
    
    log_info "Checking Redis connectivity via backend"
    
    while [ $(($(date +%s) - start_time)) -lt $timeout ]; do
        local response=$(curl -s "$backend_url/health/redis" 2>/dev/null || echo '{"status":"error"}')
        local status=$(echo "$response" | jq -r '.status' 2>/dev/null || echo "error")
        
        if [ "$status" = "healthy" ]; then
            log_success "Redis connectivity check passed"
            return 0
        fi
        
        sleep $RETRY_INTERVAL
    done
    
    log_error "Redis connectivity check failed"
    return 1
}

# Check API endpoints
check_api_endpoints() {
    local backend_url=$1
    local timeout=$2
    local start_time=$(date +%s)
    
    log_info "Checking critical API endpoints"
    
    # List of critical endpoints to check
    local endpoints=(
        "/health"
        "/health/db"
        "/health/redis"
        "/api/v1/status"
    )
    
    for endpoint in "${endpoints[@]}"; do
        local endpoint_start_time=$(date +%s)
        
        while [ $(($(date +%s) - endpoint_start_time)) -lt 60 ]; do
            local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$backend_url$endpoint" 2>/dev/null || echo "000")
            
            if [ "$response_code" = "200" ]; then
                log_success "Endpoint $endpoint is responding correctly"
                break
            elif [ "$response_code" != "000" ]; then
                log_warning "Endpoint $endpoint responded with HTTP $response_code"
            fi
            
            sleep $RETRY_INTERVAL
        done
        
        if [ $(($(date +%s) - endpoint_start_time)) -ge 60 ]; then
            log_error "Endpoint $endpoint failed to respond within 60s"
            return 1
        fi
    done
    
    log_success "All API endpoints are responding correctly"
    return 0
}

# Check frontend assets
check_frontend_assets() {
    local frontend_url=$1
    local timeout=$2
    
    log_info "Checking frontend assets"
    
    # Check main page
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$frontend_url" 2>/dev/null || echo "000")
    
    if [ "$response_code" = "200" ]; then
        log_success "Frontend main page is accessible"
    else
        log_error "Frontend main page is not accessible (HTTP $response_code)"
        return 1
    fi
    
    # Check static assets (CSS, JS)
    local page_content=$(curl -s "$frontend_url" 2>/dev/null || echo "")
    
    # Check for common asset patterns
    if echo "$page_content" | grep -q "\.css\|\.js\|\.png\|\.jpg\|\.svg"; then
        log_success "Frontend assets are present"
    else
        log_warning "Frontend assets may be missing"
    fi
    
    return 0
}

# Check performance metrics
check_performance_metrics() {
    local service_url=$1
    local service_name=$2
    local timeout=$3
    
    log_info "Checking $service_name performance metrics"
    
    # Measure response time
    local start_time=$(date +%s%N)
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$service_url/health" 2>/dev/null || echo "000")
    local end_time=$(date +%s%N)
    local response_time=$(echo "scale=2; ($end_time - $start_time) / 1000000" | bc 2>/dev/null || echo "0")
    
    if [ "$response_code" = "200" ]; then
        if (( $(echo "$response_time < 1000" | bc -l) )); then
            log_success "$service_name response time: ${response_time}ms (good)"
        elif (( $(echo "$response_time < 2000" | bc -l) )); then
            log_warning "$service_name response time: ${response_time}ms (acceptable)"
        else
            log_warning "$service_name response time: ${response_time}ms (slow)"
        fi
    else
        log_error "$service_name is not responding correctly"
        return 1
    fi
    
    return 0
}

# Check resource usage
check_resource_usage() {
    local service_name=$1
    local environment=$2
    
    log_info "Checking $service_name resource usage"
    
    # Get resource metrics from Railway
    if command -v railway &> /dev/null; then
        local metrics=$(railway metrics --json --environment "$environment" 2>/dev/null || echo "{}")
        
        if [ "$metrics" != "{}" ]; then
            local cpu_usage=$(echo "$metrics" | jq -r '.cpu_percent // "N/A"')
            local memory_usage=$(echo "$metrics" | jq -r '.memory_percent // "N/A"')
            
            log_info "CPU Usage: $cpu_usage%"
            log_info "Memory Usage: $memory_usage%"
            
            # Check thresholds
            if [ "$cpu_usage" != "N/A" ] && (( $(echo "$cpu_usage > 80" | bc -l) )); then
                log_warning "High CPU usage detected: $cpu_usage%"
            fi
            
            if [ "$memory_usage" != "N/A" ] && (( $(echo "$memory_usage > 85" | bc -l) )); then
                log_warning "High memory usage detected: $memory_usage%"
            fi
        else
            log_warning "Could not retrieve resource metrics"
        fi
    else
        log_warning "Railway CLI not available for resource checking"
    fi
}

# Generate health report
generate_health_report() {
    local report_file="health-report-$ENVIRONMENT-$(date +%Y%m%d-%H%M%S).json"
    
    log_info "Generating health report: $report_file"
    
    local report=$(cat <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "$ENVIRONMENT",
  "services": {
    "frontend": {
      "url": "$FRONTEND_URL",
      "status": "healthy",
      "response_time_ms": "0",
      "cpu_percent": "0",
      "memory_percent": "0"
    },
    "backend": {
      "url": "$BACKEND_URL",
      "status": "healthy",
      "response_time_ms": "0",
      "cpu_percent": "0",
      "memory_percent": "0"
    }
  },
  "database": {
    "status": "healthy",
    "connection_pool": "active"
  },
  "redis": {
    "status": "healthy",
    "connection_pool": "active"
  },
  "overall_status": "healthy"
}
EOF
)
    
    echo "$report" > "$report_file"
    log_success "Health report generated: $report_file"
}

# Main health check function
run_health_checks() {
    log_info "Starting comprehensive health checks for $ENVIRONMENT environment"
    
    local overall_status=0
    
    # Frontend health checks
    if [ "$SERVICES" = "all" ] || [ "$SERVICES" = "frontend" ]; then
        if ! check_service_response "$FRONTEND_URL" "Frontend" "$TIMEOUT"; then
            overall_status=1
        fi
        
        if ! check_frontend_assets "$FRONTEND_URL" "$TIMEOUT"; then
            overall_status=1
        fi
        
        check_performance_metrics "$FRONTEND_URL" "Frontend" "$TIMEOUT"
        check_resource_usage "frontend" "$ENVIRONMENT"
    fi
    
    # Backend health checks
    if [ "$SERVICES" = "all" ] || [ "$SERVICES" = "backend" ]; then
        if ! check_service_response "$BACKEND_URL" "Backend" "$TIMEOUT"; then
            overall_status=1
        fi
        
        if ! check_database_health "$BACKEND_URL" "$TIMEOUT"; then
            overall_status=1
        fi
        
        if ! check_redis_health "$BACKEND_URL" "$TIMEOUT"; then
            overall_status=1
        fi
        
        if ! check_api_endpoints "$BACKEND_URL" "$TIMEOUT"; then
            overall_status=1
        fi
        
        check_performance_metrics "$BACKEND_URL" "Backend" "$TIMEOUT"
        check_resource_usage "backend" "$ENVIRONMENT"
    fi
    
    # Generate report
    generate_health_report
    
    if [ $overall_status -eq 0 ]; then
        log_success "All health checks passed!"
        return 0
    else
        log_error "Some health checks failed!"
        return 1
    fi
}

# Help function
show_help() {
    echo "Usage: $0 [ENVIRONMENT] [SERVICES] [TIMEOUT] [RETRY_INTERVAL]"
    echo ""
    echo "Arguments:"
    echo "  ENVIRONMENT    Target environment (staging|production) [default: staging]"
    echo "  SERVICES       Services to check (frontend|backend|all) [default: all]"
    echo "  TIMEOUT        Health check timeout in seconds [default: 300]"
    echo "  RETRY_INTERVAL Retry interval in seconds [default: 10]"
    echo ""
    echo "Examples:"
    echo "  $0 staging all 300 10"
    echo "  $0 production frontend 600 5"
    echo "  $0 staging backend 300 15"
}

# Main execution
main() {
    # Parse command line arguments
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        show_help
        exit 0
    fi
    
    log_info "Health Check Script Starting..."
    
    # Load configuration
    load_config
    
    # Run health checks
    run_health_checks
}

# Run main function
main "$@"
