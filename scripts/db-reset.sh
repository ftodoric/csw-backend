# Stop container is running
docker stop csw-database > /dev/null
echo
echo "  🛑 Container stopped"

# Remove it
docker rm csw-database > /dev/null
echo
echo "  ❌ Database deleted"
echo

# Compose from postgres image
docker compose up -d csw-database

# Run dev server
nest start --watch
