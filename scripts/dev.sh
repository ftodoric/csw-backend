#!/bin/bash

# Clear the database if requested
if [ $1 = '--reset' ]
then
  ./scripts/db-reset.sh
fi

if [ $2 = '--seed' ]
then
  SEED_DB=1
else
  SEED_DB=0
fi

# Install all dependencies
yarn

# Run dev server
cross-env SEED_DB=${SEED_DB} nest start --watch
