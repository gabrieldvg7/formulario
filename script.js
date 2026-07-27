const questions = [
  {
    id: "companyName",
    type: "text",
    title: "Qual é o nome da sua empresa?",
    placeholder: "Ex.: GVConsul",
    buttonLabel: "Continuar",
    inputType: "text",
    maxLength: 80
  },
  {
    id: "revenue",
    type: "choice",
    title: "Qual é o faturamento médio mensal da empresa hoje?",
    options: [
      "Até R$ 15 mil",
      "Entre R$ 15 mil e R$ 30 mil",
      "Entre R$ 30 mil e R$ 60 mil",
      "Acima de R$ 60 mil"
    ]
  },
  {
    id: "budget",
    type: "choice",
    title: "Além da gestão de tráfego, também será necessário investir diretamente em anúncios. Você já possui esse orçamento disponível?",
    options: ["Já tenho esse orçamento reservado", "Consigo me organizar para investir", "Ainda não tenho esse orçamento"]
  },
  {
    id: "videos",
    type: "choice",
    title: "Sua empresa já possui fotos e vídeos reais mostrando seus produtos ou serviços?",
    options: [
      "Sim, já temos fotos e vídeos",
      "Temos apenas fotos",
      "Temos apenas vídeos",
      "Não temos nenhum material"
    ]
  },
  {
    id: "capacity",
    type: "choice",
    title: "Se começarem a chegar mais clientes nas próximas semanas, sua empresa consegue atender essa demanda?",
    options: ["Sim", "Mais ou menos", "Não, estamos no limite"]
  },
  {
    id: "companyWhat",
    type: "text",
    title: "Qual é o principal serviço que sua empresa vende?",
    placeholder: "Descreva seu principal serviço",
    buttonLabel: "Continuar",
    inputType: "text",
    maxLength: 120
  },
  {
    id: "difficulty",
    type: "choice",
    title: "Hoje, o que mais impede sua empresa de conseguir mais clientes?",
    options: [
      "Meu WhatsApp recebe poucas mensagens",
      "Recebo mensagens, mas poucas viram clientes",
      "Dependo principalmente de indicação",
      "Já anuncio, mas quero resultados mais previsíveis"
    ]
  },
  {
    id: "fullName",
    type: "text",
    title: "Qual é o seu nome completo?",
    placeholder: "Seu nome",
    buttonLabel: "Continuar",
    inputType: "text",
    maxLength: 100
  },
  {
    id: "phone",
    type: "text",
    title: "Qual é o seu melhor WhatsApp?",
    placeholder: "(11) 99999-9999",
    buttonLabel: "Continuar",
    inputType: "tel"
  },
  {
    id: "email",
    type: "text",
    title: "Qual é o seu e-mail?",
    placeholder: "seu@email.com",
    buttonLabel: "Continuar",
    inputType: "email"
  },
  {
    id: "consent",
    type: "consent",
    title: "Consentimento LGPD",
    description: "Para dar continuidade, precisamos que você aceite a política de privacidade."
  }
];

const state = {
  currentStep: 0,
  responses: {},
  screen: "form",
  disqualificationReason: null,
  navigationStack: [],
  isSubmitting: false,
  submitError: null
};

const progressFill = document.getElementById("progress-fill");
const stepCounter = document.getElementById("step-counter");
const screen = document.getElementById("screen");

function trackMetaEvent(eventName) {
  if (typeof window.fbq === "function") {
    window.fbq("track", eventName);
  }
}

function init() {
  render();
}

function render() {
  if (state.screen === "disqualified") {
    renderDisqualified();
    return;
  }

  if (state.screen === "thanks") {
    renderThanks();
    return;
  }

  const question = questions[state.currentStep];
  updateProgress();
  screen.innerHTML = `
    <div class="screen-card">
      <p class="eyebrow">Conversa rápida</p>
      <h1 class="question-title">${question.title}</h1>
      ${question.description ? `<p class="question-description">${question.description}</p>` : ""}
      <div class="question-body">
        ${renderQuestionBody(question)}
      </div>
    </div>
  `;
  bindEvents(question);
}

function renderQuestionBody(question) {
  if (question.type === "choice") {
    return `
      <div class="choice-list">
        ${question.options
          .map((option) => {
            const isActive = state.responses[question.id] === option;
            return `<button class="choice-option ${isActive ? "is-selected" : ""}" data-choice="${option}">${option}</button>`;
          })
          .join("")}
      </div>
      <div class="actions">
        ${state.currentStep > 0 && state.screen === "form"
          ? '<button class="back-button" id="back-button" aria-label="Voltar para a pergunta anterior" type="button">← Voltar</button>'
          : ""}
      </div>
    `;
  }

  if (question.type === "consent") {
    return `
      <div class="consent-row">
        <input id="consent-checkbox" type="checkbox" />
        <label for="consent-checkbox">
          Li e concordo com a <a class="consent-link" href="#">Política de Privacidade</a>.
        </label>
      </div>
      <div class="actions single">
        <button class="primary-btn" id="submit-btn" ${state.isSubmitting ? "disabled" : ""}>${state.isSubmitting ? "Enviando..." : "Enviar"}</button>
      </div>
      <p class="field-error" id="field-error">${state.submitError || ""}</p>
    `;
  }

  return `
    <div class="input-wrap">
      <input id="answer-input" class="input-field" type="${question.inputType || "text"}" placeholder="${question.placeholder || "Digite sua resposta"}" value="${state.responses[question.id] || ""}" ${question.maxLength ? `maxlength="${question.maxLength}"` : ""} />
      <div class="actions">
        ${state.currentStep > 0 && state.screen === "form"
          ? '<button class="back-button" id="back-button" aria-label="Voltar para a pergunta anterior" type="button">← Voltar</button>'
          : ""}
        <button class="primary-btn" id="next-btn" ${question.id === "phone" ? "disabled" : ""}>${question.buttonLabel || "Continuar"}</button>
      </div>
      <p class="field-error" id="field-error"></p>
    </div>
  `;
}

function bindEvents(question) {
  if (question.type === "choice") {
    document.querySelectorAll(".choice-option").forEach((button) => {
      button.addEventListener("click", () => handleChoiceSelect(question, button.dataset.choice));
    });

    const backBtn = document.getElementById("back-button");
    if (backBtn) {
      backBtn.addEventListener("click", goBack);
    }

    return;
  }

  if (question.type === "consent") {
    const checkbox = document.getElementById("consent-checkbox");
    const submitBtn = document.getElementById("submit-btn");
    const error = document.getElementById("field-error");

    if (checkbox) {
      checkbox.checked = Boolean(state.responses[question.id]);
      checkbox.addEventListener("change", () => {
        if (error) error.style.display = "none";
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener("click", handleConsentSubmit);
    }
    return;
  }

  const input = document.getElementById("answer-input");
  const nextBtn = document.getElementById("next-btn");
  const backBtn = document.getElementById("back-button");
  const error = document.getElementById("field-error");

  if (input) {
    input.addEventListener("input", (event) => {
      const rawValue = event.target.value;
      const sanitizedValue = question.maxLength ? rawValue.slice(0, question.maxLength) : rawValue;

      if (question.id === "phone") {
        const maskedValue = formatPhone(sanitizedValue);
        input.value = maskedValue;
        state.responses[question.id] = maskedValue;
      } else {
        input.value = sanitizedValue;
        state.responses[question.id] = sanitizedValue;
      }

      if (error) error.style.display = "none";
      syncActionButtonState(question);
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleTextAdvance(question);
      }
    });
  }

  syncActionButtonState(question);

  if (nextBtn) {
    nextBtn.addEventListener("click", () => handleTextAdvance(question));
  }

  if (backBtn) {
    backBtn.addEventListener("click", goBack);
  }
}

function handleTextAdvance(question) {
  const value = (state.responses[question.id] || "").trim();

  if (!value) {
    showError("Por favor, preencha este campo para continuar.");
    return;
  }

  if (question.id === "email" && !isValidEmail(value)) {
    showError("Por favor, insira um e-mail válido.");
    return;
  }

  if (question.id === "phone" && !isValidPhone(value)) {
    showError("Por favor, informe um WhatsApp válido.");
    return;
  }

  state.responses[question.id] = value;
  goForward();
}

function handleChoiceSelect(question, value) {
  state.responses[question.id] = value;

  if (question.id === "revenue" && value === "Até R$ 15 mil") {
    state.disqualificationReason = "revenue";
    state.screen = "disqualified";
    render();
    return;
  }

  if (question.id === "budget" && value === "Ainda não tenho esse orçamento") {
    state.disqualificationReason = "budget";
    state.screen = "disqualified";
    render();
    return;
  }

  if (question.id === "videos" && value === "Não temos nenhum material") {
    state.disqualificationReason = "videos";
    state.screen = "disqualified";
    render();
    return;
  }

  if (question.id === "capacity" && value === "Não, estamos no limite") {
    state.disqualificationReason = "capacity";
    state.screen = "disqualified";
    render();
    return;
  }

  goForward();
}

function getSubmissionEndpoint() {
  return new URL('/lead', window.location.href).toString();
}

async function handleConsentSubmit() {
  const checkbox = document.getElementById("consent-checkbox");
  const error = document.getElementById("field-error");

  if (!checkbox || !checkbox.checked) {
    if (error) {
      error.textContent = "Você precisa aceitar a política de privacidade para enviar.";
      error.style.display = "block";
    }
    return;
  }

  state.responses.consent = true;

  if (state.isSubmitting) {
    return;
  }

  state.isSubmitting = true;
  state.submitError = null;
  render();

  const payloadToSend = mapResponsesToPayload();
  console.log("[form] Enviando lead", payloadToSend);

  try {
    const endpoint = getSubmissionEndpoint();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadToSend)
    });

    const responseText = await response.text();
    let payload = {};

    try {
      payload = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error("[form] Falha ao interpretar resposta do backend", parseError);
      payload = {};
    }

    console.log("[form] Resposta do envio", { status: response.status, payload });

    if (!response.ok || !payload.success) {
      throw new Error(payload.message || 'Erro ao enviar o lead.');
    }

    trackMetaEvent('Lead');
    state.screen = 'thanks';
    console.log('[form] Respostas do formulário:', state.responses);
    render();
  } catch (error) {
    console.error('[form] Falha ao enviar lead', error);
    state.isSubmitting = false;
    state.submitError = error.message || 'Não foi possível enviar suas informações.';
    render();
  }
}

function goForward() {
  if (state.screen !== "form") {
    return;
  }

  if (state.currentStep < questions.length - 1) {
    state.navigationStack.push(state.currentStep);
    state.currentStep += 1;
    render();
    return;
  }

  state.screen = "thanks";
  console.log("Respostas do formulário:", state.responses);
  render();
}

function goBack() {
  if (state.screen !== "form" || state.currentStep <= 0) {
    return;
  }

  const previousStep = state.navigationStack.pop();
  if (typeof previousStep === "number") {
    state.currentStep = previousStep;
    render();
    return;
  }

  state.currentStep -= 1;
  render();
}

function renderThanks() {
  updateProgress(100);
  screen.innerHTML = `
    <div class="thanks-card">
      <p class="eyebrow">Pronto</p>
      <h1>Perfeito!</h1>
      <p>Pelas suas respostas, acreditamos que faz sentido conversarmos. Recebemos suas informações e, em breve, entraremos em contato pelo WhatsApp informado para agendar sua Reunião de Crescimento.</p>
      <span class="inline-note">Sua resposta foi registrada apenas no navegador para esta versão MVP.</span>
    </div>
  `;
}

function mapResponsesToPayload() {
  return {
    companyName: state.responses.companyName || '',
    revenue: state.responses.revenue || '',
    budget: state.responses.budget || '',
    videos: state.responses.videos || '',
    capacity: state.responses.capacity || '',
    companyWhat: state.responses.companyWhat || '',
    difficulty: state.responses.difficulty || '',
    fullName: state.responses.fullName || '',
    phone: state.responses.phone || '',
    email: state.responses.email || '',
    consent: Boolean(state.responses.consent)
  };
}

function renderDisqualified() {
  const reasonContent = {
    revenue: {
      title: "Neste momento, talvez ainda não seja a hora certa.",
      message: "A GVConsul acredita que, neste estágio, ainda não é o momento ideal para iniciar um trabalho conjunto. O faturamento atual pode indicar que a estrutura precisa de mais maturidade antes de avançar com esse tipo de parceria."
    },
    budget: {
      title: "Neste momento, talvez ainda não seja a hora certa.",
      message: "A GVConsul acredita que, neste estágio, ainda não é o momento ideal para iniciar um trabalho conjunto. O investimento em mídia ainda pode ser um passo muito importante para o próximo ciclo, mas talvez ainda não esteja alinhado com a realidade atual da empresa."
    },
    videos: {
      title: "Neste momento, talvez ainda não seja a hora certa.",
      message: "Neste momento, percebemos que sua empresa ainda não possui fotos ou vídeos que possam ser utilizados na criação das campanhas. Nossa metodologia depende de materiais reais da empresa para produzir anúncios que gerem resultados consistentes. Quando vocês tiverem esse conteúdo, será um prazer conversar novamente."
    },
    capacity: {
      title: "Neste momento, talvez ainda não seja a hora certa.",
      message: "A GVConsul acredita que, neste estágio, ainda não é o momento ideal para iniciar um trabalho conjunto. A capacidade operacional atual pode ainda não estar preparada para absorver um aumento relevante de demanda."
    }
  };

  const content = reasonContent[state.disqualificationReason] || {
    title: "Neste momento, talvez ainda não seja a hora certa.",
    message: "A GVConsul acredita que, neste estágio, ainda não é o momento ideal para iniciar um trabalho conjunto. Acreditamos que existe um caminho mais adequado para esse momento da empresa."
  };

  screen.innerHTML = `
    <div class="disqualified-card">
      <p class="eyebrow">Etapa encerrada</p>
      <h1>${content.title}</h1>
      <p>${content.message}</p>
    </div>
  `;
}

function updateProgress(value) {
  const percent = value ?? Math.round(((state.currentStep + 1) / questions.length) * 100);
  progressFill.style.width = `${Math.min(percent, 100)}%`;
  stepCounter.textContent = `Pergunta ${Math.min(state.currentStep + 1, questions.length)} de ${questions.length}`;
}

function showError(message) {
  const error = document.getElementById("field-error");
  if (error) {
    error.textContent = message;
    error.style.display = "block";
  }
}

function syncActionButtonState(question) {
  const nextBtn = document.getElementById("next-btn");
  if (!nextBtn) return;

  if (question.id === "phone") {
    nextBtn.disabled = !isValidPhone(state.responses[question.id] || "");
    nextBtn.classList.toggle("is-disabled", nextBtn.disabled);
    return;
  }

  if (question.id === "email") {
    nextBtn.disabled = !isValidEmail((state.responses[question.id] || "").trim());
    nextBtn.classList.toggle("is-disabled", nextBtn.disabled);
    return;
  }

  nextBtn.disabled = false;
  nextBtn.classList.remove("is-disabled");
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function isValidPhone(value) {
  const normalized = value.replace(/\D/g, "");
  return normalized.length >= 10 && normalized.length <= 11;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

window.addEventListener("DOMContentLoaded", init);
