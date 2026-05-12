(function () {
  const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
  const speechSynthesisApi = window.speechSynthesis || null;
  const voiceLogStorageKey = "welloraVoiceLogs";
  const voicePositionStorageKey = "welloraVoiceDockPosition";
  const helpCommands = [
    'Say "Go home"',
    'Say "Open progress"',
    'Say "Open profile"',
    'Say "Show balance and stability"',
    'Say "Start Heel Toe Walk"',
    'Say "Click complete"',
    'Say "Choose seated"',
    'Say "Tap to record"',
    'Say "Go back"',
    'Say "Help me"'
  ];
  const stopWords = new Set([
    "a", "an", "and", "for", "go", "i", "im", "is", "me", "my", "now", "of", "on", "open",
    "please", "show", "start", "tap", "the", "this", "to", "up", "with"
  ]);

  let recognition = null;
  let isListening = false;
  let popupElement = null;
  let dockElement = null;
  let buttonElement = null;
  let labelElement = null;
  let popupHideTimeoutId = null;
  let remoteVoiceLoggingDisabled = false;
  let suppressNextToggle = false;
  let dragState = null;

  function getCurrentPageName() {
    const path = window.location.pathname || "";
    const segments = path.split("/").filter(Boolean);
    return segments.length ? segments[segments.length - 1] : "index.html";
  }

  function getExerciseId() {
    const params = new URLSearchParams(window.location.search);
    const idFromQuery = params.get("id");

    if (idFromQuery) {
      return idFromQuery;
    }

    const exerciseIdValue = document.getElementById("exerciseIdValue");
    if (exerciseIdValue) {
      const text = String(exerciseIdValue.textContent || "").trim();
      return text && text !== "-" ? text : "";
    }

    return "";
  }

  function updateVoiceContext() {
    window.WelloraVoiceContext = window.WelloraVoiceContext || {};
    window.WelloraVoiceContext.currentPage = getCurrentPageName();
    window.WelloraVoiceContext.exerciseId = getExerciseId();
    return window.WelloraVoiceContext;
  }

  function injectStyles() {
    if (document.getElementById("welloraVoiceControlStyles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "welloraVoiceControlStyles";
    style.textContent = [
      ".wellora-voice-dock {",
      "  position: fixed;",
      "  left: 0;",
      "  top: 0;",
      "  display: grid;",
      "  justify-items: center;",
      "  gap: 8px;",
      "  z-index: 9999;",
      "  touch-action: none;",
      "  user-select: none;",
      "  width: max-content;",
      "}",
      ".wellora-voice-button {",
      "  width: 88px;",
      "  height: 88px;",
      "  border: 0;",
      "  border-radius: 50%;",
      "  display: grid;",
      "  place-items: center;",
      "  background: linear-gradient(180deg, #a35b35 0%, #8a4c2b 100%);",
      "  color: #ffffff;",
      "  box-shadow: 0 14px 28px rgba(138, 76, 43, 0.3);",
      "  cursor: pointer;",
      "  touch-action: none;",
      "}",
      ".wellora-voice-button svg {",
      "  width: 40px;",
      "  height: 40px;",
      "  stroke: currentColor;",
      "  fill: none;",
      "  stroke-width: 2;",
      "  stroke-linecap: round;",
      "  stroke-linejoin: round;",
      "}",
      ".wellora-voice-button.is-listening {",
      "  animation: welloraVoicePulse 1.4s ease-in-out infinite;",
      "}",
      ".wellora-voice-label {",
      "  display: inline-flex;",
      "  align-items: center;",
      "  justify-content: center;",
      "  min-width: 104px;",
      "  min-height: 30px;",
      "  padding: 6px 10px;",
      "  border-radius: 999px;",
      "  background: rgba(255, 250, 245, 0.98);",
      "  border: 1px solid rgba(138, 76, 43, 0.18);",
      "  box-shadow: 0 10px 22px rgba(89, 63, 48, 0.12);",
      "  color: #6f381b;",
      "  font: 700 0.84rem/1.2 Arial, Helvetica, sans-serif;",
      "  text-align: center;",
      "  white-space: nowrap;",
      "  touch-action: none;",
      "}",
      ".wellora-voice-label.is-listening {",
      "  background: rgba(138, 76, 43, 0.96);",
      "  color: #fffaf5;",
      "}",
      ".wellora-voice-popup {",
      "  position: fixed;",
      "  width: min(320px, calc(100vw - 32px));",
      "  padding: 16px;",
      "  border-radius: 20px;",
      "  background: rgba(255, 250, 245, 0.98);",
      "  border: 1px solid rgba(138, 76, 43, 0.22);",
      "  box-shadow: 0 16px 30px rgba(71, 61, 53, 0.16);",
      "  color: #2d241f;",
      "  font-family: Arial, Helvetica, sans-serif;",
      "  z-index: 9999;",
      "}",
      ".wellora-voice-popup[hidden] {",
      "  display: none;",
      "}",
      ".wellora-voice-popup h2 {",
      "  margin: 0 0 10px;",
      "  font-size: 1.1rem;",
      "  line-height: 1.35;",
      "}",
      ".wellora-voice-popup ul {",
      "  margin: 0;",
      "  padding-left: 20px;",
      "}",
      ".wellora-voice-popup li {",
      "  margin: 0 0 8px;",
      "  font-size: 0.98rem;",
      "  line-height: 1.55;",
      "}",
      ".wellora-voice-popup p {",
      "  margin: 0 0 10px;",
      "  font-size: 0.98rem;",
      "  line-height: 1.55;",
      "}",
      "@keyframes welloraVoicePulse {",
      "  0% { box-shadow: 0 0 0 0 rgba(163, 91, 53, 0.4), 0 14px 28px rgba(138, 76, 43, 0.3); }",
      "  70% { box-shadow: 0 0 0 14px rgba(163, 91, 53, 0), 0 14px 28px rgba(138, 76, 43, 0.3); }",
      "  100% { box-shadow: 0 0 0 0 rgba(163, 91, 53, 0), 0 14px 28px rgba(138, 76, 43, 0.3); }",
      "}",
      "@media (max-width: 480px) {",
      "  .wellora-voice-button { width: 76px; height: 76px; }",
      "  .wellora-voice-button svg { width: 34px; height: 34px; }",
      "  .wellora-voice-label { min-width: 96px; font-size: 0.78rem; }",
      "}"
    ].join("\n");

    document.head.appendChild(style);
  }

  function normalizeTranscript(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\w\s?']/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeForMatch(text) {
    return normalizeTranscript(text).replace(/\b(the|a|an)\b/g, " ").replace(/\s+/g, " ").trim();
  }

  function tokenize(text) {
    return normalizeForMatch(text)
      .split(" ")
      .filter(function (token) {
        return token && !stopWords.has(token);
      });
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function getDefaultDockPosition() {
    return {
      x: Math.max(16, window.innerWidth - 132),
      y: Math.max(16, window.innerHeight - 154)
    };
  }

  function saveDockPosition(position) {
    try {
      localStorage.setItem(voicePositionStorageKey, JSON.stringify(position));
    } catch (error) {
    }
  }

  function readDockPosition() {
    try {
      const stored = JSON.parse(localStorage.getItem(voicePositionStorageKey) || "null");
      return stored && Number.isFinite(stored.x) && Number.isFinite(stored.y) ? stored : null;
    } catch (error) {
      return null;
    }
  }

  function setDockPosition(x, y) {
    if (!dockElement) {
      return;
    }

    const rect = dockElement.getBoundingClientRect();
    const maxX = Math.max(16, window.innerWidth - rect.width - 16);
    const maxY = Math.max(16, window.innerHeight - rect.height - 16);
    const nextX = clamp(Math.round(x), 16, maxX);
    const nextY = clamp(Math.round(y), 16, maxY);

    dockElement.style.left = nextX + "px";
    dockElement.style.top = nextY + "px";
    saveDockPosition({ x: nextX, y: nextY });
    positionPopup();
  }

  function restoreDockPosition() {
    const stored = readDockPosition();
    const initial = stored || getDefaultDockPosition();
    setDockPosition(initial.x, initial.y);
  }

  function positionPopup() {
    if (!popupElement || !dockElement) {
      return;
    }

    const dockRect = dockElement.getBoundingClientRect();
    const popupWidth = Math.min(320, window.innerWidth - 32);
    const left = clamp(dockRect.right - popupWidth, 16, Math.max(16, window.innerWidth - popupWidth - 16));
    const top = dockRect.top - 16;

    popupElement.style.left = left + "px";
    popupElement.style.top = Math.max(16, top - popupElement.offsetHeight) + "px";
  }

  function buildPopup() {
    popupElement = document.createElement("aside");
    popupElement.className = "wellora-voice-popup";
    popupElement.hidden = true;
    popupElement.setAttribute("role", "status");
    popupElement.setAttribute("aria-live", "polite");
    popupElement.innerHTML =
      "<h2>Voice Commands</h2>" +
      "<p>Use simple, clear phrases:</p>" +
      "<ul>" +
      helpCommands.map(function (command) {
        return "<li>" + command + "</li>";
      }).join("") +
      "</ul>";
    document.body.appendChild(popupElement);
  }

  function showPopup(autoHide) {
    if (!popupElement) {
      return;
    }

    popupElement.hidden = false;
    positionPopup();

    if (popupHideTimeoutId) {
      window.clearTimeout(popupHideTimeoutId);
      popupHideTimeoutId = null;
    }

    if (autoHide) {
      popupHideTimeoutId = window.setTimeout(function () {
        hidePopup();
      }, 7000);
    }
  }

  function hidePopup() {
    if (!popupElement) {
      return;
    }

    popupElement.hidden = true;
  }

  function handleDockPointerDown(event) {
    if (!dockElement) {
      return;
    }

    event.preventDefault();

    dragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: dockElement.offsetLeft,
      originY: dockElement.offsetTop,
      moved: false
    };

    dockElement.setPointerCapture(event.pointerId);
  }

  function handleDockPointerMove(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) {
      return;
    }

    event.preventDefault();

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
      dragState.moved = true;
    }

    if (!dragState.moved) {
      return;
    }

    setDockPosition(dragState.originX + deltaX, dragState.originY + deltaY);
  }

  function handleDockPointerUp(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) {
      return;
    }

    if (dragState.moved) {
      suppressNextToggle = true;
      window.setTimeout(function () {
        suppressNextToggle = false;
      }, 0);
    }

    dragState = null;
  }

  function buildButton() {
    dockElement = document.createElement("div");
    dockElement.className = "wellora-voice-dock";
    dockElement.addEventListener("pointerdown", handleDockPointerDown);
    dockElement.addEventListener("pointermove", handleDockPointerMove);
    dockElement.addEventListener("pointerup", handleDockPointerUp);
    dockElement.addEventListener("pointercancel", handleDockPointerUp);

    buttonElement = document.createElement("button");
    buttonElement.type = "button";
    buttonElement.className = "wellora-voice-button";
    buttonElement.setAttribute("aria-label", "Start voice control");
    buttonElement.setAttribute("aria-pressed", "false");
    buttonElement.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M12 15a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z"></path>' +
        '<path d="M19 11a7 7 0 0 1-14 0"></path>' +
        '<path d="M12 18v3"></path>' +
        '<path d="M8 21h8"></path>' +
      "</svg>";
    buttonElement.addEventListener("click", function (event) {
      if (suppressNextToggle) {
        event.preventDefault();
        return;
      }

      toggleListening();
    });
    buttonElement.addEventListener("pointerdown", handleDockPointerDown);
    buttonElement.addEventListener("pointermove", handleDockPointerMove);
    buttonElement.addEventListener("pointerup", handleDockPointerUp);
    buttonElement.addEventListener("pointercancel", handleDockPointerUp);

    labelElement = document.createElement("div");
    labelElement.className = "wellora-voice-label";
    labelElement.textContent = "Tap to record";
    labelElement.addEventListener("pointerdown", handleDockPointerDown);
    labelElement.addEventListener("pointermove", handleDockPointerMove);
    labelElement.addEventListener("pointerup", handleDockPointerUp);
    labelElement.addEventListener("pointercancel", handleDockPointerUp);

    dockElement.appendChild(buttonElement);
    dockElement.appendChild(labelElement);
    document.body.appendChild(dockElement);
    restoreDockPosition();
  }

  function setListeningState(nextListening) {
    isListening = nextListening;

    if (!buttonElement || !labelElement) {
      return;
    }

    buttonElement.classList.toggle("is-listening", nextListening);
    labelElement.classList.toggle("is-listening", nextListening);
    labelElement.textContent = nextListening ? "Recording" : "Tap to record";
    buttonElement.setAttribute(
      "aria-label",
      nextListening ? "Stop voice control listening" : "Start voice control"
    );
    buttonElement.setAttribute("aria-pressed", nextListening ? "true" : "false");
  }

  function getSupabaseClient() {
    if (typeof window.createWelloraSupabaseClient !== "function") {
      return null;
    }

    try {
      return window.createWelloraSupabaseClient();
    } catch (error) {
      return null;
    }
  }

  async function saveVoiceLog(entry) {
    const localEntry = Object.assign(
      {
        created_at: new Date().toISOString()
      },
      entry
    );

    try {
      const existingLogs = JSON.parse(localStorage.getItem(voiceLogStorageKey) || "[]");
      existingLogs.unshift(localEntry);
      localStorage.setItem(voiceLogStorageKey, JSON.stringify(existingLogs.slice(0, 100)));
    } catch (error) {
    }

    if (remoteVoiceLoggingDisabled) {
      return;
    }

    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
      return;
    }

    try {
      const authResponse = await supabaseClient.auth.getUser();
      const userId = authResponse && authResponse.data && authResponse.data.user
        ? authResponse.data.user.id
        : null;

      const insertPayload = {
        user_id: userId,
        transcript: localEntry.transcript,
        normalized_command: localEntry.normalized_command,
        understood: localEntry.understood,
        page_name: localEntry.page_name,
        exercise_id: localEntry.exercise_id || null
      };

      const response = await supabaseClient.from("voice_logs").insert(insertPayload);

      if (response && response.error) {
        remoteVoiceLoggingDisabled = true;
      }
    } catch (error) {
      remoteVoiceLoggingDisabled = true;
    }
  }

  function speak(text, callback) {
    if (!text) {
      if (typeof callback === "function") {
        callback();
      }
      return;
    }

    if (!window.SpeechSynthesisUtterance || !speechSynthesisApi) {
      if (typeof callback === "function") {
        callback();
      }
      return;
    }

    speechSynthesisApi.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.84;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onend = function () {
      if (typeof callback === "function") {
        callback();
      }
    };
    utterance.onerror = function () {
      if (typeof callback === "function") {
        callback();
      }
    };

    speechSynthesisApi.speak(utterance);
  }

  function speakAndRun(message, action) {
    speak(message, function () {
      if (typeof action === "function") {
        action();
      }
    });
  }

  function getExerciseStepsText() {
    const stepNodes = Array.from(document.querySelectorAll("#stepsList .step-text"));
    const stepTexts = stepNodes
      .map(function (node) {
        return String(node.textContent || "").trim();
      })
      .filter(Boolean);

    if (stepTexts.length) {
      return stepTexts.map(function (step, index) {
        return "Step " + (index + 1) + ". " + step;
      }).join(" ");
    }

    const descriptionNode = document.getElementById("descriptionText");
    const description = descriptionNode ? String(descriptionNode.textContent || "").trim() : "";
    return description;
  }

  function repeatExerciseSteps() {
    const stepsText = getExerciseStepsText();

    if (!stepsText) {
      speak("There are no exercise steps to repeat yet.");
      return true;
    }

    speak("Repeating the current exercise steps. " + stepsText);
    return true;
  }

  function stopSpeaking() {
    if (speechSynthesisApi) {
      speechSynthesisApi.cancel();
    }
  }

  function navigateTo(url, confirmation) {
    speakAndRun(confirmation, function () {
      window.location.href = url;
    });
    return true;
  }

  function isVisibleElement(element) {
    if (!element || !element.isConnected) {
      return false;
    }

    if (dockElement && dockElement.contains(element)) {
      return false;
    }

    if (popupElement && popupElement.contains(element)) {
      return false;
    }

    if (element.hidden || element.disabled) {
      return false;
    }

    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || style.pointerEvents === "none") {
      return false;
    }

    return element.getClientRects().length > 0;
  }

  function getHumanizedId(id) {
    return String(id || "")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .trim();
  }

  function getElementLabels(element) {
    const labels = [];
    const text = String(element.textContent || "").replace(/\s+/g, " ").trim();
    const aria = element.getAttribute("aria-label");
    const title = element.getAttribute("title");
    const dataCategory = element.dataset ? element.dataset.category : "";
    const humanizedId = getHumanizedId(element.id);

    if (aria) {
      labels.push(aria);
    }

    if (title) {
      labels.push(title);
    }

    if (dataCategory) {
      labels.push(decodeURIComponent(dataCategory));
    }

    if (text) {
      labels.push(text);
    }

    if (humanizedId) {
      labels.push(humanizedId);
    }

    return labels.filter(Boolean);
  }

  function getClickableElements() {
    const elements = Array.from(document.querySelectorAll("button, a[href], [role='button'], [data-category], [data-exercise-id]"));
    const uniqueElements = [];
    const seen = new Set();

    elements.forEach(function (element) {
      if (seen.has(element)) {
        return;
      }

      if (!isVisibleElement(element)) {
        return;
      }

      seen.add(element);
      uniqueElements.push(element);
    });

    return uniqueElements;
  }

  function scoreLabelMatch(command, label) {
    const normalizedCommand = normalizeForMatch(command);
    const normalizedLabel = normalizeForMatch(label);

    if (!normalizedCommand || !normalizedLabel) {
      return 0;
    }

    if (normalizedCommand === normalizedLabel) {
      return 100;
    }

    if (normalizedCommand.includes(normalizedLabel)) {
      return 80 + normalizedLabel.length;
    }

    if (normalizedLabel.includes(normalizedCommand)) {
      return 55 + normalizedCommand.length;
    }

    const commandTokens = tokenize(normalizedCommand);
    const labelTokens = tokenize(normalizedLabel);

    if (!commandTokens.length || !labelTokens.length) {
      return 0;
    }

    const overlap = labelTokens.filter(function (token) {
      return commandTokens.includes(token);
    }).length;

    if (!overlap) {
      return 0;
    }

    const allLabelTokensMatch = labelTokens.every(function (token) {
      return commandTokens.includes(token);
    });

    if (allLabelTokensMatch) {
      return 60 + overlap * 4;
    }

    return overlap * 10;
  }

  function getElementActionLabel(element) {
    const labels = getElementLabels(element);
    return labels.length ? labels[0] : "that option";
  }

  function triggerElement(element, spokenLabel) {
    const actionLabel = spokenLabel || getElementActionLabel(element);
    speakAndRun("Opening " + actionLabel + ".", function () {
      element.click();
    });
    return true;
  }

  function triggerElementSilently(element) {
    element.click();
    return true;
  }

  function findBestClickableMatch(command, options) {
    const candidates = getClickableElements();
    let best = null;

    candidates.forEach(function (element) {
      const labels = getElementLabels(element);
      const bestScore = labels.reduce(function (maxScore, label) {
        const nextScore = scoreLabelMatch(command, label);
        return Math.max(maxScore, nextScore);
      }, 0);

      if (!best || bestScore > best.score) {
        best = {
          element: element,
          score: bestScore,
          label: labels[0] || "that option"
        };
      }
    });

    if (!best) {
      return null;
    }

    const minimumScore = options && Number.isFinite(options.minimumScore) ? options.minimumScore : 60;
    return best.score >= minimumScore ? best : null;
  }

  function handleCategoryCommand(command) {
    const categoryButtons = Array.from(document.querySelectorAll("[data-category]")).filter(isVisibleElement);
    const categoryMatch = categoryButtons.find(function (button) {
      const label = decodeURIComponent(button.dataset.category || "");
      return label && normalizeForMatch(command).includes(normalizeForMatch(label));
    });

    if (!categoryMatch) {
      return false;
    }

    return triggerElement(categoryMatch, decodeURIComponent(categoryMatch.dataset.category || "category"));
  }

  function handleExerciseCommand(command) {
    const normalizedCommand = normalizeForMatch(command);
    const startButtons = Array.from(document.querySelectorAll(".start-button[data-exercise-id]")).filter(isVisibleElement);

    for (let index = 0; index < startButtons.length; index += 1) {
      const button = startButtons[index];
      const card = button.closest("article");
      const titleNode = card ? card.querySelector("h3") : null;
      const title = String(titleNode && titleNode.textContent || "").trim();

      if (title && normalizedCommand.includes(normalizeForMatch(title))) {
        return triggerElement(button, title);
      }
    }

    const featuredExerciseButton = document.getElementById("featuredExerciseButton");
    const featuredTitle = document.getElementById("featuredTitle");

    if (
      featuredExerciseButton &&
      featuredTitle &&
      isVisibleElement(featuredExerciseButton) &&
      normalizeForMatch(featuredTitle.textContent).length &&
      normalizedCommand.includes(normalizeForMatch(featuredTitle.textContent))
    ) {
      return triggerElement(featuredExerciseButton, featuredTitle.textContent.trim());
    }

    return false;
  }

  function handleCurrentExerciseCommand(command) {
    const normalizedCommand = normalizeForMatch(command);
    const titleNode = document.getElementById("exerciseName");
    const timerStartButton = document.getElementById("timerStartButton");

    if (titleNode && timerStartButton) {
      const title = normalizeForMatch(titleNode.textContent);

      if (title && normalizedCommand.includes(title)) {
        return triggerElement(timerStartButton, "exercise timer");
      }
    }

    return false;
  }

  function handleSpecificCommands(command) {
    const normalized = normalizeForMatch(command);

    if (!normalized) {
      return true;
    }

    if (normalized.includes("help me") || normalized === "help" || normalized.includes("show help")) {
      showPopup(true);
      speak("Here are the voice commands you can use.");
      return true;
    }

    if (normalized.includes("repeat that") || normalized.includes("repeat steps") || normalized.includes("read that again")) {
      return repeatExerciseSteps();
    }

    if (normalized === "pause" || normalized.includes("stop talking") || normalized.includes("pause voice")) {
      stopSpeaking();
      speak("Voice playback paused.");
      return true;
    }

    if (normalized.includes("go back") || normalized === "back") {
      const backButton = document.getElementById("backButton");

      if (backButton && isVisibleElement(backButton)) {
        return triggerElement(backButton, "back");
      }

      if (window.history.length > 1) {
        speakAndRun("Going back.", function () {
          window.history.back();
        });
        return true;
      }
    }

    if (normalized.includes("go home") || normalized.includes("open home") || normalized.includes("show home")) {
      return navigateTo("home.html", "Going home.");
    }

    if (normalized.includes("open progress") || normalized.includes("show progress") || normalized.includes("my progress") || normalized.includes("whats my plan") || normalized.includes("what's my plan")) {
      return navigateTo("progress.html", "Opening progress.");
    }

    if (normalized.includes("open profile") || normalized.includes("show profile") || normalized.includes("my profile")) {
      return navigateTo("profile.html", "Opening profile.");
    }

    if (normalized.includes("open reminders") || normalized.includes("show reminders")) {
      return navigateTo("reminders.html", "Opening reminders.");
    }

    if (normalized.includes("open report") || normalized.includes("show report") || normalized.includes("caregiver report")) {
      return navigateTo("reports.html", "Opening reports.");
    }

    if (normalized.includes("log out") || normalized.includes("logout") || normalized.includes("sign out")) {
      const logoutButton = document.getElementById("logoutButton");
      if (logoutButton && isVisibleElement(logoutButton)) {
        return triggerElement(logoutButton, "log out");
      }
    }

    if (normalized.includes("tap to record") || normalized.includes("start recording") || normalized.includes("record voice")) {
      if (!isListening) {
        startListening();
      }
      return true;
    }

    return false;
  }

  function handleRecognizedCommand(transcript, options) {
    const context = updateVoiceContext();
    const normalized = normalizeTranscript(transcript);
    const settings = options || {};
    let understood = false;

    if (handleSpecificCommands(normalized)) {
      understood = true;
    } else if (handleCategoryCommand(normalized)) {
      understood = true;
    } else if (handleExerciseCommand(normalized)) {
      understood = true;
    } else if (handleCurrentExerciseCommand(normalized)) {
      understood = true;
    } else {
      const match = findBestClickableMatch(normalized, { minimumScore: 62 });

      if (match) {
        understood = triggerElement(match.element, match.label);
      }
    }

    if (!understood && !settings.suppressFailureSpeech) {
      speak("Sorry, I didn't catch that. Say Help me for commands.");
    }

    if (!settings.skipLog) {
      saveVoiceLog({
        transcript: transcript,
        normalized_command: normalized,
        understood: understood,
        page_name: context.currentPage,
        exercise_id: context.exerciseId
      });
    }

    return understood;
  }

  function startListening() {
    if (!SpeechRecognitionApi) {
      showPopup(true);
      speak("Voice control is not available in this browser.");
      return;
    }

    if (!recognition) {
      recognition = new SpeechRecognitionApi();
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 3;

      recognition.onstart = function () {
        setListeningState(true);
      };

      recognition.onend = function () {
        setListeningState(false);
      };

      recognition.onerror = function () {
        setListeningState(false);
      };

      recognition.onresult = function (event) {
        const results = Array.from(event.results[0] || []);

        for (let index = 0; index < results.length; index += 1) {
          const transcript = results[index] && results[index].transcript ? results[index].transcript : "";

          if (!transcript) {
            continue;
          }

          const isLastOption = index === results.length - 1;
          const understood = handleRecognizedCommand(transcript, {
            suppressFailureSpeech: !isLastOption,
            skipLog: !isLastOption
          });

          if (understood) {
            return;
          }
        }
      };
    }

    updateVoiceContext();

    try {
      recognition.start();
    } catch (error) {
      setListeningState(false);
    }
  }

  function stopListening() {
    if (recognition) {
      recognition.stop();
    }

    setListeningState(false);
  }

  function toggleListening() {
    if (isListening) {
      stopListening();
      return;
    }

    startListening();
  }

  function init() {
    injectStyles();
    buildPopup();
    buildButton();
    updateVoiceContext();

    window.addEventListener("resize", function () {
      restoreDockPosition();
      positionPopup();
    });

    window.WelloraVoiceControl = {
      hideHelp: hidePopup,
      repeatExerciseSteps: repeatExerciseSteps,
      showHelp: function () {
        showPopup(true);
      },
      speak: speak,
      startListening: startListening,
      stopListening: stopListening,
      stopSpeaking: stopSpeaking,
      triggerBestMatch: function (command) {
        const match = findBestClickableMatch(command, { minimumScore: 62 });
        return match ? triggerElementSilently(match.element) : false;
      },
      updateContext: updateVoiceContext
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
