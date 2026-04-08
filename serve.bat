@echo off
echo Starting game preview server on http://localhost:3333
echo Press Ctrl+C to stop
npx http-server -p 3333 -c-1
