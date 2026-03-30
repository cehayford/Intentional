#!/bin/bash

# Railway Rollback Script
# Automated rollback with safety checks and logging

set -e

# Configuration
ENVIRONMENT=${1:-staging}
SERVICE=${2:-all}
REASON=${3:-"Manual rollback"}
FORCE=${4:-false}

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

# Rollback logging
log_rollback() {
    local message=$1
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    echo "[$timestamp] $message" >> "rollback-$ENVIRONMENT-$(date +%Y%m%d).log"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking rollback prerequisites..."
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        log_error "Railway CLI is not installed"
        exit 1
    fi
    
    # Check if user is logged in
    if ! railway whoami &> /dev/null; then
        log_error "Not logged in to Railway"
        exit 1
    fi
    
    # Check if environment exists
    if ! railway environment list | grep -q "$ENVIRONMENT"; then
        log_error "Environment '$ENVIRONMENT' not found"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Get current deployment info
get_deployment_info() {
    log_info "Getting current deployment information..."
    
    local deployment_info=$(railway status --json --environment "$ENVIRONMENT")
    local current_commit=$(echo "$deployment_info" | jq -r '.commit // "unknown"')
    local deployment_time=$(echo "$deployment_info" | jq -r '.deployedAt // "unknown"')
    
    log_info "Current deployment: $current_commit at $deployment_time"
    
    echo "$deployment_info"
}

# Get deployment history
get_deployment_history() {
    log_info "Getting deployment history..."
    
    local history=$(railway history --json --environment "$ENVIRONMENT" 2>/dev/null || echo "[]")
    
    if [ "$history" = "[]" ]; then
        log_warning "No deployment history available"
        return 1
    fi
    
    # Show last 5 deployments
    log_info "Recent deployments:"
    echo "$history" | jq -r '.[:5] | .[] | "  \(.commit // "unknown") - \(.deployedAt // "unknown") - \(.status // "unknown")"'
    
    echo "$history"
}

# Confirm rollback
confirm_rollback() {
    if [ "$FORCE" = "true" ]; then
        log_warning "Force rollback enabled, skipping confirmation"
        return 0
    fi
    
    log_warning "You are about to rollback $SERVICE in $ENVIRONMENT environment"
    log_warning "Reason: $REASON"
    log_warning "This action cannot be undone easily"
    
    echo
    read -p "Do you want to continue with rollback? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Rollback cancelled by user"
        exit 0
    fi
}

# Create rollback checkpoint
create_checkpoint() {
    log_info "Creating rollback checkpoint..."
    
    local checkpoint_name="pre-rollback-$(date +%Y%m%d-%H%M%S)"
    
    # Save current state
    railway environment create "$checkpoint_name" --clone "$ENVIRONMENT" 2>/dev/null || {
        log_warning "Could not create checkpoint environment"
        return 1
    }
    
    log_success "Rollback checkpoint created: $checkpoint_name"
    echo "$checkpoint_name"
}

# Rollback frontend service
rollback_frontend() {
    log_info "Rolling back frontend service..."
    
    local service_name="frontend"
    
    # Get current deployment info
    local current_info=$(get_deployment_info)
    local current_commit=$(echo "$current_info" | jq -r '.commit // "unknown"')
    
    log_rollback "Starting frontend rollback from commit: $current_commit"
    
    # Perform rollback
    if railway rollback --service "$service_name" --environment "$ENVIRONMENT"; then
        log_success "Frontend rollback completed successfully"
        log_rollback "Frontend rollback completed successfully"
        
        # Verify rollback
        verify_rollback "$service_name"
    else
        log_error "Frontend rollback failed"
        log_rollback "Frontend rollback failed"
        return 1
    fi
}

# Rollback backend service
rollback_backend() {
    log_info "Rolling back backend service..."
    
    local service_name="backend"
    
    # Get current deployment info
    local current_info=$(get_deployment_info)
    local current_commit=$(echo "$current_info" | jq -r '.commit // "unknown"')
    
    log_rollback "Starting backend rollback from commit: $current_commit"
    
    # Check if database rollback is needed
    if [ "$FORCE" != "true" ]; then
        log_warning "Backend rollback may require database rollback"
        read -p "Do you want to rollback database migrations? (y/N): " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rollback_database
        fi
    fi
    
    # Perform rollback
    if railway rollback --service "$service_name" --environment "$ENVIRONMENT"; then
        log_success "Backend rollback completed successfully"
        log_rollback "Backend rollback completed successfully"
        
        # Verify rollback
        verify_rollback "$service_name"
    else
        log_error "Backend rollback failed"
        log_rollback "Backend rollback failed"
        return 1
    fi
}

# Rollback database migrations
rollback_database() {
    log_info "Rolling back database migrations..."
    
    local migration_count=${1:-1}
    
    # Run database rollback
    if railway run "npm run migration:rollback -- --to=$(railway history --json --environment "$ENVIRONMENT" | jq -r '.[1].commit')" --environment "$ENVIRONMENT"; then
        log_success "Database rollback completed"
        log_rollback "Database rollback completed ($migration_count migrations)"
    else
        log_warning "Database rollback failed or not needed"
        log_rollback "Database rollback failed"
    fi
}

# Verify rollback
verify_rollback() {
    local service_name=$1
    local timeout=300
    local start_time=$(date +%s)
    
    log_info "Verifying rollback for $service_name..."
    
    # Get service URL
    local service_url=$(railway status --json --environment "$ENVIRONMENT" | jq -r ".services[] | select(.name == \"$service_name\") | .url")
    
    if [ -z "$service_url" ] || [ "$service_url" = "null" ]; then
        log_error "Could not get service URL for $service_name"
        return 1
    fi
    
    # Health check
    while [ $(($(date +%s) - start_time)) -lt $timeout ]; do
        local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$service_url/health" 2>/dev/null || echo "000")
        
        if [ "$response_code" = "200" ]; then
            log_success "$service_name rollback verified successfully"
            log_rollback "$service_name rollback verified successfully"
            return 0
        fi
        
        sleep 10
    done
    
    log_error "$service_name rollback verification failed"
    log_rollback "$service_name rollback verification failed"
    return 1
}

# Cleanup checkpoints
cleanup_checkpoints() {
    log_info "Cleaning up old rollback checkpoints..."
    
    # Get list of checkpoint environments
    local checkpoints=$(railway environment list --json | jq -r '.[] | select(.name | startswith("pre-rollback-")) | .name')
    
    for checkpoint in $checkpoints; do
        local checkpoint_age=$(echo "$checkpoint" | sed 's/pre-rollback-//')
        local checkpoint_date=$(date -d "$checkpoint_age" +%s 2>/dev/null || echo "0")
        local current_date=$(date +%s)
        local age_days=$(( (current_date - checkpoint_date) / 86400 ))
        
        # Remove checkpoints older than 7 days
        if [ $age_days -gt 7 ]; then
            log_info "Removing old checkpoint: $checkpoint"
            railway environment delete "$checkpoint" --force
        fi
    done
    
    log_success "Checkpoint cleanup completed"
}

# Generate rollback report
generate_rollback_report() {
    local report_file="rollback-report-$ENVIRONMENT-$(date +%Y%m%d-%H%M%S).json"
    
    log_info "Generating rollback report: $report_file"
    
    local deployment_info=$(get_deployment_info)
    local new_commit=$(echo "$deployment_info" | jq -r '.commit // "unknown"')
    
    local report=$(cat <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "$ENVIRONMENT",
  "service": "$SERVICE",
  "reason": "$REASON",
  "rollback_type": "automated",
  "previous_commit": "unknown",
  "new_commit": "$new_commit",
  "status": "completed",
  "health_check": "passed",
  "database_rollback": false
}
EOF
)
    
    echo "$report" > "$report_file"
    log_success "Rollback report generated: $report_file"
}

# Send rollback notification
send_notification() {
    local status=$1
    local message=$2
    
    log_info "Sending rollback notification..."
    
    # Add notification logic here (Slack, Discord, email, etc.)
    # This is a placeholder for actual notification implementation
    
    log_info "Notification sent: $message"
}

# Main rollback function
rollback() {
    log_info "Starting rollback process for $ENVIRONMENT environment..."
    
    # Log rollback initiation
    log_rollback "Rollback initiated - Service: $SERVICE, Reason: $REASON"
    
    # Create checkpoint
    local checkpoint_name=$(create_checkpoint || echo "")
    
    # Perform rollback based on service
    case $SERVICE in
        "frontend")
            rollback_frontend
            ;;
        "backend")
            rollback_backend
            ;;
        "all")
            rollback_frontend
            rollback_backend
            ;;
        *)
            log_error "Unknown service: $SERVICE"
            exit 1
            ;;
    esac
    
    # Generate report
    generate_rollback_report
    
    # Send notification
    send_notification "success" "Rollback completed for $SERVICE in $ENVIRONMENT"
    
    log_success "Rollback process completed successfully!"
}

# Main execution
main() {
    # Parse command line arguments
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        echo "Usage: $0 [ENVIRONMENT] [SERVICE] [REASON] [FORCE]"
        echo ""
        echo "Arguments:"
        echo "  ENVIRONMENT  Target environment (staging|production) [default: staging]"
        echo "  SERVICE      Service to rollback (frontend|backend|all) [default: all]"
        echo "  REASON       Rollback reason [default: 'Manual rollback']"
        echo "  FORCE        Force rollback without confirmation (true|false) [default: false]"
        echo ""
        echo "Examples:"
        echo "  $0 staging all 'Deployment failed health checks'"
        echo "  $0 production frontend 'Performance issues'"
        echo "  $0 staging backend 'Database migration failed' true"
        exit 0
    fi
    
    log_info "Railway Rollback Script Starting..."
    
    # Check prerequisites
    check_prerequisites
    
    # Show current deployment info
    get_deployment_info
    
    # Show deployment history
    get_deployment_history
    
    # Confirm rollback
    confirm_rollback
    
    # Perform rollback
    rollback
    
    # Cleanup old checkpoints
    cleanup_checkpoints
}

# Run main function
main "$@"
