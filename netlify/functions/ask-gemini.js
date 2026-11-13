const { GoogleGenAI } = require('@google/genai');

const systemPrompt = `You are Wellora AI, a warm, friendly, and supportive conversational wellness assistant designed exclusively for senior wellness education and guidance. You are NOT a doctor and must NEVER diagnose diseases, prescribe medications, or replace professional medical advice.

Your domain is STRICTLY limited to senior wellness and healthy aging, which includes:
- Senior wellness
- Healthy aging
- Mobility, balance, and flexibility
- Gentle exercise
- Fall prevention
- Nutrition for seniors and hydration
- Sleep and mental wellbeing
- Healthy habits
- Caregiver education
- Preventive wellness

ADHERE TO THE FOLLOWING CRITICAL SAFETY RULES:
- NEVER diagnose diseases.
- NEVER interpret laboratory results as a diagnosis.
- NEVER prescribe medications or recommend drug dosages.
- NEVER tell users to stop or start medications.
- NEVER claim certainty about medical conditions.
- If asked about emergencies, advise immediate medical care (e.g. calling 911 or seeking immediate emergency services).
- If the user asks for diagnosis or medication advice, respond with:
  "I'm sorry, but I can't diagnose medical conditions or recommend medications. Please consult a qualified healthcare professional. If your symptoms are severe or sudden, seek medical attention immediately."

OUT-OF-SCOPE REDIRECTION:
- If the user asks about anything unrelated to senior wellness (e.g., politics, coding, entertainment, sports results, exams, finance, religion, weather, generic trivia, etc.), do NOT answer the question. Instead, politely decline and gently redirect the conversation back to senior wellness.
- For example: "I'm here to help with senior wellness and healthy aging. If you have questions about exercise, mobility, nutrition, sleep, or caring for an older adult, I'd be happy to help."

CONVERSATIONAL TONE AND STYLE:
- Use simple, clear language suitable for older adults. Avoid medical jargon or overly complex explanations.
- Keep your responses short (under 150 words), friendly, and easy to understand. Use bullet points or short paragraphs where helpful.
- Encourage healthy habits and recommend consulting healthcare professionals when appropriate.
- Always be respectful, encouraging, and supportive.`;

const responseHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

function sanitizeContents(rawContents) {
  if (!Array.isArray(rawContents)) {
    return [];
  }

  const normalized = [];

  for (const entry of rawContents) {
    if (!entry || !Array.isArray(entry.parts)) {
      continue;
    }

    const validParts = entry.parts
      .map((part) => {
        if (part && typeof part.text === 'string' && part.text.trim()) {
          return { text: part.text.trim() };
        }
        return null;
      })
      .filter(Boolean);

    if (!validParts.length) {
      continue;
    }

    const role = entry.role === 'model' ? 'model' : 'user';
    normalized.push({ role, parts: validParts });
  }

  return normalized;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: responseHeaders,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: responseHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    let parsedBody = {};
    try {
      parsedBody = JSON.parse(event.body || '{}');
    } catch {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Invalid JSON request body.' })
      };
    }

    const sanitizedContents = sanitizeContents(parsedBody.contents);
    if (!sanitizedContents.length) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Invalid request body. Non-empty "contents" array is required.' })
      };
    }

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
      return {
        statusCode: 200,
        headers: responseHeaders,
        body: JSON.stringify({
          reply: "Hello! I am Wellora AI, your senior wellness assistant. To enable live AI responses, please configure your GEMINI_API_KEY in Settings > Secrets. In the meantime, remember to take gentle daily walks, stay hydrated with fresh water, and stretch lightly every morning!"
        })
      };
    }

    const modelName = (process.env.GEMINI_MODEL || 'gemini-4-hydrogen').trim();
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const response = await ai.models.generateContent({
      model: modelName,
      contents: sanitizedContents,
      config: {
        systemInstruction: systemPrompt
      }
    });

    const replyText = response && typeof response.text === 'string' ? response.text.trim() : '';
    if (!replyText) {
      return {
        statusCode: 200,
        headers: responseHeaders,
        body: JSON.stringify({
          reply: "I didn't catch that clearly—could you rephrase your senior wellness question? I'm here to help with gentle exercise, mobility, sleep, nutrition, or fall prevention."
        })
      };
    }

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify({ reply: replyText })
    };
  } catch (error) {
    const status = Number(error && (error.status || error.statusCode)) || 500;
    const message = String((error && error.message) || '');

    if (
      status === 400 ||
      status === 403 ||
      message.includes('API_KEY_INVALID') ||
      message.includes('API key not valid') ||
      message.includes('PERMISSION_DENIED')
    ) {
      console.warn('Wellora AI fallback active (check GEMINI_API_KEY configuration in Settings > Secrets).');
      return {
        statusCode: 200,
        headers: responseHeaders,
        body: JSON.stringify({
          reply: "Hello! I am Wellora AI, your senior wellness companion. Please verify your Gemini API key in Settings > Secrets to enable live AI responses. In the meantime, remember to stay hydrated, move gently each day, and keep a sturdy chair nearby for balance exercises!"
        })
      };
    }

    if (status === 429 || message.includes('RESOURCE_EXHAUSTED')) {
      return {
        statusCode: 429,
        headers: responseHeaders,
        body: JSON.stringify({
          error: 'Rate limit reached',
          details: 'Wellora AI is receiving many requests right now. Please wait a moment and try again.'
        })
      };
    }

    return {
      statusCode: 502,
      headers: responseHeaders,
      body: JSON.stringify({
        error: 'Failed to communicate with the Gemini API.',
        details: 'The AI service is temporarily unavailable. Please try again shortly.'
      })
    };
  }
};
