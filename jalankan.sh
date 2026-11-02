#!/usr/bin/env bash
cd "$(dirname "$0")"
[ -d node_modules ] || npm install
(sleep 3; (xdg-open http://localhost:5173 || open http://localhost:5173) >/dev/null 2>&1) &
npm run dev -- --port 5173 --strictPort --host 127.0.0.1
