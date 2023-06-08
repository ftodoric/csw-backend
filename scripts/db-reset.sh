#!/bin/bash

# Stop the container
docker stop csw-database > /dev/null
echo
echo "  🛑 Container removed"

# Remove it
docker rm csw-database > /dev/null
echo
echo "  ❌ Database dropped"
echo

# Compose from postgres image
docker compose up -d csw-database
