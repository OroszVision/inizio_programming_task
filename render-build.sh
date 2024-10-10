#!/usr/bin/env bash

# Update packages and install dependencies
echo "Updating packages..."
apt-get update -y

echo "Installing dependencies..."
apt-get install -y wget gnupg2 apt-transport-https

# Add Google's signing key and install stable Chrome
echo "Adding Google's signing key..."
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -

echo "Adding Chrome to sources list..."
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list

echo "Updating package list again..."
apt-get update -y

echo "Installing Google Chrome..."
apt-get install -y google-chrome-stable

# Verify installation
echo "Installed Chrome version:"
which google-chrome
google-chrome --version || echo "Google Chrome is not installed"

echo "Installed Chrome Stable version:"
which google-chrome-stable
google-chrome-stable --version || echo "Google Chrome Stable is not installed"

ls -l /usr/bin/google-chrome || echo "/usr/bin/google-chrome does not exist"
ls -l /usr/bin/google-chrome-stable || echo "/usr/bin/google-chrome-stable does not exist"
