# GVConsul Lead Form + Google Sheets

Este projeto implementa um formulário de qualificação da GVConsul com fluxo guiado, validações, integração com backend e envio de leads para uma planilha do Google Sheets.

## Tecnologias

- HTML, CSS e JavaScript puro
- Node.js + Express
- Google Sheets API via Google APIs
- Meta Pixel (opcional na interface)

## Estrutura do projeto

- index.html: estrutura da página do formulário
- style.css: estilos do formulário
- script.js: fluxo do formulário, validações e envio para o backend
- server.js: inicialização do servidor Express
- src/: controllers, routes, services e configuração da integração
- config/: pasta para o arquivo da Google Service Account (ignoradO pelo Git)

## Instalação

```bash
npm install
```

## Execução local

```bash
node server.js
```

O backend ficará disponível em http://localhost:3000.

## Variáveis de ambiente

Crie um arquivo .env com as seguintes variáveis:

```env
PORT=3000
GOOGLE_SHEET_ID=SEU_ID_DA_PLANILHA
GOOGLE_SERVICE_ACCOUNT_PATH=./config/service-account.json
```

## Configuração da Service Account

1. Baixe o arquivo JSON oficial da Google Service Account no Google Cloud Console.
2. Coloque-o em config/service-account.json.
3. Garanta que a planilha do Google Sheets tenha sido compartilhada com o e-mail da Service Account.

## Conexão com o Google Sheets

A integração escreve os leads na aba Leads da planilha informada em GOOGLE_SHEET_ID.

## Teste da integração

1. Inicie o backend.
2. Abra o formulário no navegador.
3. Complete o fluxo e clique em Enviar.
4. Verifique se a linha foi criada na aba Leads da planilha.
