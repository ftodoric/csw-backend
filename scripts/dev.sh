#!/bin/bash

# Clear the database if requested
if [ $1 = '--reset' ]
then
  ./scripts/db-reset.sh
fi

# Install all dependencies
yarn

# Run dev server
nest start --watch
