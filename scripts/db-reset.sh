docker stop csw-database
docker rm csw-database
docker compose up -d csw-database
nest start --watch
