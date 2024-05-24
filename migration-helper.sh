#!/bin/bash

# Run the generate-sql command and capture its output
output=$(npm run generate-sql)

# Check if the output contains the specific string
if echo "$output" | grep -q "No schema changes, nothing to migrate"; then
  echo "No schema changes, nothing to migrate"
  exit 0
else
  echo "Schema changes detected. Running migrations..."
  npm run migrate
fi