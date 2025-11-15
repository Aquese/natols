#!/bin/bash

# Natols - Self-Hosted Financial Analysis Platform
# Setup Script for Linux

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="natols"
INSTALL_DIR="/opt/${PROJECT_NAME}"
DATA_DIR="/var/lib/${PROJECT_NAME}"
LOG_DIR="/var/log/${PROJECT_NAME}"

# Print functions
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${YELLOW}ℹ $1${NC}"; }

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Detect Linux distribution
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VER=$VERSION_ID
    else
        print_error "Cannot detect OS"
        exit 1
    fi
    print_info "Detected OS: $OS $VER"
}

# Check dependencies
check_dependencies() {
    print_info "Checking dependencies..."
    
    local deps=("docker" "docker-compose" "git" "curl")
    local missing=()
    
    for dep in "${deps[@]}"; do
        if ! command -v $dep &> /dev/null; then
            missing+=($dep)
        else
            print_success "$dep is installed"
        fi
    done
    
    if [ ${#missing[@]} -ne 0 ]; then
        print_error "Missing dependencies: ${missing[*]}"
        read -p "Install missing dependencies? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_dependencies "${missing[@]}"
        else
            exit 1
        fi
    fi
}

# Install dependencies based on OS
install_dependencies() {
    local deps=("$@")
    
    case $OS in
        ubuntu|debian)
            apt-get update
            for dep in "${deps[@]}"; do
                case $dep in
                    docker)
                        curl -fsSL https://get.docker.com | sh
                        systemctl enable docker
                        systemctl start docker
                        ;;
                    docker-compose)
                        apt-get install -y docker-compose-plugin
                        ;;
                    *)
                        apt-get install -y $dep
                        ;;
                esac
            done
            ;;
        centos|rhel|fedora)
            yum install -y epel-release
            for dep in "${deps[@]}"; do
                case $dep in
                    docker)
                        curl -fsSL https://get.docker.com | sh
                        systemctl enable docker
                        systemctl start docker
                        ;;
                    docker-compose)
                        yum install -y docker-compose-plugin
                        ;;
                    *)
                        yum install -y $dep
                        ;;
                esac
            done
            ;;
        arch)
            pacman -Sy
            for dep in "${deps[@]}"; do
                pacman -S --noconfirm $dep
            done
            ;;
        *)
            print_error "Unsupported OS for automatic installation"
            exit 1
            ;;
    esac
}

# Create directory structure
create_directories() {
    print_info "Creating directory structure..."
    
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$DATA_DIR"/{postgres,ollama,uploads}
    mkdir -p "$LOG_DIR"
    
    print_success "Directories created"
}

# Generate environment file
generate_env() {
    print_info "Generating environment configuration..."
    
    # Generate random secrets
    DB_PASSWORD=$(openssl rand -base64 32)
    JWT_SECRET=$(openssl rand -base64 64)
    
    cat > "$INSTALL_DIR/.env" <<EOF
# Natols Configuration
# Generated on $(date)

# Application
APP_ENV=production
APP_PORT=3000
APP_HOST=0.0.0.0

# Database
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=natols
POSTGRES_USER=natols
POSTGRES_PASSWORD=$DB_PASSWORD

# Authentication
JWT_SECRET=$JWT_SECRET
JWT_EXPIRY=24h

# AI Service
AI_SERVICE_URL=http://ai-service:5000
OLLAMA_HOST=http://ollama:11434
OLLAMA_MODEL=llama2

# Data Directories
DATA_DIR=$DATA_DIR
LOG_DIR=$LOG_DIR

# Nginx
NGINX_PORT=80
NGINX_SSL_PORT=443
EOF

    chmod 600 "$INSTALL_DIR/.env"
    print_success "Environment file created at $INSTALL_DIR/.env"
}

# Copy application files
copy_files() {
    print_info "Copying application files..."
    
    # Copy all project files to install directory
    cp -r ./* "$INSTALL_DIR/"
    
    print_success "Files copied to $INSTALL_DIR"
}

# Initialize database
init_database() {
    print_info "Initializing database..."
    
    # Start only postgres container
    cd "$INSTALL_DIR"
    docker-compose up -d postgres
    
    # Wait for postgres to be ready
    print_info "Waiting for PostgreSQL to be ready..."
    sleep 10
    
    # Run migrations (to be implemented)
    # docker-compose exec postgres psql -U natols -d natols -f /migrations/init.sql
    
    print_success "Database initialized"
}

# Pull Docker images
pull_images() {
    print_info "Pulling Docker images..."
    
    cd "$INSTALL_DIR"
    docker-compose pull
    
    print_success "Docker images pulled"
}

# Start services
start_services() {
    print_info "Starting services..."
    
    cd "$INSTALL_DIR"
    docker-compose up -d
    
    print_success "Services started"
}

# Health check
health_check() {
    print_info "Running health checks..."
    
    sleep 5
    
    # Check if containers are running
    local containers=("postgres" "backend" "frontend" "nginx" "ai-service" "ollama")
    
    for container in "${containers[@]}"; do
        if docker ps | grep -q "${PROJECT_NAME}-${container}"; then
            print_success "$container is running"
        else
            print_error "$container is not running"
        fi
    done
}

# Display completion message
show_completion() {
    local IP=$(hostname -I | awk '{print $1}')
    
    echo ""
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}  Natols Installation Complete!${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo -e "Access your application at:"
    echo -e "  ${YELLOW}http://${IP}${NC}"
    echo -e "  ${YELLOW}http://localhost${NC} (if on same machine)"
    echo ""
    echo -e "Configuration file: ${YELLOW}$INSTALL_DIR/.env${NC}"
    echo -e "Data directory: ${YELLOW}$DATA_DIR${NC}"
    echo -e "Logs directory: ${YELLOW}$LOG_DIR${NC}"
    echo ""
    echo -e "To view logs:"
    echo -e "  ${YELLOW}docker-compose -f $INSTALL_DIR/docker-compose.yml logs -f${NC}"
    echo ""
    echo -e "To stop services:"
    echo -e "  ${YELLOW}docker-compose -f $INSTALL_DIR/docker-compose.yml down${NC}"
    echo ""
    echo -e "To restart services:"
    echo -e "  ${YELLOW}docker-compose -f $INSTALL_DIR/docker-compose.yml restart${NC}"
    echo ""
    echo -e "${GREEN}================================================${NC}"
}

# Uninstall function
uninstall() {
    print_info "Uninstalling Natols..."
    
    read -p "This will remove all data. Are you sure? (yes/no) " -r
    echo
    if [[ ! $REPLY =~ ^yes$ ]]; then
        print_info "Uninstall cancelled"
        exit 0
    fi
    
    cd "$INSTALL_DIR" 2>/dev/null && docker-compose down -v
    rm -rf "$INSTALL_DIR"
    rm -rf "$DATA_DIR"
    rm -rf "$LOG_DIR"
    
    print_success "Natols uninstalled"
}

# Main installation flow
main() {
    echo -e "${GREEN}"
    cat << "EOF"
    ███╗   ██╗ █████╗ ████████╗ ██████╗ ██╗     ███████╗
    ████╗  ██║██╔══██╗╚══██╔══╝██╔═══██╗██║     ██╔════╝
    ██╔██╗ ██║███████║   ██║   ██║   ██║██║     ███████╗
    ██║╚██╗██║██╔══██║   ██║   ██║   ██║██║     ╚════██║
    ██║ ╚████║██║  ██║   ██║   ╚██████╔╝███████╗███████║
    ╚═╝  ╚═══╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚══════╝╚══════╝
    Financial Analysis Platform
EOF
    echo -e "${NC}"
    
    check_root
    detect_os
    check_dependencies
    create_directories
    generate_env
    copy_files
    pull_images
    init_database
    start_services
    health_check
    show_completion
}

# Handle command line arguments
case "${1:-}" in
    uninstall)
        uninstall
        ;;
    *)
        main
        ;;
esac