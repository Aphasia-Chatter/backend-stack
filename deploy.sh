#!/bin/bash

# Exit immediately if a command exits with a non-zero status,
# set to print all commands ran.
set -e
set -x

# Check if the script is run with sudo
if [ "$EUID" -ne 0 ]; then
    echo "This script requires sudo permissions."
    read -p "Would you like to run this script with sudo? (y/n): " choice
    if [[ "$choice" == "y" || "$choice" == "Y" ]]; then
        exec sudo "$0" "$@"
    else
        echo "Exiting script."
        exit 1
    fi
fi

# Function to check for Debian or Ubuntu
check_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        if [[ "$ID" == "debian" ]]; then
            echo "This system is Debian."
            return 1  # Return 1 for Debian
        elif [[ "$ID" == "ubuntu" ]]; then
            echo "This system is Ubuntu."
            return 0  # Return 0 for Ubuntu
        else
            echo "This system is neither Debian nor Ubuntu."
            exit 1
        fi
    else
        echo "Cannot determine the operating system."
        exit 1
    fi
}

# Function to install Docker
install_docker() {
    if [[ $1 -eq 0 ]]; then
        # For Ubuntu
        echo "Removing existing Docker packages for Ubuntu..."
        for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do
            sudo apt-get remove -y $pkg || true  # Ignore errors if package is not installed
        done

        echo "Setting up Docker's official GPG key for Ubuntu..."
        sudo apt-get update
        sudo apt-get install -y ca-certificates curl
        sudo install -m 0755 -d /etc/apt/keyrings
        sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
        sudo chmod a+r /etc/apt/keyrings/docker.asc

        echo "Adding the Docker repository to Apt sources for Ubuntu..."
        echo \
          "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
          $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
          sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    else
        # For Debian
        echo "Removing existing Docker packages for Debian..."
        for pkg in docker.io docker-doc docker-compose podman-docker containerd runc; do
            sudo apt-get remove -y $pkg || true  # Ignore errors if package is not installed
        done

        echo "Setting up Docker's official GPG key for Debian..."
        sudo apt-get update
        sudo apt-get install -y ca-certificates curl
        sudo install -m 0755 -d /etc/apt/keyrings
        sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
        sudo chmod a+r /etc/apt/keyrings/docker.asc

        echo "Adding the Docker repository to Apt sources for Debian..."
        echo \
          "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian \
          $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
          sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    fi

    echo "Updating package list..."
    sudo apt-get update

    echo "Installing Docker..."
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    echo "Adding current user to the 'docker' group..."
    sudo usermod -aG docker $USER

    echo "Applying group changes..."
    newgrp docker || true  # Apply changes without restart
}

os_check_result=$(check_os)
install_docker $?

echo "Docker installation complete!"

echo "Installing Python..."
sudo apt install python3 -y

# Setup .env file based on user input.
echo "Setting up environment variables..."
read -p "Create your database username (Save this!): " DB_USER
read -p "Create your database password (Save this!): " DB_PASSWORD

read -p "Create your pgadmin4 username (Save this!): " PGADMIN_EMAIL
read -p "Create your pgadmin4 password (Save this!): " PGADMIN_PASSWORD

read -p "Create your staff account username (Save this!): " STAFF_USERNAME
read -p "Create your staff account password (Save this!): " STAFF_PASSWORD


read -p "Input your OpenAI API Key: " OPENAI_API_KEY
read -p "Input your OpenAI Organization ID: " OPENAI_ORGANIZATION
read -p "Input your OpenAI Project ID: " OPENAI_PROJECT

echo "Generating encryption keys..."
ENCRYPTION_KEY=$(python3 -c 'import secrets; print(secrets.token_bytes(16).hex())')
echo "Generating hashing pepper..."
HASHING_PEPPER=$(python3 -c 'import secrets; print(secrets.token_hex(16))')

{
    echo "MIGRATION_DELAY_SECONDS=14"
    echo "DB_USER=${DB_USER}"
    echo "DB_PASSWORD=${DB_PASSWORD}"
    echo "DB_NAME=aphasia"
    echo "PGADMIN_EMAIL=${PGADMIN_EMAIL}"
    echo "PGADMIN_PASSWORD=${PGADMIN_PASSWORD}"
    echo "API_PORT=44820"
    echo "PGADMIN_PORT=44919"
    echo "DEFAULT_STAFF_USERNAME=${STAFF_USERNAME}"
    echo "DEFAULT_STAFF_PASSWORD=${STAFF_PASSWORD}"
    echo "HASHING_PEPPER=${HASHING_PEPPER}"
    echo "ENCRYPTION_KEY=${ENCRYPTION_KEY}"
    echo "OPENAI_API_KEY=${OPENAI_API_KEY}"
    echo "OPENAI_ORGANIZATION=${OPENAI_ORGANIZATION}"
    echo "OPENAI_PROJECT=${OPENAI_PROJECT}"
} > ".env"

echo ".env file created and populated successfully."


# Start the docker containers
echo "Starting docker containers..."
docker-compose -f docker-compose-prod.yml up -d --build
sleep 20

echo "Checking docker containers status..."
required_containers=("postgres_db" "pgadmin" "node_app")
all_running=true

for container in "${required_containers[@]}"; do
    if [ "$(docker ps -q -f name=${container})" ] || [ "$(docker ps -q -f name=${container}_)"]; then
        echo "$container (exact or pattern match) is running."
    else
        echo "$container (exact or pattern match) is NOT running."
        all_running=false
    fi
done

if $all_running; then
    echo "All required containers are up and running."
else
    echo "Some containers are not running. Please check the logs."
    echo "Stopping the containers..."
    docker-compose -f docker-compose-prod.yml stop
    exit 1
fi

sudo apt-get install -y nginx

read -p "Enter your domain name (e.g., example.com): " DOMAIN_NAME

CONFIG_PATH="/etc/nginx/sites-available/$DOMAIN_NAME"
echo "Setting up NGINX configuration for $DOMAIN_NAME..."

sudo bash -c "cat > $CONFIG_PATH" <<EOL
server {
    listen 80;
    server_name $DOMAIN_NAME;

    location /api {
        proxy_pass http://localhost:44820;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        proxy_pass http://localhost:44919;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOL

sudo ln -s $CONFIG_PATH /etc/nginx/sites-enabled/

echo "Testing NGINX configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Reloading NGINX..."
    sudo systemctl reload nginx
    echo "NGINX setup completed successfully for $DOMAIN_NAME"
else
    echo

read -p "Enter your email address (For SSL Cert Expiration Notification): " SSL_EMAIL

# Install Certbot if not already installed
if ! command -v certbot &> /dev/null; then
    echo "Certbot not found. Installing..."
    apt update
    apt install -y certbot python3-certbot-nginx
fi

echo "Obtaining SSL certificate for $DOMAIN..."
certbot --nginx --non-interactive --agree-tos -m "$SSL_EMAIL" -d "$DOMAIN"

if nginx -t; then
    echo "Reloading Nginx..."
    systemctl reload nginx
else
    echo "Nginx configuration test failed. Exiting."
    exit 1
fi

echo "Setting up automatic Certbot renewal..."
systemctl enable certbot.timer
systemctl start certbot.timer

echo "SSL certificate installed and Nginx configured for $DOMAIN."
echo "Setup complete!"
