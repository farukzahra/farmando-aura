#!/usr/bin/env sh
set -eu

APP_DIR="${APP_DIR:-/opt/farmando-aura}"
DEPLOY_REF="${DEPLOY_REF:-origin/main}"
DOMAIN="${DOMAIN:-livros.faruk.dev.br}"
GITHUB_REPO="${GITHUB_REPO:-farukzahra/farmando-aura}"
SITE_DIR="${APP_DIR}/site"

cd "$APP_DIR"

sync_repo() {
  if [ -n "${GITHUB_TOKEN:-}" ]; then
    git fetch "https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git" \
      "+refs/heads/*:refs/remotes/origin/*" --prune
  else
    git fetch --all --prune
  fi
  git reset --hard "$DEPLOY_REF"
}

optional_rebuild() {
  if command -v node >/dev/null 2>&1; then
    echo "Sincronizando chapters.js..."
    node site/scripts/sync-from-markdown.js || echo "sync-from-markdown falhou — usando artefatos do git"
  else
    echo "Node ausente — servindo artefatos versionados no repositório."
  fi
}

sync_repo
optional_rebuild

if [ ! -f "${SITE_DIR}/index.html" ]; then
  echo "index.html não encontrado em ${SITE_DIR}" >&2
  exit 1
fi

if [ -f /etc/caddy/Caddyfile ]; then
  python3 - "$SITE_DIR" "$DOMAIN" <<'PY'
import sys
import subprocess

site_dir, domain = sys.argv[1:3]
path = "/etc/caddy/Caddyfile"
content = open(path, encoding="utf-8").read()

block = f"""{domain} {{
\tencode gzip zstd
\troot * {site_dir}
\tfile_server
}}"""

marker = f"{domain} {{"
start = content.find(marker)
if start == -1:
    new = content.rstrip() + "\n\n" + block + "\n"
else:
    depth = 0
    end = start
    for i in range(start, len(content)):
        char = content[i]
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    new = content[:start] + block + content[end:]

if new != content:
    open(path, "w", encoding="utf-8").write(new)
    subprocess.run(["systemctl", "reload", "caddy"], check=False)
PY
fi

sleep 2

if ! curl -sfI "http://127.0.0.1/" -H "Host: ${DOMAIN}" | grep -q "200\|301\|308"; then
  if ! curl -sf "https://${DOMAIN}/" >/dev/null 2>&1; then
    echo "Aviso: site ainda não responde em https://${DOMAIN} (DNS ou certificado pendente?)" >&2
  fi
fi

echo "Deploy concluído: https://${DOMAIN} (estático em ${SITE_DIR})"
