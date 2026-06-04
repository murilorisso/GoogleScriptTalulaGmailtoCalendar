/**
 * Script para automatizar a criação de eventos no Google Agenda a partir de e-mails do Talula Cable Park.
 * Configure para rodar a cada 5 ou 10 minutos usando um acionador por tempo (time-driven trigger).
 */

function processTalulaEmails() {
  const LABEL_NAME = "Talula-Adicionado";
  const SENDER_EMAIL = "naoresponder.talulacablepark@gmail.com";
  
  // Lista para rastrear eventos criados na execução ATUAL (evita duplicidade em lote devido ao buffer do GAS)
  const createdEventsThisRun = [];
  
  // 1. Obtém ou cria o marcador para evitar processamento duplicado no Gmail
  let label = GmailApp.getUserLabelByName(LABEL_NAME);
  if (!label) {
    label = GmailApp.createLabel(LABEL_NAME);
    Logger.log(`Label "${LABEL_NAME}" criada com sucesso.`);
  } else {
    Logger.log(`Label "${LABEL_NAME}" encontrada com sucesso.`);
  }
  
  // 2. Busca e-mails que contêm "Quando:" e não foram marcados
  const query = `from:${SENDER_EMAIL} "Quando:" -label:${LABEL_NAME}`;
  const threads = GmailApp.search(query);
  
  if (threads.length === 0) {
    Logger.log("Nenhum novo agendamento do Talula encontrado.");
    return;
  }
  Logger.log(`Foram encontrados ${threads.length} novos tópicos do Talula.`);
  
  threads.forEach(thread => {
    const messages = thread.getMessages();
    let threadProcessedSuccessfully = false;
    
    messages.forEach(message => {
      // Se a conversa já tiver a label (segurança contra e-mails múltiplos na mesma thread)
      if (thread.getLabels().some(l => l.getName() === LABEL_NAME)) {
        Logger.log(`Thread já possui a label ${LABEL_NAME}. Pulando.`);
        return;
      }
      
      const body = message.getPlainBody();
      
      // Remove textos de respostas anteriores citados (evita cadastrar o mesmo evento por causa de histórico de replies)
      const cleanBody = stripQuotedText(body);
      
      const parsedData = parseEmailBody(cleanBody);
      if (!parsedData) {
        // Se falhar na mensagem atual, tenta nas outras da mesma thread (se houver)
        return;
      }
      
      const { day, monthIndex, year, hour, minute } = parsedData;
      
      // Constrói a data de início do evento
      const startDate = new Date(year, monthIndex, day, hour, minute);
      
      // Duração padrão: 15 minutos
      const durationMinutes = 15;
      const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
      
      // Extrai o título (linha anterior a "Quando:" no texto limpo)
      const lines = cleanBody.split('\n').map(l => l.trim()).filter(Boolean);
      const quandoIdx = lines.findIndex(l => l.includes('Quando:'));
      let title = "Sessão Wakeboard - Talula Cable Park";
      if (quandoIdx > 0) {
        title = lines[quandoIdx - 1];
        // Remove marcações markdown como asteriscos, sublinhados, etc.
        title = title.replace(/[\*\_\#]/g, '').trim();
      }
      
      const finalTitle = `🏄‍♂️ ${title}`;
      
      // Verifica se este mesmo evento já foi criado NESTA execução (corrige o lag do CalendarApp)
      const isDuplicateThisRun = createdEventsThisRun.some(evt => 
        evt.title === finalTitle && 
        evt.time === startDate.getTime()
      );
      
      if (isDuplicateThisRun) {
        Logger.log(`[AVISO] Evento '${finalTitle}' duplicado na mesma execução. Pulando.`);
        threadProcessedSuccessfully = true; // Considera como processado
        return;
      }
      
      // Extrai os links do Waze e Google Maps
      const wazeMatch = cleanBody.match(/https:\/\/waze\.com\/ul\/[^\s\n<>"]+/);
      const mapsMatch = cleanBody.match(/https:\/\/(?:goo\.gl\/maps|google\.com\/maps)[^\s\n<>"]+/);
      
      const wazeLink = wazeMatch ? wazeMatch[0] : '';
      const mapsLink = mapsMatch ? mapsMatch[0] : '';
      const location = mapsLink || wazeLink || "Talula Cable Park";
      
      // Detalhes da descrição
      const description = `Agendamento automático criado via Gmail.\n\n` +
        `🚗 Waze: ${wazeLink || 'Não informado'}\n` +
        `📍 Google Maps: ${mapsLink || 'Não informado'}\n\n` +
        `Telefone de Contato: +55 (16) 99727-6197\n` +
        `Mensagem original: https://mail.google.com/mail/u/0/#inbox/${message.getId()}`;
      
      try {
        const calendar = CalendarApp.getDefaultCalendar();
        
        // Evita duplicados na agenda histórica: verifica se já existe um evento idêntico
        const searchStart = new Date(startDate.getTime() - 60 * 1000);
        const searchEnd = new Date(endDate.getTime() + 60 * 1000);
        const existingEvents = calendar.getEvents(searchStart, searchEnd);
        const alreadyExists = existingEvents.some(e => e.getTitle() === finalTitle);
        
        if (alreadyExists) {
          Logger.log(`[AVISO] Evento '${finalTitle}' já existe no calendário geral. Ignorando.`);
          threadProcessedSuccessfully = true;
          // Registra localmente para segurança
          createdEventsThisRun.push({ title: finalTitle, time: startDate.getTime() });
          return;
        }

        const event = calendar.createEvent(finalTitle, startDate, endDate, {
          description: description,
          location: location,
          guests: 'titarportela19@gmail.com',
          sendInvites: true
        });
        
        Logger.log(`[SUCESSO] Evento '${finalTitle}' criado na agenda! ID: ${event.getId()}`);
        
        // Registra o evento criado nesta execução
        createdEventsThisRun.push({
          title: finalTitle,
          time: startDate.getTime()
        });
        
        threadProcessedSuccessfully = true;
      } catch (e) {
        Logger.log(`[ERRO] Falha ao criar evento para o e-mail ${message.getId()}: ${e.toString()}`);
      }
    });
    
    // 3. Só aplica a label de processado se o evento foi criado ou validado como existente
    if (threadProcessedSuccessfully) {
      thread.addLabel(label);
      Logger.log(`Thread ID: ${thread.getId()} marcada com "${LABEL_NAME}"`);
    }
  });
}

/**
 * Remove qualquer histórico de resposta / texto citado (quote) de e-mails passados.
 */
function stripQuotedText(text) {
  const quoteMarkers = [
    /^[> \t]*Em\s+.*escreveu:/mi,
    /^[> \t]*On\s+.*wrote:/mi,
    /^[> \t]*---------- Forwarded message ---------/mi,
    /^[> \t]*---------- Mensagem encaminhada ---------/mi
  ];
  
  let cleanText = text;
  for (const marker of quoteMarkers) {
    const match = cleanText.match(marker);
    if (match) {
      cleanText = cleanText.substring(0, match.index);
    }
  }
  
  return cleanText;
}

/**
 * Normaliza e extrai data e hora de uma string de corpo de e-mail.
 */
function parseEmailBody(body) {
  const quandoIdx = body.toLowerCase().indexOf("quando:");
  if (quandoIdx === -1) {
    return null;
  }
  
  const textAfterQuando = body.substring(quandoIdx);
  
  // 1. Busca pelo padrão de data (ex: "30 de Maio de 2026" ou "30 de mai. de 2026")
  const datePartsRegex = /(\d{1,2})\s+de\s+([a-zA-Záàâãéèêíïóôõöúç.]+)\s+de\s+(\d{4})/i;
  const dateMatch = textAfterQuando.match(datePartsRegex);
  if (!dateMatch) {
    return null;
  }
  
  const day = parseInt(dateMatch[1], 10);
  const monthStr = dateMatch[2];
  const year = parseInt(dateMatch[3], 10);
  
  const monthIndex = getMonthIndex(monthStr);
  if (monthIndex === undefined) {
    return null;
  }
  
  // 2. Busca pelo padrão de hora e minutos (ex: "14:45" ou "14h45")
  const timeRegex = /(\d{1,2})[h:](\d{2})/i;
  const timeMatchReal = textAfterQuando.match(timeRegex);
  if (!timeMatchReal) {
    return null;
  }
  
  const hour = parseInt(timeMatchReal[1], 10);
  const minute = parseInt(timeMatchReal[2], 10);
  
  return {
    day,
    monthIndex,
    year,
    hour,
    minute
  };
}

/**
 * Retorna o índice de 0 a 11 do mês a partir do nome ou abreviação em português.
 */
function getMonthIndex(monthStr) {
  const clean = monthStr.replace('.', '').toLowerCase().trim();
  
  const monthsMap = {
    'janeiro': 0, 'jan': 0,
    'fevereiro': 1, 'fev': 1,
    'março': 2, 'mar': 2,
    'abril': 3, 'abr': 3,
    'maio': 4, 'mai': 4,
    'junho': 5, 'jun': 5,
    'julho': 6, 'jul': 6,
    'agosto': 7, 'ago': 7,
    'setembro': 8, 'set': 8,
    'outubro': 9, 'out': 9,
    'novembro': 10, 'nov': 10,
    'dezembro': 11, 'dez': 11
  };
  
  return monthsMap[clean];
}

/**
 * Remove a label 'Talula-Adicionado' de todas as threads.
 */
function resetLabels() {
  const label = GmailApp.getUserLabelByName("Talula-Adicionado");
  if (label) {
    const threads = label.getThreads();
    threads.forEach(thread => {
      thread.removeLabel(label);
    });
    Logger.log("Todas as labels 'Talula-Adicionado' foram removidas com sucesso para re-teste!");
  }
}

