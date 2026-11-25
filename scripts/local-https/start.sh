#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
API_DIR="${HOME}/projects/wex-api"
OUT_DIR="${HOME}/.wex-local-https"
MODE="${1:-static}"

if [ ! -f "${OUT_DIR}/server.crt" ] || [ ! -f "${OUT_DIR}/server.key" ]; then
  bash "${SCRIPT_DIR}/setup.sh"
fi

mkdir -p "${OUT_DIR}/tmp" "${OUT_DIR}/dist"

# Resolve mime.types path
MIME_TYPES="${PREFIX:-/usr}/etc/nginx/mime.types"
if [ ! -f "${MIME_TYPES}" ]; then
  MIME_TYPES="/etc/nginx/mime.types"
fi

# Stop existing processes if running
bash "${SCRIPT_DIR}/stop.sh" >/dev/null 2>&1 || true

# 1. Start wex-api on 127.0.0.1:8081
if [ -d "${API_DIR}/public" ]; then
  echo "Starting wex-api on 127.0.0.1:8081..."
  (cd "${API_DIR}" && nohup php -S 127.0.0.1:8081 -t public/ > "${OUT_DIR}/api.log" 2>&1 & echo $! > "${OUT_DIR}/api.pid")
else
  echo "WARNING: ${API_DIR}/public not found; API will not start."
fi

# 2. Prepare frontend mode (static vs dev)
if [ "${MODE}" = "static" ]; then
  if [ ! -f "${OUT_DIR}/dist/index.html" ]; then
    echo "Downloading production dist artifact from latest CI run..."
    if command -v gh >/dev/null 2>&1; then
      RUN_ID="$(cd "${WEB_DIR}" && gh run list --workflow=e2e.yml --branch=stabilize --status=success --limit=1 --json databaseId -q '.[0].databaseId' || true)"
      if [ -n "${RUN_ID}" ]; then
        rm -rf "${OUT_DIR}/dist"/*
        (cd "${WEB_DIR}" && gh run download "${RUN_ID}" -n wex-web-dist -D "${OUT_DIR}/dist")
      fi
    fi
  fi

  if [ ! -f "${OUT_DIR}/dist/index.html" ]; then
    echo "ERROR: No static dist found in ${OUT_DIR}/dist. Run with 'dev' mode or download wex-web-dist from CI."
    exit 1
  fi

  WEB_UPSTREAM="root ${OUT_DIR}/dist;\n            try_files \$uri \$uri/ /index.html;"
  SW_UPSTREAM="root ${OUT_DIR}/dist;\n            try_files \$uri =404;"
elif [ "${MODE}" = "dev" ]; then
  echo "Starting Vite dev server (VITE_DEV_SW=1) on 127.0.0.1:5371..."
  (cd "${WEB_DIR}" && VITE_DEV_SW=1 nohup node node_modules/vite/bin/vite.js --port 5371 --host 127.0.0.1 > "${OUT_DIR}/vite.log" 2>&1 & echo $! > "${OUT_DIR}/vite.pid")
  PROXY_BLOCK="proxy_pass http://127.0.0.1:5371;\n            proxy_http_version 1.1;\n            proxy_set_header Host \$http_host;\n            proxy_set_header Upgrade \$http_upgrade;\n            proxy_set_header Connection \$connection_upgrade;\n            proxy_set_header X-Forwarded-Proto https;"
  WEB_UPSTREAM="${PROXY_BLOCK}"
  SW_UPSTREAM="${PROXY_BLOCK}"
else
  echo "Usage: $0 [static|dev]"
  exit 1
fi

# 3. Render nginx.conf (use 8080 for HTTP redirect if free, else 8088)
HTTP_PORT="$(python3 -c 'import socket; s=socket.socket();
try:
 s.bind(("0.0.0.0", 8080)); print(8080)
except OSError:
 print(8088)
finally:
 s.close()')"

python3 - <<PY
from pathlib import Path
tpl = Path("${SCRIPT_DIR}/nginx.conf.template").read_text()
conf = (tpl
  .replace("__OUT_DIR__", "${OUT_DIR}")
  .replace("__MIME_TYPES__", "${MIME_TYPES}")
  .replace("__HTTP_PORT__", "${HTTP_PORT}")
  .replace("__WEB_UPSTREAM__", """${WEB_UPSTREAM}""".replace("\\n", "\n"))
  .replace("__SW_UPSTREAM__", """${SW_UPSTREAM}""".replace("\\n", "\n"))
)
Path("${OUT_DIR}/nginx.conf").write_text(conf)
PY

nginx -t -c "${OUT_DIR}/nginx.conf"
nginx -c "${OUT_DIR}/nginx.conf"

LAN_IP="$(cat "${OUT_DIR}/lan_ip.txt" 2>/dev/null || true)"
echo ""
echo "=== Wex Local HTTPS (${MODE} mode) is RUNNING ==="
echo "  Localhost : https://localhost:8443"
if [ -n "${LAN_IP}" ]; then
  echo "  LAN URL   : https://${LAN_IP}:8443"
fi
echo "  wex.local : https://wex.local:8443"
echo "  CA Cert   : ${OUT_DIR}/ca.crt"
echo "  Stop      : bash scripts/local-https/stop.sh"
