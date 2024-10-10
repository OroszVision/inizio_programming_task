#!/usr/bin/env bash
# Install Chrome dependencies

# Update packages and install dependencies
apt-get update
apt-get install -y wget gnupg2 apt-transport-https

# Add Google's signing key and install stable Chrome
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
apt-get update
apt-get install -y google-chrome-stable

# Verify installation
echo "Installed Chrome version:"
google-chrome --version
which google-chrome
ls -l /usr/bin/google-chrome
ls -l /usr/bin/google-chrome-stable

echo "Chrome installation check complete."
