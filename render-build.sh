#!/usr/bin/env bash

# Update packages and install dependencies
apt-get update
apt-get install -y wget gnupg2 apt-transport-https

# Install Chromium
apt-get install -y chromium

# Verify installation
echo "Installed Chromium version:"
chromium --version

# Optional: List the installed binaries for debugging purposes
which chromium
ls -l /usr/bin/chromium
