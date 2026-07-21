# Deploy VPS — Farmando Aura

Site estático em **https://livros.faruk.dev.br** (leitor + downloads PDF/EPUB/DOCX).

Padrão alinhado ao [faruk_base/docs/deploy-vps.md](https://github.com/farukzahra/faruk_base/blob/main/docs/deploy-vps.md) e guia VPS compartilhada (`financeiro/planos/guia-deploy-vps.local.md`).

## Infra compartilhada

| Item | Valor |
| --- | --- |
| VPS | `66.23.231.218` |
| SSH user | `root` |
| Chave deploy (local) | `C:\repo\financeiro\planos\vps-secrets\deploy_key` |
| Path na VPS | `/opt/farmando-aura` |
| Domínio | `livros.faruk.dev.br` |
| Proxy HTTPS | Caddy — **`file_server`** direto (sem porta Node/Docker) |
| Conteúdo servido | `/opt/farmando-aura/site/` |

## Por que estático puro

O leitor é HTML/CSS/JS. Caddy serve os arquivos de `site/` com gzip — não precisa de processo na porta 808x.

```text
Internet → Caddy :443
  livros.faruk.dev.br
    /* → /opt/farmando-aura/site/  (file_server)
```

Hash routes (`#/capitulo/1`) funcionam no cliente; `index.html` + assets relativos bastam.

## DNS (Registro.br)

```text
A  livros  66.23.231.218
```

Aguardar propagação. Caddy emite certificado Let's Encrypt após o DNS apontar.

## Primeiro deploy (manual)

```powershell
# SSH
ssh -i C:\repo\financeiro\planos\vps-secrets\deploy_key root@66.23.231.218
```

```bash
# Na VPS (primeira vez)
mkdir -p /opt/farmando-aura
cd /opt/farmando-aura
git clone https://github.com/farukzahra/farmando-aura.git .
chmod +x scripts/deploy-vps.sh
APP_DIR=/opt/farmando-aura DOMAIN=livros.faruk.dev.br sh scripts/deploy-vps.sh
```

O script `deploy-vps.sh`:

1. `git fetch` + `reset --hard`
2. `node site/scripts/build-all.js` (se Node instalado; senão usa artefatos do git)
3. Atualiza bloco Caddy para `livros.faruk.dev.br` → `root * /opt/farmando-aura/site`
4. `systemctl reload caddy`

## Caddy (referência manual)

Se preferir editar à mão em `/etc/caddy/Caddyfile`:

```caddy
livros.faruk.dev.br {
	encode gzip zstd
	root * /opt/farmando-aura/site
	file_server
}
```

```bash
systemctl reload caddy
curl -sI https://livros.faruk.dev.br/
```

## Deploy automático (GitHub Actions)

Push em `main` → `.github/workflows/deploy.yml`:

1. `node site/scripts/build-all.js` no runner
2. SSH na VPS → `git fetch/reset` → `scripts/deploy-vps.sh`

### Secrets do repositório (`farukzahra/farmando-aura`)

| Secret / Variable | Valor |
| --- | --- |
| `VPS_HOST` | `66.23.231.218` |
| `VPS_USER` | `root` |
| `VPS_PORT` | `22` |
| `VPS_SSH_KEY` | conteúdo de `deploy_key` |
| `DEPLOY_PATH` | `/opt/farmando-aura` |
| `DOMAIN` (variable, opcional) | `livros.faruk.dev.br` |

Configurar secrets (PowerShell):

```powershell
$pat = Get-Content C:\repo\financeiro\planos\vps-secrets\github-pat.txt | Select-Object -Skip 6
$pat | gh auth login --with-token
gh secret set VPS_HOST --repo farukzahra/farmando-aura --body "66.23.231.218"
gh secret set VPS_USER --repo farukzahra/farmando-aura --body "root"
gh secret set VPS_PORT --repo farukzahra/farmando-aura --body "22"
gh secret set DEPLOY_PATH --repo farukzahra/farmando-aura --body "/opt/farmando-aura"
Get-Content C:\repo\financeiro\planos\vps-secrets\deploy_key -Raw | gh secret set VPS_SSH_KEY --repo farukzahra/farmando-aura
gh variable set DOMAIN --repo farukzahra/farmando-aura --body "livros.faruk.dev.br"
```

## Verificação

```bash
curl -sI https://livros.faruk.dev.br/
curl -sI https://livros.faruk.dev.br/downloads/farmando-aura.pdf
```

No browser: capa, índice de 10 capítulos, botões PDF/EPUB/DOCX.

## Portas na VPS (referência)

Este app **não consome porta** — Caddy serve arquivos diretamente.

| Porta | Serviço |
| --- | --- |
| 80/443 | Caddy |
| 3000 | faruk |
| 8081 | financeiro |
| 8082 | nfe_bot |
| 8083 | job-hunter |
| 8084 | maco |

## Workflow local → produção

```bash
# Editar capítulo
# farmando-aura/chapters/chapter-XX.md

node site/scripts/build-all.js
/commit-push   # dispara deploy via Actions após secrets configurados
```
