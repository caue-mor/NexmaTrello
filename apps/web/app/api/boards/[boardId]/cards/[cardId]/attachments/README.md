# Attachments API

API completa para gerenciamento de anexos em cards do Trello Nexma.

## Endpoints

### POST /api/boards/[boardId]/cards/[cardId]/attachments

Cria um novo anexo no card.

**Autenticação**: Requerida (MEMBER, ADMIN ou OWNER)

**Body (Opção 1 - URL Externa)**:
```json
{
  "fileName": "documento.pdf",
  "fileUrl": "https://drive.google.com/file/d/xyz/view",
  "mimeType": "application/pdf"
}
```

**Body (Opção 2 - Base64)**:
```json
{
  "fileName": "imagem.png",
  "fileBase64": "data:image/png;base64,iVBORw0KG...",
  "mimeType": "image/png"
}
```

**Resposta (201 Created)**:
```json
{
  "attachment": {
    "id": "clx...",
    "cardId": "clx...",
    "fileName": "documento.pdf",
    "fileUrl": "/uploads/clx.../1234567890-documento.pdf",
    "fileSize": 102400,
    "mimeType": "application/pdf",
    "uploadedBy": "clx...",
    "createdAt": "2025-09-30T18:00:00.000Z",
    "user": {
      "id": "clx...",
      "name": "João Silva",
      "email": "joao@example.com"
    }
  }
}
```

### GET /api/boards/[boardId]/cards/[cardId]/attachments

Lista todos os anexos de um card.

**Autenticação**: Requerida (MEMBER, ADMIN ou OWNER)

**Resposta (200 OK)**:
```json
{
  "attachments": [
    {
      "id": "clx...",
      "cardId": "clx...",
      "fileName": "documento.pdf",
      "fileUrl": "/uploads/clx.../1234567890-documento.pdf",
      "fileSize": 102400,
      "mimeType": "application/pdf",
      "uploadedBy": "clx...",
      "createdAt": "2025-09-30T18:00:00.000Z",
      "user": {
        "id": "clx...",
        "name": "João Silva",
        "email": "joao@example.com"
      }
    }
  ]
}
```

### GET /api/boards/[boardId]/cards/[cardId]/attachments/[attachmentId]

Busca detalhes de um anexo específico.

**Autenticação**: Requerida (MEMBER, ADMIN ou OWNER)

**Resposta (200 OK)**:
```json
{
  "attachment": {
    "id": "clx...",
    "cardId": "clx...",
    "fileName": "documento.pdf",
    "fileUrl": "/uploads/clx.../1234567890-documento.pdf",
    "fileSize": 102400,
    "mimeType": "application/pdf",
    "uploadedBy": "clx...",
    "createdAt": "2025-09-30T18:00:00.000Z",
    "user": {
      "id": "clx...",
      "name": "João Silva",
      "email": "joao@example.com"
    },
    "card": {
      "id": "clx...",
      "title": "Implementar feature X",
      "boardId": "clx..."
    }
  }
}
```

### DELETE /api/boards/[boardId]/cards/[cardId]/attachments/[attachmentId]

Remove um anexo do card. Se o arquivo foi salvo localmente, também deleta o arquivo físico.

**Autenticação**: Requerida (MEMBER, ADMIN ou OWNER)

**Resposta (200 OK)**:
```json
{
  "success": true,
  "message": "Anexo removido com sucesso"
}
```

## Comportamento

### Upload de Arquivos

A API suporta dois métodos de anexo:

1. **URL Externa** (`fileUrl`): Para arquivos já hospedados (Google Drive, Dropbox, etc)
   - Apenas salva a URL no banco de dados
   - Não consome espaço em disco no servidor
   - Ideal para arquivos grandes ou já compartilhados

2. **Base64** (`fileBase64`): Para upload direto
   - Salva arquivo em `/uploads/[cardId]/[timestamp]-[fileName]`
   - Gera nome único com timestamp para evitar conflitos
   - Sanitiza nome do arquivo removendo caracteres especiais
   - Cria estrutura de pastas automaticamente

### Servir Arquivos

Arquivos locais são servidos através de:
```
GET /api/uploads/[cardId]/[fileName]
```

Requer autenticação. Suporta tipos MIME comuns (imagens, PDFs, documentos, etc).

### Segurança

- ✅ Validação com Zod schema
- ✅ Autenticação obrigatória
- ✅ Verificação de permissões por board (RBAC)
- ✅ Sanitização de nomes de arquivo
- ✅ Prevenção de path traversal
- ✅ Validação de card pertence ao board

### Activity Log

Todas as operações geram registros de atividade:
- `ATTACHMENT_ADDED`: Quando anexo é criado
- `ATTACHMENT_DELETED`: Quando anexo é removido

## Exemplo de Uso

```typescript
// Upload de arquivo via base64
const file = document.getElementById('fileInput').files[0];
const reader = new FileReader();

reader.onload = async (e) => {
  const base64 = e.target.result;

  const response = await fetch(
    `/api/boards/${boardId}/cards/${cardId}/attachments`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileBase64: base64,
        mimeType: file.type
      })
    }
  );

  const { attachment } = await response.json();
  console.log('Anexo criado:', attachment);
};

reader.readAsDataURL(file);
```

```typescript
// Anexar URL externa
const response = await fetch(
  `/api/boards/${boardId}/cards/${cardId}/attachments`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: 'Apresentação.pdf',
      fileUrl: 'https://drive.google.com/file/d/xyz/view',
      mimeType: 'application/pdf'
    })
  }
);
```

## Limitações

- Tamanho máximo de upload: 2MB (configurado em `next.config.mjs`)
- Para aumentar: modificar `experimental.serverActions.bodySizeLimit`
- Arquivos em `/uploads/` não são versionados (adicionado ao `.gitignore`)
