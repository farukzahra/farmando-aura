# GitHub Actions — deploy automático

Como configurar o workflow [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) para publicar em **https://livros.faruk.dev.br** após push em `main`.

Padrão copiado do [faruk_base/docs/deploy-vps.md](https://github.com/farukzahra/faruk_base/blob/main/docs/deploy-vps.md) e do guia VPS compartilhado (`financeiro/planos/guia-deploy-vps.local.md`).

> **Segurança:** este arquivo lista **nomes** de secrets e **caminhos locais gitignored**. Nunca commitar PAT, chave SSH privada ou senhas.

---

## O que o workflow faz

**Trigger:** push em `main` ou `workflow_dispatch` (manual).

**Job `deploy`:**

1. Lê secrets do repositório (`VPS_*`, `DEPLOY_PATH`).
2. Usa `GITHUB_TOKEN` (automático do Actions) para `git fetch` na VPS em repositório privado.
3. Conecta SSH na VPS com `VPS_SSH_KEY`.
4. Executa `scripts/deploy-vps.sh` → pull + sync do site + Caddy `file_server`.

Não há job de teste — site estático; validação é curl no site após deploy.

---

## Pré-requisitos

| Item | Status |
|------|--------|
| Repositório | `farukzahra/farmando-aura` |
| VPS com clone em `/opt/farmando-aura` | Feito no primeiro deploy manual |
| Caddy com bloco `livros.faruk.dev.br` | Configurado por `deploy-vps.sh` |
| DNS `livros` → `66.23.231.218` | Registro.br |
| Chave SSH na VPS (`authorized_keys`) | Chave pública `github-actions-vps-shared` (infra compartilhada) |

---

## 1. Personal Access Token (PAT) — uso local com `gh`

O PAT **não** vai para secrets do repo. Serve só na sua máquina para rodar `gh secret set`.

### Onde está (local, gitignored)

```text
C:\repo\financeiro\planos\vps-secrets\github-pat.txt
```

- Linhas 1–6: comentários
- Linha 7+: token (`ghp_...`)

Pasta `planos/vps-secrets/` está no `.gitignore` do repo financeiro.

### Se precisar gerar um PAT novo

1. GitHub → **Settings** (conta) → **Developer settings** → **Personal access tokens**
2. **Fine-grained** ou **Classic** com escopo mínimo:
   - `repo` (ou acesso ao repo `farmando-aura`)
   - **Secrets: read and write** (para `gh secret set`)
3. Copiar o token **uma vez** e salvar só em `github-pat.txt` local (nunca no git).

### Instalar GitHub CLI (`gh`)

```powershell
winget install GitHub.cli
# ou: choco install gh
gh --version
```

---

## 2. Chave SSH para deploy (secret `VPS_SSH_KEY`)

### Onde está (local, gitignored)

```text
C:\repo\financeiro\planos\vps-secrets\deploy_key       ← privada (secret VPS_SSH_KEY)
C:\repo\financeiro\planos\vps-secrets\deploy_key.pub   ← pública (já na VPS)
```

Infra compartilhada: mesma chave usada por financeiro, faruk, job-hunter, etc.  
Fingerprint documentado no guia VPS local — não repetir chaves neste repo.

### O que colar no GitHub

Secret **`VPS_SSH_KEY`**: arquivo **`deploy_key` inteiro**, incluindo:

```text
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

---

## 3. Secrets e variables do repositório

Configurar em:  
**https://github.com/farukzahra/farmando-aura/settings/secrets/actions**

### Repository secrets (obrigatórios)

| Nome | Origem do valor | Exemplo / nota |
|------|-----------------|----------------|
| `VPS_HOST` | IP da VPS | `66.23.231.218` |
| `VPS_USER` | usuário SSH | `root` |
| `VPS_PORT` | porta SSH | `22` |
| `DEPLOY_PATH` | pasta do app na VPS | `/opt/farmando-aura` |
| `VPS_SSH_KEY` | arquivo local `deploy_key` | multilinha — ver §2 |

### Repository variables (opcional)

**Settings → Secrets and variables → Actions → Variables**

| Nome | Valor |
|------|-------|
| `DOMAIN` | `livros.faruk.dev.br` |

Se omitida, o workflow usa o default em `deploy.yml`.

### O que NÃO precisa de secret neste repo

| Token | Motivo |
|-------|--------|
| `GITHUB_TOKEN` | Injetado automaticamente pelo GitHub Actions |
| PAT pessoal | Só para CLI local (`gh`), não vai para o repo |

---

## 4. Configurar via CLI (recomendado)

Na máquina de dev, com `gh` instalado:

```powershell
# 1. Autenticar (token só da linha do PAT, sem comentários)
Get-Content C:\repo\financeiro\planos\vps-secrets\github-pat.txt | Select-Object -Skip 6 | gh auth login --with-token
gh auth status

# 2. Secrets públicos (IP, paths — ok commitar estes valores na doc)
gh secret set VPS_HOST --repo farukzahra/farmando-aura --body "66.23.231.218"
gh secret set VPS_USER --repo farukzahra/farmando-aura --body "root"
gh secret set VPS_PORT --repo farukzahra/farmando-aura --body "22"
gh secret set DEPLOY_PATH --repo farukzahra/farmando-aura --body "/opt/farmando-aura"

# 3. Chave privada — NUNCA echoar no terminal log; pipe direto do arquivo
Get-Content C:\repo\financeiro\planos\vps-secrets\deploy_key -Raw | gh secret set VPS_SSH_KEY --repo farukzahra/farmando-aura

# 4. Variable opcional
gh variable set DOMAIN --repo farukzahra/farmando-aura --body "livros.faruk.dev.br"

# 5. Conferir (só nomes, não valores)
gh secret list --repo farukzahra/farmando-aura
gh variable list --repo farukzahra/farmando-aura
```

---

## 5. Configurar via UI (alternativa)

1. Abrir **Settings → Secrets and variables → Actions**
2. **New repository secret** para cada linha da tabela §3
3. Para `VPS_SSH_KEY`: colar conteúdo completo de `deploy_key` (abrir no editor local)
4. **Variables → New variable**: `DOMAIN` = `livros.faruk.dev.br`

Referência de nomes (sem valores sensíveis):  
`financeiro/planos/vps-secrets/github-secrets-copiar.txt` — adaptar `DEPLOY_PATH` para `/opt/farmando-aura`.  
**Ignorar** `POSTGRES_PASSWORD` e `AUTH_AUTH` — não usados neste projeto estático.

---

## 6. Validar o workflow

```powershell
# Disparar manualmente
gh workflow run deploy.yml --repo farukzahra/farmando-aura

# Acompanhar
gh run list --repo farukzahra/farmando-aura --limit 5
gh run watch --repo farukzahra/farmando-aura
```

Ou: **Actions** → **Deploy VPS** → **Run workflow**.

Sucesso esperado:

- Job verde
- Log final: `Deploy concluído: https://livros.faruk.dev.br`
- Site responde:

```bash
curl -sI https://livros.faruk.dev.br/
```

---

## 7. Fluxo do dia a dia

```text
Editar capítulo → node site/scripts/build-all.js → /commit-push → push main
  → GitHub Actions deploy → VPS /opt/farmando-aura atualizado → Caddy serve site/
```

---

## 8. Troubleshooting

| Problema | Causa provável | Ação |
|----------|----------------|------|
| `Configure VPS_SSH_KEY` | Secret ausente | §4 ou §5 |
| SSH permission denied | Chave errada ou não está em `authorized_keys` | Ver guia VPS; testar `ssh -i deploy_key root@66.23.231.218` |
| `git fetch` falha na VPS | Repo privado sem token | Workflow já passa `GITHUB_TOKEN`; ver permissões do workflow |
| HTTPS não abre | DNS ou certificado LE | `dig livros.faruk.dev.br`; `journalctl -u caddy -n 30` na VPS |
| build-all falha na VPS | Story CLI não instalado na VPS | Normal — deploy usa artefatos do git; VPS só roda `sync-from-markdown.js` |

---

## 9. Checklist rápido

- [ ] PAT em `github-pat.txt` (local, gitignored)
- [ ] `gh auth login` ok
- [ ] Secrets: `VPS_HOST`, `VPS_USER`, `VPS_PORT`, `DEPLOY_PATH`, `VPS_SSH_KEY`
- [ ] Variable `DOMAIN` (opcional)
- [ ] Clone em `/opt/farmando-aura` na VPS
- [ ] DNS `livros` apontando para a VPS
- [ ] Workflow **Deploy VPS** verde no push em `main`
