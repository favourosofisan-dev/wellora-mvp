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
- Keep your responses short, friendly, and easy to understand. Use bullet points or short paragraphs where helpful.
- Encourage healthy habits and recommend consulting healthcare professionals when appropriate.
- Always be respectful, encouraging, and supportive.`;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY environment variable is not set.');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error. API key is missing.' })
      };
    }

    const { contents } = JSON.parse(event.body || '{}');
    if (!contents || !Array.isArray(contents)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid request body. "contents" array is required.' })
      };
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const payload = {
      contents: contents,
      systemInstruction: {
        parts: [
          {
            text: systemPrompt
          }
        ]
      },
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 1024
      }
    };

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API error status: ${response.status}. Response: ${errorText}`);
      return {
        statusCode: response.status || 502,
        body: JSON.stringify({ error: 'Failed to communicate with the Gemini API.', details: errorText })
      };
    }

    const data = await response.json();
    
    // Safely extract candidate text response
    let replyText = '';
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
      replyText = data.candidates[0].content.parts[0].text;
    } else {
      console.error('Unexpected Gemini API response structure:', JSON.stringify(data));
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Received an empty or malformed reply from the AI model.' })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reply: replyText })
    };

  } catch (error) {
    console.error('Error handling Gemini request:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message })
    };
  }
};
