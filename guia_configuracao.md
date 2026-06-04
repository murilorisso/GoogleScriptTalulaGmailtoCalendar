# Guia de Configuração da Automação de E-mails do Talula Cable Park

Este guia ensina a configurar o **Google Apps Script** para monitorar sua conta do Gmail em segundo plano, ler os e-mails de confirmação do **Talula Cable Park** e adicionar os eventos automaticamente ao seu **Google Agenda** sem nenhuma ação manual sua.

## Como Configurar

1. Acesse o **[Google Apps Script](https://script.google.com)** (script.google.com).
2. Se necessário, faça login com a mesma conta do Google onde você recebe seus e-mails e usa sua agenda.
3. Clique em **Novo projeto** (New project) no canto superior esquerdo.
4. Apague todo o código gerado no arquivo padrão `Código.gs` e cole o código contido no arquivo [codigo.js](file://///server-home/WebServer/GitHub/ScriptEmailTalula/codigo.js).
5. Renomeie o projeto (no topo) para algo amigável como: `Automação Talula Cable Park`.
6. Clique no botão de **Salvar** (ícone de disquete) no topo da barra.

---

## Como Configurar a Execução Automática (Gatilho)

Para fazer o script rodar sozinho de tempos em tempos (ex: a cada 10 minutos):

1. Na barra lateral esquerda do painel do Google Apps Script, clique no ícone de relógio (**Acionadores** ou Triggers).
2. No canto inferior direito, clique em **+ Adicionar acionador** (+ Add Trigger).
3. Defina as seguintes opções:
   - **Escolher qual função executar**: `processTalulaEmails`
   - **Escolher qual implantação deve ser executada**: `Head`
   - **Selecionar a fonte do evento**: `Baseado no tempo` (Time-driven)
   - **Selecionar o tipo de gatilho com base no tempo**: `Temporizador de minutos` (timer)
   - **Selecione o intervalo de minutos**: `A cada 1 hora`
4. Clique em **Salvar** no canto inferior direito.

> [!NOTE]
> Durante o salvamento do acionador, o Google pedirá uma autorização de segurança padrão.
> Clique em **Avançado** -> **Acessar Automação Talula Cable Park (não seguro)** e confirme as permissões para ler seu Gmail e criar eventos no seu Google Agenda. Isso é necessário para o script rodar em sua própria conta de nuvem.

---

## Detalhes da Execução

- **Prevenção de Duplicidade**: O script cria automaticamente um marcador (label) chamado `Talula-Adicionado` no seu Gmail. Cada vez que ele processa um e-mail de agendamento e o insere na sua agenda, ele aplica essa tag à conversa. Dessa forma, nas próximas execuções ele ignora os e-mails que já foram salvos.
- **Detecção Inteligente**: O script busca e-mails específicos contendo o padrão de agendamento da Talula Cable Park e trata o erro de digitação do e-mail de confirmação.
- **Autonomia Total**: Por rodar diretamente nos servidores da Google Cloud, ele funciona 24 horas por dia, 7 dias por semana, mesmo que seu computador, celular ou navegador Chrome estejam desligados.
