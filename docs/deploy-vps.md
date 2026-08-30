# Deploy VPS — Farmando Aura

Site estático em **https://livros.faruk.dev.br**.

**Guia completo do GitHub Actions (PAT, secrets, validação):** [`github-actions-deploy.md`](github-actions-deploy.md)

## Infra

| Item | Valor |
| --- | --- |
| VPS | `66.23.231.218` |
| Path na VPS | `/opt/farmando-aura` |
| Domínio | `livros.faruk.dev.br` |
| Servir | Caddy `file_server` → `/opt/farmando-aura/site/` |

Arquivos sensíveis (PAT, chave SSH): **`C:\repo\secrets\`** (gitignored) — **nunca commitar**. Ver [`github-actions-deploy.md`](github-actions-deploy.md).

## DNS (Registro.br)

```text
A  livros  66.23.231.218
```

## Deploy manual (VPS)

```bash
cd /opt/farmando-aura
git pull origin main
DOMAIN=livros.faruk.dev.br APP_DIR=/opt/farmando-aura sh scripts/deploy-vps.sh
```

## Deploy automático

Workflow: [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)  
Configuração de secrets: [`github-actions-deploy.md`](github-actions-deploy.md)

## Verificação

```bash
curl -sI https://livros.faruk.dev.br/
```
