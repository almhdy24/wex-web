#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="${HOME}/.wex-local-https"

check_pid() {
  local name="$1"
  local pidfile="${OUT_DIR}/${name}.pid"
  if [ -f "${pidfile}" ] && kill -0 "$(cat "${pidfile}")" 2>/dev/null; then
    echo "${name}: RUNNING (PID $(cat "${pidfile}"))"
  else
    echo "${name}: STOPPED"
  fi
}

check_pid nginx
check_pid api
check_pid vite

LAN_IP="$(cat "${OUT_DIR}/lan_ip.txt" 2>/dev/null || true)"
echo "URLs: https://localhost:8443 ${LAN_IP:+| https://${LAN_IP}:8443}"
