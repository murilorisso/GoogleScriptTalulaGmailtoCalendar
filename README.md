# 🏄‍♂️ Automação Gmail para Google Agenda - Talula Cable Park

Este repositório contém um script para o **Google Apps Script** que monitora sua caixa de entrada do Gmail em busca de e-mails de confirmação de agendamento do **Talula Cable Park**, extrai os detalhes do agendamento (data, hora, links de localização) e os adiciona automaticamente ao seu **Google Agenda**.

## 🚀 Funcionalidades

- **Automação Completa:** Roda de forma 100% autônoma na infraestrutura do Google Cloud (sem precisar do seu computador ou navegador ligados).
- **Evita Duplicados:** Utiliza um marcador (label) do Gmail (`Talula-Adicionado`) e checagem de calendário para garantir que cada agendamento seja inserido apenas uma vez.
- **Integração de Mapas:** Extrai e inclui links de localização do Waze e Google Maps diretamente na descrição do evento criado.
- **Convites Automáticos:** Envia automaticamente o convite do evento para acompanhantes definidos (ex: parceiros de treino).

## 📂 Estrutura do Repositório

- [codigo.js](file:///mnt/nvme-ssd1/Web/GitHub/ScriptEmailTalula/codigo.js): Código-fonte JavaScript pronto para ser colado no editor do Google Apps Script.
- [guia_configuracao.md](file:///mnt/nvme-ssd1/Web/GitHub/ScriptEmailTalula/guia_configuracao.md): Tutorial passo a passo detalhado ensinando a configurar o script e os acionadores automáticos no Google Apps Script.

## 🛠️ Como Começar

Para ver o passo a passo completo de como instalar e configurar a automação em sua conta do Google, siga as instruções no:

👉 **[Guia de Configuração da Automação (guia_configuracao.md)](file:///mnt/nvme-ssd1/Web/GitHub/ScriptEmailTalula/guia_configuracao.md)**

---
Desenvolvido para facilitar a organização das sessões de wakeboard no Talula Cable Park.
