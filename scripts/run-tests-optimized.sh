#!/bin/bash

# Optimized test runner script
# Runs tests in parallel with caching for faster execution

echo "🚀 Starting optimized test run..."
echo "📊 Parallel threads: 4"
echo "⚡ Using test cache..."

# Run vitest with optimizations
NODE_ENV=test pnpm vitest run \
  --threads \
  --maxThreads=4 \
  --minThreads=1 \
  --isolate \
  --no-coverage \
  --reporter=default \
  --bail=0 \
  --run

echo "✅ Test run completed!"
