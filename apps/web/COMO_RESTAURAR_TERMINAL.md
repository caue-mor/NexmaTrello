# 🚀 RESTAURAR BANCO - PASSO A PASSO NO TERMINAL

## 1️⃣ ABRIR O TERMINAL

**Mac - Opção A (Spotlight):**
- Pressione `⌘ + Espaço` (Command + Espaço)
- Digite: `Terminal`
- Pressione Enter

**Mac - Opção B (Finder):**
- Finder → Aplicativos → Utilitários → Terminal

Uma janela preta vai abrir!

---

## 2️⃣ NAVEGAR ATÉ O PROJETO

No Terminal que abriu, **copie e cole** este comando:

```bash
cd /Users/steveherison/NexmaTrello/apps/web
```

Pressione Enter.

---

## 3️⃣ EXECUTAR RESTAURAÇÃO

Agora **copie e cole** este comando:

```bash
bash EXECUTAR_AGORA.sh
```

Pressione Enter.

---

## 4️⃣ CONFIRMAR

O script vai perguntar: **"Continuar? (s/N):"**

- Digite `s` (letra s minúscula)
- Pressione Enter

---

## 5️⃣ AGUARDAR

Aguarde 30-60 segundos. Você verá várias mensagens passando.

Se aparecer no final:

```
✅ BANCO RESTAURADO COM SUCESSO!
📊 Total de tabelas: 17
```

**SUCESSO!** Seu banco foi restaurado! 🎉

---

## ❌ SE DER ERRO

Se aparecer "Não conseguiu pegar DATABASE_URL automaticamente", execute:

```bash
railway variables --service Postgres
```

Copie a linha que começa com `DATABASE_URL=postgresql://...`

E execute:

```bash
psql "postgresql://postgres:SENHA@interchange.proxy.rlwy.net:19800/railway" -f RESTORE_DATABASE_COMPLETE.sql
```

(Substitua `SENHA` pela senha da connection string que você copiou)

---

## 📞 PRECISA DE AJUDA?

Se aparecer qualquer erro, copie e cole TODO o texto que apareceu no Terminal e me mostre!
