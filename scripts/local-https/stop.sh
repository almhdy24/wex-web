#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="${HOME}/.wex-local-https"

if [ -f "${OUT_DIR}/nginx.pid" ]; then
  nginx -s stop -c "${OUT_DIR}/nginx.conf" 2>/dev/null || kill "$(cat "${OUT_DIR}/nginx.pid")" 2>/dev/null || true
  rm -f "${OUT_DIR}/nginx.pid"
  echo "Stopped nginx."
fi

for name in api vite; do
  if [ -f "${OUT_DIR}/${name}.pid" ]; then
    PID="$(cat "${OUT_DIR}/${name}.pid")"
    kill "${PID}" 2>/dev/null || true
    rm -f "${OUT_DIR}/${name}.pid"
    echo "Stopped ${name} (PID ${PID})."
  fi
done
