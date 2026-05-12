(function () {
  const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
  const speechSynthesisApi = window.speechSynthesis || null;
  const voiceLogStorageKey = "welloraVoiceLogs";
  const helpCommands = [
    'Say "Go home"',
    'Say "Show balance exercises"',
    'Say "Show flexibility exercises"',
    'Say "Start this exercise"',
    'Say "Pause"',
    'Say "Repeat that"',
    'Say "What\'s my plan?"',
    'Say "Help me"'
  ];

  let recognition = null;
  let isListening = false;
  let popupElement = null;
  let buttonElement = null;
  let popupHideTimeoutId = null;
  let remoteVoiceLoggingDisabled = false;

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
      ".wellora-voice-button {",
      "  position: fixed;",
      "  right: 20px;",
      "  bottom: 20px;",
      "  width: 112px;",
      "  height: 112px;",
      "  border: 0;",
      "  border-radius: 50%;",
      "  display: grid;",
      "  place-items: center;",
      "  background: linear-gradient(180deg, #3c9a5f 0%, #2f7d4c 100%);",
      "  color: #ffffff;",
      "  box-shadow: 0 14px 28px rgba(47, 125, 76, 0.28);",
      "  cursor: pointer;",
      "  z-index: 9999;",
      "}",
      ".wellora-voice-button svg {",
      "  width: 56px;",
      "  height: 56px;",
      "  stroke: currentColor;",
      "  fill: none;",
      "  stroke-width: 2;",
      "  stroke-linecap: round;",
      "  stroke-linejoin: round;",
      "}",
      ".wellora-voice-button.is-listening {",
      "  animation: welloraVoicePulse 1.4s ease-in-out infinite;",
      "}",
      ".wellora-voice-popup {",
      "  position: fixed;",
      "  right: 20px;",
      "  bottom: 88px;",
      "  width: min(320px, calc(100vw - 32px));",
      "  padding: 16px;",
      "  border-radius: 20px;",
      "  background: rgba(255, 250, 245, 0.98);",
      "  border: 1px solid rgba(47, 125, 76, 0.22);",
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
      "  0% { box-shadow: 0 0 0 0 rgba(60, 154, 95, 0.45), 0 14px 28px rgba(47, 125, 76, 0.28); }",
      "  70% { box-shadow: 0 0 0 14px rgba(60, 154, 95, 0), 0 14px 28px rgba(47, 125, 76, 0.28); }",
      "  100% { box-shadow: 0 0 0 0 rgba(60, 154, 95, 0), 0 14px 28px rgba(47, 125, 76, 0.28); }",
      "}",
      "@media (max-width: 480px) {",
      "  .wellora-voice-button { right: 16px; bottom: 16px; }",
      "  .wellora-voice-popup { right: 16px; bottom: 84px; }",
      "}"
    ].join("\n");

    document.head.appendChild(style);
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

  function buildButton() {
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
    buttonElement.addEventListener("click", toggleListening);
    document.body.appendChild(buttonElement);
  }

  function setListeningState(nextListening) {
    isListening = nextListening;

    if (!buttonElement) {
      return;
    }

    buttonElement.classList.toggle("is-listening", nextListening);
    buttonElement.setAttribute(
      "aria-label",
      nextListening ? "Stop voice control listening" : "Start voice control"
    );
    buttonElement.setAttribute("aria-pressed", nextListening ? "true" : "false");
  }

  function normalizeTranscript(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\w\s?']/g, " ")
      .replace(/\s+/g, " ")
      .trim();
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
      return;
    }

    speak("Repeating the current exercise steps. " + stepsText);
  }

  function clickCompleteButton() {
    const completeButton = document.getElementById("completeButton");

    if (!completeButton) {
      speak("Open an exercise first to use that command.");
      return;
    }

    if (completeButton.disabled) {
      speak("This exercise is not ready yet. Please complete the safety check first.");
      return;
    }

    speakAndRun("Starting exercise.", function () {
      completeButton.click();
    });
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
  }

  function handleRecognizedCommand(transcript) {
    const context = updateVoiceContext();
    const normalized = normalizeTranscript(transcript);
    let understood = true;

    if (normalized.includes("go home")) {
      navigateTo("home.html", "Going home.");
    } else if (normalized.includes("show balance exercises")) {
      navigateTo("category.html?category=Balance%20and%20Stability", "Opening balance exercises.");
    } else if (normalized.includes("show flexibility exercises")) {
      navigateTo("category.html?category=Flexibility", "Opening flexibility exercises.");
    } else if (normalized.includes("start this exercise")) {
      clickCompleteButton();
    } else if (normalized === "pause" || normalized.includes(" pause")) {
      stopSpeaking();
    } else if (normalized.includes("repeat that")) {
      repeatExerciseSteps();
    } else if (normalized.includes("what's my plan") || normalized.includes("whats my plan")) {
      navigateTo("progress.html", "Opening your plan.");
    } else if (normalized.includes("help me")) {
      showPopup(true);
      speak("Here are the voice commands you can use.");
    } else {
      understood = false;
      speak("Sorry, I didn't catch that. Say Help me for commands.");
    }

    saveVoiceLog({
      transcript: transcript,
      normalized_command: normalized,
      understood: understood,
      page_name: context.currentPage,
      exercise_id: context.exerciseId
    });
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
      recognition.maxAlternatives = 1;

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
        const transcript = event && event.results && event.results[0] && event.results[0][0]
          ? event.results[0][0].transcript
          : "";
        handleRecognizedCommand(transcript);
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
      updateContext: updateVoiceContext
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
