const REMINDER_CACHE_NAME = "wellora-reminders-v1";
const REMINDER_CONTEXT_KEY = "/__wellora_reminder_context__";
const REMINDER_RUNTIME_KEY = "/__wellora_reminder_runtime__";
const REPORT_CONTEXT_KEY = "/__wellora_report_context__";
const REPORT_RUNTIME_KEY = "/__wellora_report_runtime__";

function getCache() {
  return caches.open(REMINDER_CACHE_NAME);
}

async function readJsonValue(key, fallbackValue) {
  const cache = await getCache();
  const response = await cache.match(key);

  if (!response) {
    return fallbackValue;
  }

  try {
    return await response.json();
  } catch (error) {
    return fallbackValue;
  }
}

async function writeJsonValue(key, value) {
  const cache = await getCache();
  await cache.put(key, new Response(JSON.stringify(value), {
    headers: {
      "Content-Type": "application/json"
    }
  }));
}

function weatherCategoryFromCode(code) {
  const safeCode = Number(code);

  if (safeCode === 0 || safeCode === 1) {
    return "sunny";
  }

  if ([71, 73, 75, 77, 85, 86].includes(safeCode)) {
    return "snowing";
  }

  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(safeCode)) {
    return "rainy";
  }

  return "other";
}

function toIsoDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function getPreferredTimeHourMinute(preferredTime) {
  const value = String(preferredTime || "09:00:00");
  const parts = value.split(":");
  return {
    hour: Number(parts[0] || 9),
    minute: Number(parts[1] || 0)
  };
}

function hasReminderTimeMatch(now, preferredTime) {
  const target = getPreferredTimeHourMinute(preferredTime);
  return now.getHours() === target.hour && now.getMinutes() < 10 && now.getMinutes() >= 0;
}

function computeProgressInsights(rows) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const recentRows = safeRows.filter(function (row) {
    return row && row.created_at && new Date(row.created_at) >= sevenDaysAgo;
  });

  const recentSessions = recentRows.length;
  const completionRate = Math.min(recentSessions / 7, 1);
  const mostRecent = safeRows.length && safeRows[0] && safeRows[0].created_at
    ? new Date(safeRows[0].created_at)
    : null;

  let daysSinceExercise = Number.POSITIVE_INFINITY;

  if (mostRecent && !Number.isNaN(mostRecent.getTime())) {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const recentStart = new Date(mostRecent.getFullYear(), mostRecent.getMonth(), mostRecent.getDate());
    daysSinceExercise = Math.floor((todayStart.getTime() - recentStart.getTime()) / (24 * 60 * 60 * 1000));
  }

  return {
    completionRate: completionRate,
    lowCompletionRate: completionRate < 0.5,
    highCompletionRate: completionRate > 0.5,
    daysSinceExercise: daysSinceExercise
  };
}

function buildReminderMessage(weatherCategory, insights) {
  if (insights.daysSinceExercise >= 3) {
    return "We miss you! Start with just 3 minutes today.";
  }

  if (weatherCategory === "snowing") {
    return "❄️ Stay warm inside! Try our seated exercises today.";
  }

  if (weatherCategory === "sunny" && insights.highCompletionRate) {
    return "☀️ Beautiful morning! Ready for your 10-minute stretch?";
  }

  if (weatherCategory === "rainy" && insights.lowCompletionRate) {
    return "🌧️ Rainy day? Perfect for a gentle indoor chair workout.";
  }

  return "A small session today can keep your momentum going. Ready to move with Wellora?";
}

async function fetchCurrentWeather(reminder) {
  const url = "https://api.open-meteo.com/v1/forecast?latitude=" +
    encodeURIComponent(reminder.latitude) +
    "&longitude=" +
    encodeURIComponent(reminder.longitude) +
    "&current_weather=true";

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Weather lookup failed.");
  }

  const payload = await response.json();
  const currentWeather = payload && payload.current_weather ? payload.current_weather : null;

  if (!currentWeather) {
    throw new Error("Current weather is not available.");
  }

  return currentWeather;
}

async function fetchUserProgress(context) {
  const url = context.supabaseUrl + "/rest/v1/user_progress?select=created_at&user_id=eq." + encodeURIComponent(context.userId) + "&order=created_at.desc";
  const response = await fetch(url, {
    headers: {
      apikey: context.supabaseAnonKey,
      Authorization: "Bearer " + context.accessToken
    }
  });

  if (!response.ok) {
    throw new Error("Progress lookup failed.");
  }

  return response.json();
}

async function notifyClients(message) {
  const clients = await self.clients.matchAll({
    includeUncontrolled: true,
    type: "window"
  });

  clients.forEach(function (client) {
    client.postMessage({
      type: "REMINDER_NOTIFICATION_SENT",
      message: message
    });
  });
}

async function notifyReportClients(message) {
  const clients = await self.clients.matchAll({
    includeUncontrolled: true,
    type: "window"
  });

  clients.forEach(function (client) {
    client.postMessage({
      type: "SCHEDULED_REPORT_REMINDER_SENT",
      message: message
    });
  });
}

function isMondayAtPreferredTime(now, preferredTime) {
  return now.getDay() === 1 && hasReminderTimeMatch(now, preferredTime);
}

async function maybeSendReminder() {
  const context = await readJsonValue(REMINDER_CONTEXT_KEY, null);

  if (!context || !context.reminder || context.reminder.enabled === false) {
    return;
  }

  if (!self.registration || Notification.permission !== "granted") {
    return;
  }

  const reminder = context.reminder;

  if (!Number.isFinite(Number(reminder.latitude)) || !Number.isFinite(Number(reminder.longitude))) {
    return;
  }

  const now = new Date();

  if (!hasReminderTimeMatch(now, reminder.preferred_time)) {
    return;
  }

  const runtime = await readJsonValue(REMINDER_RUNTIME_KEY, {});
  const todayKey = toIsoDateKey(now);
  const sentKey = todayKey + "::" + String(reminder.preferred_time || "09:00:00");

  if (runtime.lastSentKey === sentKey) {
    return;
  }

  const weather = await fetchCurrentWeather(reminder);
  const progressRows = await fetchUserProgress(context);
  const insights = computeProgressInsights(progressRows);
  const message = buildReminderMessage(weatherCategoryFromCode(weather.weathercode), insights);

  await self.registration.showNotification("Wellora Reminder", {
    body: message,
    icon: "image/wellora logo.png",
    badge: "image/wellora logo.png",
    tag: "wellora-daily-reminder",
    renotify: false,
    data: {
      url: "home.html"
    }
  });

  await writeJsonValue(REMINDER_RUNTIME_KEY, {
    lastSentAt: now.toISOString(),
    lastSentKey: sentKey
  });

  await notifyClients(message);
}

async function maybeSendScheduledReportReminder() {
  const context = await readJsonValue(REPORT_CONTEXT_KEY, null);

  if (!context || !context.reportSchedule || context.reportSchedule.enabled === false) {
    return;
  }

  if (!self.registration || Notification.permission !== "granted") {
    return;
  }

  const schedule = context.reportSchedule;
  const now = new Date();

  if (!isMondayAtPreferredTime(now, schedule.preferred_time || "09:00:00")) {
    return;
  }

  const runtime = await readJsonValue(REPORT_RUNTIME_KEY, {});
  const todayKey = toIsoDateKey(now);
  const sentKey = todayKey + "::weekly-report";

  if (runtime.lastSentKey === sentKey) {
    return;
  }

  const message = schedule.emailServiceConfigured
    ? "Your weekly caregiver report is ready to send to " + schedule.caregiverEmail + "."
    : "Your weekly caregiver report is ready to review and share.";

  await self.registration.showNotification("Wellora Caregiver Report", {
    body: message,
    icon: "image/wellora logo.png",
    badge: "image/wellora logo.png",
    tag: "wellora-weekly-caregiver-report",
    renotify: false,
    data: {
      url: "reports.html"
    }
  });

  await writeJsonValue(REPORT_RUNTIME_KEY, {
    lastSentAt: now.toISOString(),
    lastSentKey: sentKey
  });

  await notifyReportClients(message);
}

self.addEventListener("install", function (event) {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", function (event) {
  const data = event.data || {};

  if (data.type === "SYNC_REMINDER_CONTEXT") {
    event.waitUntil(writeJsonValue(REMINDER_CONTEXT_KEY, data.payload || {}));
    return;
  }

  if (data.type === "SYNC_REPORT_CONTEXT") {
    event.waitUntil(writeJsonValue(REPORT_CONTEXT_KEY, data.payload || {}));
    return;
  }

  if (data.type === "RUN_REMINDER_CHECK") {
    event.waitUntil(Promise.all([
      maybeSendReminder(),
      maybeSendScheduledReportReminder()
    ]));
  }
});

self.addEventListener("periodicsync", function (event) {
  if (event.tag === "wellora-reminder-check") {
    event.waitUntil(Promise.all([
      maybeSendReminder(),
      maybeSendScheduledReportReminder()
    ]));
  }
});

self.addEventListener("sync", function (event) {
  if (event.tag === "wellora-reminder-check") {
    event.waitUntil(Promise.all([
      maybeSendReminder(),
      maybeSendScheduledReportReminder()
    ]));
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const targetUrl = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : "home.html";

  event.waitUntil(self.clients.openWindow(targetUrl));
});
