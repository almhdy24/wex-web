#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="${HOME}/.wex-local-https"
mkdir -p "${OUT_DIR}/tmp" "${OUT_DIR}/dist"

# Auto-detect phone LAN IP
LAN_IP="$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1)}' | head -n1 || true)"
if [ -z "${LAN_IP}" ]; then
  LAN_IP="$(ifconfig 2>/dev/null | awk '/inet / && $2 !~ /^127\./ {print $2; exit}' || true)"
fi

echo "Detected LAN IP: ${LAN_IP:-none}"

# 1. Generate Local Root CA (10 years) if not already present
if [ ! -f "${OUT_DIR}/ca.key" ] || [ ! -f "${OUT_DIR}/ca.crt" ]; then
  echo "Generating Wex Local Root CA (10 years)..."
  openssl genrsa -out "${OUT_DIR}/ca.key" 2048
  openssl req -x509 -new -nodes -key "${OUT_DIR}/ca.key" -sha256 -days 3650 \
    -subj "/C=SD/O=Wex Local Dev CA/CN=Wex Local Dev Root CA" \
    -out "${OUT_DIR}/ca.crt"
else
  echo "Reusing existing Local Root CA at ${OUT_DIR}/ca.crt"
fi

# 2. Generate Server Key & CSR with SANs (localhost, 127.0.0.1, wex.local, LAN_IP)
SAN_ENTRIES="DNS:localhost,DNS:wex.local,IP:127.0.0.1"
if [ -n "${LAN_IP}" ]; then
  SAN_ENTRIES="${SAN_ENTRIES},IP:${LAN_IP}"
fi

cat > "${OUT_DIR}/server-ext.cnf" <<EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = ${SAN_ENTRIES}
EOF

openssl genrsa -out "${OUT_DIR}/server.key" 2048
openssl req -new -key "${OUT_DIR}/server.key" \
  -subj "/C=SD/O=Wex Local/CN=localhost" \
  -out "${OUT_DIR}/server.csr"

openssl x509 -req -in "${OUT_DIR}/server.csr" \
  -CA "${OUT_DIR}/ca.crt" -CAkey "${OUT_DIR}/ca.key" -CAcreateserial \
  -out "${OUT_DIR}/server.crt" -days 825 -sha256 \
  -extfile "${OUT_DIR}/server-ext.cnf"

rm -f "${OUT_DIR}/server.csr"
echo "${LAN_IP}" > "${OUT_DIR}/lan_ip.txt"

echo ""
echo "Local CA and Server Certificate generated in ${OUT_DIR}:"
echo "  CA Cert : ${OUT_DIR}/ca.crt"
echo "  SANs    : ${SAN_ENTRIES}"
