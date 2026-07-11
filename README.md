# Goseller Frontend

Frontend SPA (Single Page Application) para a plataforma Goseller.

## API Backend
- **URL**: https://goseller.devgogroup.com/api/
- **Login**: POST `/api/auth/login` (email + password)
- **Health**: GET `/api/health`

## Como fazer deploy no GitHub Pages

### Passo 1: Criar repositório no GitHub

1. Vá para https://github.com/new
2. Nome do repo: `goseller-frontend` (ou qualquer nome que quiser)
3. Descrição: "Goseller - Plataforma de Catálogo"
4. Escolha: **Public** (para GitHub Pages funcionar grátis)
5. Clique em "Create repository"

### Passo 2: Fazer push dos arquivos

Depois de criar o repositório, GitHub vai te dar um comando tipo:

```bash
git init
git add index.html app.js style.css
git commit -m "Initial commit: Frontend files"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/goseller-frontend.git
git push -u origin main
```

**Substitua `SEU-USUARIO` pelo seu usuário do GitHub.**

### Passo 3: Ativar GitHub Pages

1. Vá para: Settings → Pages (na lateral esquerda)
2. Em "Source", escolha: **Deploy from a branch**
3. Em "Branch", escolha: **main** + **/ (root)**
4. Clique em "Save"
5. GitHub vai gerar um link tipo: `https://SEU-USUARIO.github.io/goseller-frontend/`

### Passo 4: Testar

- Frontend: https://SEU-USUARIO.github.io/goseller-frontend/
- API Backend: https://goseller.devgogroup.com/api/

## Credenciais de teste

- Email: `gean.malaquias@gocase.com`
- Senha: `Admin123456!`

---

**Feito!** O sistema estará 100% funcional.
