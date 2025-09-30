const OpenAI = require('openai');

let client = null;

function getOpenAIClient() {
  if (client) return client;
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_TOKEN;
  if (!apiKey) {
    return null;
  }
  client = new OpenAI({ apiKey });
  return client;
}

async function chatCompletion(messages, options = {}) {
  const openai = getOpenAIClient();
  const model = options.model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
  if (!openai) {
    // Fallback mock when API key is missing
    return {
      role: 'assistant',
      content: JSON.stringify({
        action: 'none',
        reasoning: 'OpenAI API key not configured. This is a mock response.',
      })
    };
  }
  const resp = await openai.chat.completions.create({
    model,
    messages,
    temperature: options.temperature ?? 0.2,
    response_format: options.response_format,
  });
  const choice = resp.choices?.[0]?.message || { role: 'assistant', content: '' };
  return choice;
}

module.exports = { getOpenAIClient, chatCompletion };


