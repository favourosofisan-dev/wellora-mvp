(function () {
  const authIntentKey = "welloraAuthIntent";
  const profileKey = "welloraProfile";
  const userStatePrefix = "welloraUserState::";

  function readJson(key, fallbackValue) {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallbackValue;
    } catch (error) {
      return fallbackValue;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getUserIdentifier(user) {
    if (!user) {
      return "";
    }

    return user.id || user.email || (user.user_metadata && user.user_metadata.email) || "";
  }

  function getUserStateKey(user) {
    const identifier = getUserIdentifier(user);
    return identifier ? userStatePrefix + identifier : "";
  }

  function readUserState(user) {
    const key = getUserStateKey(user);

    if (!key) {
      return {
        onboardingComplete: null,
        mainGoal: "",
        lastAuthIntent: "",
        lastLoginAt: ""
      };
    }

    return Object.assign(
      {
        onboardingComplete: null,
        mainGoal: "",
        lastAuthIntent: "",
        lastLoginAt: ""
      },
      readJson(key, {})
    );
  }

  function saveUserState(user, updates) {
    const key = getUserStateKey(user);

    if (!key) {
      return null;
    }

    const nextState = Object.assign({}, readUserState(user), updates || {});
    writeJson(key, nextState);
    return nextState;
  }

  function readProfile() {
    return Object.assign(
      {
        name: "Wellora User",
        email: "",
        birthYear: "1955",
        fitnessLevel: "Beginner",
        mainGoal: localStorage.getItem("welloraMainGoal") || "Balance & Stability",
        emailReminders: true,
        largeText: false
      },
      readJson(profileKey, {})
    );
  }

  function saveProfile(profile) {
    writeJson(profileKey, profile);
  }

  function deriveDisplayName(user) {
    if (!user) {
      return "Wellora User";
    }

    const metadata = user.user_metadata || {};
    const fullName = metadata.full_name || metadata.name || metadata.user_name;

    if (fullName) {
      return fullName;
    }

    if (user.email) {
      return user.email.split("@")[0];
    }

    return "Wellora User";
  }

  function syncProfileFromUser(user) {
    if (!user) {
      return readProfile();
    }

    const state = readUserState(user);
    const profile = readProfile();
    const nextProfile = Object.assign({}, profile, {
      name: profile.name && profile.name !== "Wellora User" ? profile.name : deriveDisplayName(user),
      email: user.email || profile.email || "",
      mainGoal: state.mainGoal || profile.mainGoal || localStorage.getItem("welloraMainGoal") || "Balance & Stability"
    });

    saveProfile(nextProfile);
    return nextProfile;
  }

  function syncGoalToProfile(goal) {
    if (!goal) {
      return;
    }

    const profile = readProfile();
    profile.mainGoal = goal;
    saveProfile(profile);
    localStorage.setItem("welloraMainGoal", goal);
  }

  function setAuthIntent(intent) {
    sessionStorage.setItem(authIntentKey, intent);
  }

  function peekAuthIntent() {
    return sessionStorage.getItem(authIntentKey) || "";
  }

  function clearAuthIntent() {
    sessionStorage.removeItem(authIntentKey);
  }

  function consumeAuthIntent() {
    const intent = peekAuthIntent();
    clearAuthIntent();
    return intent;
  }

  function hasCompletedOnboarding(user) {
    const state = readUserState(user);
    return state.onboardingComplete === true;
  }

  function markOnboardingPending(user, goal) {
    if (goal) {
      syncGoalToProfile(goal);
    }

    return saveUserState(user, {
      onboardingComplete: false,
      mainGoal: goal || readUserState(user).mainGoal || ""
    });
  }

  function markOnboardingComplete(user, goal) {
    if (goal) {
      syncGoalToProfile(goal);
    }

    return saveUserState(user, {
      onboardingComplete: true,
      mainGoal: goal || readUserState(user).mainGoal || localStorage.getItem("welloraMainGoal") || "",
      onboardingCompletedAt: new Date().toISOString()
    });
  }

  function resolveAuthenticatedDestination(user, fallback) {
    const state = readUserState(user);
    return state.onboardingComplete === false ? "onboarding.html" : (fallback || "home.html");
  }

  function rememberLastCategory(category) {
    if (!category) {
      return;
    }

    sessionStorage.setItem("welloraLastCategory", category);
  }

  function getLastCategory() {
    return sessionStorage.getItem("welloraLastCategory") || "";
  }

  window.WelloraFlow = {
    clearAuthIntent: clearAuthIntent,
    consumeAuthIntent: consumeAuthIntent,
    getLastCategory: getLastCategory,
    hasCompletedOnboarding: hasCompletedOnboarding,
    markOnboardingComplete: markOnboardingComplete,
    markOnboardingPending: markOnboardingPending,
    peekAuthIntent: peekAuthIntent,
    readProfile: readProfile,
    readUserState: readUserState,
    rememberLastCategory: rememberLastCategory,
    resolveAuthenticatedDestination: resolveAuthenticatedDestination,
    saveProfile: saveProfile,
    saveUserState: saveUserState,
    setAuthIntent: setAuthIntent,
    syncGoalToProfile: syncGoalToProfile,
    syncProfileFromUser: syncProfileFromUser
  };
})();
