#!/bin/bash

# Clear the database if requested
if [ $1 = '--reset' ]
then
  ./scripts/db-reset.sh
fi

# Install all dependencies
yarn

# Build the project
yarn build

# Run production server
node dist/main
