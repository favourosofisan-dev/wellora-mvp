(function () {
  const storagePrefix = "welloraGuideSeen:";
  const guidePages = {
    "signup.html": [
      {
        title: "Create your account",
        body: "Use your email and a password to start Wellora. Supabase may ask you to confirm your email before signing in."
      },
      {
        title: "Privacy first",
        body: "Wellora keeps the sign-up flow simple and uses your account only to support your wellness experience."
      }
    ],
    "login.html": [
      {
        title: "Welcome back",
        body: "Sign in with your email and password. If your email is not confirmed yet, check the Supabase confirmation message."
      },
      {
        title: "Need help?",
        body: "Use the password reset link if you cannot get into your account."
      }
    ],
    "onboarding.html": [
      {
        title: "Set your comfort level",
        body: "Choose the wellness goal that matters most today. You can change your preferences later from Profile."
      },
      {
        title: "Read the consent",
        body: "Confirm that Wellora is educational wellness support, not medical care or emergency service, before continuing."
      }
    ],
    "home.html": [
      {
        title: "Choose a category",
        body: "Start from any wellness category. Each card opens routines designed for calm, steady movement."
      },
      {
        title: "Your language stays saved",
        body: "The language you choose is saved on this device and follows you through supported Wellora pages."
      }
    ],
    "category.html": [
      {
        title: "Pick a routine",
        body: "Review the routines in this category and tap Start when one feels right for today."
      },
      {
        title: "Move gently",
        body: "Choose the session that fits your energy. It is okay to start small."
      }
    ],
    "exercise.html": [
      {
        title: "Safety comes first",
        body: "Complete the safety check before starting. Stop immediately if you feel dizzy, chest pain, severe shortness of breath, or unusual discomfort."
      },
      {
        title: "Use the timer",
        body: "Pick a comfortable duration, press Start, and use Read Aloud if you want the steps spoken clearly."
      }
    ],
    "completion.html": [
      {
        title: "Session saved",
        body: "After completing an exercise, Wellora records your progress and can help you move to another routine."
      }
    ],
    "progress.html": [
      {
        title: "Track your movement",
        body: "See completed exercises, active minutes, and your current streak in one gentle progress view."
      },
      {
        title: "Recent activity",
        body: "Your latest sessions appear here so you can notice patterns over time."
      }
    ],
    "profile.html": [
      {
        title: "Manage your details",
        body: "Update your goal, fitness level, reminders, and larger text preference from this page."
      },
      {
        title: "Caregiver sharing",
        body: "Use reports when you want to share a simple wellness summary with someone who supports you."
      }
    ],
    "reminders.html": [
      {
        title: "Set gentle reminders",
        body: "Choose reminder settings that help you return to movement without pressure."
      }
    ],
    "reports.html": [
      {
        title: "Create a report",
        body: "Generate a simple summary that can be shared with a caregiver or healthcare supporter."
      }
    ]
  };

  const uiText = {
    en: {
      label: "Guide",
      eyebrow: "Wellora guide",
      next: "Next",
      back: "Back",
      done: "Done",
      skip: "Skip",
      replay: "Open page guide"
    },
    es: {
      label: "Guia",
      eyebrow: "Guia de Wellora",
      next: "Siguiente",
      back: "Atras",
      done: "Listo",
      skip: "Omitir",
      replay: "Abrir guia"
    },
    fr: {
      label: "Guide",
      eyebrow: "Guide Wellora",
      next: "Suivant",
      back: "Retour",
      done: "Terminer",
      skip: "Passer",
      replay: "Ouvrir le guide"
    },
    zh: {
      label: "指南",
      eyebrow: "Wellora 指南",
      next: "下一步",
      back: "返回",
      done: "完成",
      skip: "跳过",
      replay: "打开页面指南"
    }
  };

  const localizedSteps = {
    es: {
      "signup.html": [
        { title: "Crea tu cuenta", body: "Usa tu email y una contrasena para empezar Wellora. Supabase puede pedirte confirmar tu email antes de iniciar sesion." },
        { title: "Privacidad primero", body: "Wellora mantiene el registro simple y usa tu cuenta solo para apoyar tu experiencia de bienestar." }
      ],
      "onboarding.html": [
        { title: "Elige tu comodidad", body: "Selecciona la meta de bienestar mas importante hoy. Puedes cambiarla despues en Perfil." },
        { title: "Lee el consentimiento", body: "Confirma que Wellora es apoyo educativo de bienestar, no atencion medica ni servicio de emergencia." }
      ],
      "home.html": [
        { title: "Elige una categoria", body: "Empieza desde cualquier categoria. Cada tarjeta abre rutinas para movimiento tranquilo y constante." },
        { title: "Tu idioma queda guardado", body: "El idioma elegido se guarda en este dispositivo y se aplica en las paginas compatibles." }
      ],
      "exercise.html": [
        { title: "La seguridad primero", body: "Completa la revision de seguridad antes de empezar. Detente si sientes mareo, dolor en el pecho, falta de aire fuerte o malestar." },
        { title: "Usa el temporizador", body: "Elige una duracion comoda, pulsa Iniciar y usa Leer en voz alta si quieres escuchar los pasos." }
      ],
      "progress.html": [
        { title: "Sigue tu movimiento", body: "Mira ejercicios completados, minutos activos y tu racha actual en una vista suave." }
      ],
      "profile.html": [
        { title: "Gestiona tus datos", body: "Actualiza tu meta, nivel fisico, recordatorios y texto grande desde esta pagina." }
      ]
    },
    fr: {
      "signup.html": [
        { title: "Creez votre compte", body: "Utilisez votre email et un mot de passe pour commencer. Supabase peut demander une confirmation par email." },
        { title: "Confidentialite d'abord", body: "Wellora garde l'inscription simple et utilise votre compte pour soutenir votre experience bien-etre." }
      ],
      "onboarding.html": [
        { title: "Choisissez votre confort", body: "Selectionnez l'objectif bien-etre le plus important aujourd'hui. Vous pourrez le modifier dans Profil." },
        { title: "Lisez le consentement", body: "Confirmez que Wellora est un support educatif de bien-etre, pas un soin medical ni un service d'urgence." }
      ],
      "home.html": [
        { title: "Choisissez une categorie", body: "Commencez par n'importe quelle categorie. Chaque carte ouvre des routines douces et regulieres." },
        { title: "Votre langue reste enregistree", body: "La langue choisie est enregistree sur cet appareil et suit les pages compatibles." }
      ],
      "exercise.html": [
        { title: "La securite d'abord", body: "Completez le controle de securite avant de commencer. Arretez en cas d'etourdissement, douleur thoracique ou malaise." },
        { title: "Utilisez le minuteur", body: "Choisissez une duree confortable, touchez Demarrer et utilisez Lire a voix haute si besoin." }
      ],
      "progress.html": [
        { title: "Suivez vos mouvements", body: "Consultez vos exercices termines, vos minutes actives et votre serie actuelle." }
      ],
      "profile.html": [
        { title: "Gerez vos informations", body: "Modifiez votre objectif, niveau physique, rappels et preference de texte plus grand." }
      ]
    },
    zh: {
      "signup.html": [
        { title: "创建账户", body: "使用电子邮件和密码开始使用 Wellora。Supabase 可能会要求您先确认电子邮件。" },
        { title: "隐私优先", body: "Wellora 保持注册流程简单，并仅使用账户支持您的健康体验。" }
      ],
      "onboarding.html": [
        { title: "设置舒适目标", body: "选择今天最重要的健康目标。之后可以在个人资料中更改。" },
        { title: "阅读同意说明", body: "确认 Wellora 是教育性健康支持，不是医疗护理或紧急服务。" }
      ],
      "home.html": [
        { title: "选择类别", body: "从任意健康类别开始。每张卡片都会打开温和稳定的练习。" },
        { title: "语言会被保存", body: "您选择的语言会保存在此设备上，并应用到支持的页面。" }
      ],
      "exercise.html": [
        { title: "安全第一", body: "开始前请完成安全检查。如出现头晕、胸痛、严重气短或异常不适，请立即停止。" },
        { title: "使用计时器", body: "选择舒适的时长，点击开始；需要时可使用朗读功能。" }
      ],
      "progress.html": [
        { title: "查看运动进度", body: "查看已完成练习、活动分钟数和当前连续记录。" }
      ],
      "profile.html": [
        { title: "管理您的信息", body: "在此更新目标、体能水平、提醒和大字模式偏好。" }
      ]
    }
  };

  let currentIndex = 0;
  let steps = [];
  let pageKey = "";

  function getPageKey() {
    const path = window.location.pathname.split("/").pop();
    return path || "index.html";
  }

  function getLanguage() {
    return window.WelloraI18n && window.WelloraI18n.getLanguage
      ? window.WelloraI18n.getLanguage()
      : "en";
  }

  function getUiText() {
    const language = getLanguage();
    return uiText[language] || uiText.en;
  }

  function getSteps(key) {
    const language = getLanguage();
    return (localizedSteps[language] && localizedSteps[language][key]) || guidePages[key] || [];
  }

  function createGuideButton() {
    const navButton = document.getElementById("navGuideButton");
    if (navButton) {
      navButton.addEventListener("click", function (event) {
        event.preventDefault();
        openGuide(false);
      });
    }
  }

  function ensureGuideShell() {
    if (document.getElementById("welloraGuideOverlay")) {
      return;
    }

    const overlay = document.createElement("section");
    overlay.className = "wellora-guide-overlay hidden";
    overlay.id = "welloraGuideOverlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML =
      '<div class="wellora-guide-card" role="dialog" aria-modal="true" aria-labelledby="welloraGuideTitle">' +
        '<div class="wellora-guide-head">' +
          '<p class="wellora-guide-eyebrow" id="welloraGuideEyebrow"></p>' +
          '<button class="wellora-guide-close" type="button" id="welloraGuideClose" aria-label="Close">×</button>' +
        "</div>" +
        '<h2 class="wellora-guide-title" id="welloraGuideTitle"></h2>' +
        '<p class="wellora-guide-body" id="welloraGuideBody"></p>' +
        '<p class="wellora-guide-count" id="welloraGuideCount"></p>' +
        '<div class="wellora-guide-actions">' +
          '<button class="wellora-guide-secondary" type="button" id="welloraGuideSkip"></button>' +
          '<button class="wellora-guide-secondary" type="button" id="welloraGuideBack"></button>' +
          '<button class="wellora-guide-primary" type="button" id="welloraGuideNext"></button>' +
        "</div>" +
      "</div>";

    document.body.appendChild(overlay);
    document.getElementById("welloraGuideClose").addEventListener("click", closeGuide);
    document.getElementById("welloraGuideSkip").addEventListener("click", closeGuide);
    document.getElementById("welloraGuideBack").addEventListener("click", function () {
      currentIndex = Math.max(0, currentIndex - 1);
      renderGuide();
    });
    document.getElementById("welloraGuideNext").addEventListener("click", function () {
      if (currentIndex >= steps.length - 1) {
        closeGuide();
        return;
      }

      currentIndex += 1;
      renderGuide();
    });
  }

  function renderGuide() {
    const text = getUiText();
    const step = steps[currentIndex];

    if (!step) {
      return;
    }

    document.getElementById("welloraGuideEyebrow").textContent = text.eyebrow;
    document.getElementById("welloraGuideTitle").textContent = step.title;
    document.getElementById("welloraGuideBody").textContent = step.body;
    document.getElementById("welloraGuideCount").textContent = (currentIndex + 1) + " / " + steps.length;
    document.getElementById("welloraGuideSkip").textContent = text.skip;
    document.getElementById("welloraGuideBack").textContent = text.back;
    document.getElementById("welloraGuideNext").textContent = currentIndex >= steps.length - 1 ? text.done : text.next;
    document.getElementById("welloraGuideBack").disabled = currentIndex === 0;
  }

  function openGuide(markAutomatic) {
    if (!steps.length || document.body.classList.contains("legal-page")) {
      return;
    }

    ensureGuideShell();
    currentIndex = 0;
    renderGuide();

    const overlay = document.getElementById("welloraGuideOverlay");
    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden", "false");

    if (markAutomatic) {
      localStorage.setItem(storagePrefix + pageKey, "true");
    }
  }

  function closeGuide() {
    const overlay = document.getElementById("welloraGuideOverlay");

    if (!overlay) {
      return;
    }

    overlay.classList.add("hidden");
    overlay.setAttribute("aria-hidden", "true");
    localStorage.setItem(storagePrefix + pageKey, "true");
  }

  function bootGuide() {
    pageKey = getPageKey();
    steps = getSteps(pageKey);

    if (!steps.length || document.body.classList.contains("legal-page")) {
      return;
    }

    createGuideButton();

    if (!localStorage.getItem(storagePrefix + pageKey)) {
      window.setTimeout(function () {
        openGuide(true);
      }, 650);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootGuide);
  } else {
    bootGuide();
  }

  window.addEventListener("wellora:languagechange", function () {
    pageKey = getPageKey();
    steps = getSteps(pageKey);
    const button = document.querySelector(".wellora-guide-button");

    if (button) {
      const text = getUiText();
      button.textContent = text.label;
      button.setAttribute("aria-label", text.replay);
    }

    const overlay = document.getElementById("welloraGuideOverlay");
    if (overlay && !overlay.classList.contains("hidden")) {
      renderGuide();
    }
  });
})();
