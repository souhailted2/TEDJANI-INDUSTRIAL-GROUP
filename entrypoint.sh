#!/bin/sh
  echo 'Running database migrations...'
  npx drizzle-kit push --config=drizzle.config.ts 2>&1 || echo 'Migration warning (may be ok if tables exist)'
  echo 'Starting application...'
  node dist/index.cjs
  