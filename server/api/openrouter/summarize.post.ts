export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = config.openrouterApiKey
  
  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'OpenRouter API key not configured'
    })
  }

  const { url, title, description } = await readBody(event)

  if (!url) {
    throw createError({
      statusCode: 400,
      statusMessage: 'URL is required'
    })
  }

  try {
    const prompt = `Please provide a concise news summary (2-3 sentences) of this article:

Title: ${title || 'N/A'}
URL: ${url}
Description: ${description || 'N/A'}

Focus on the key facts and why this matters. Keep it under 100 words.`

    const response = await $fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ejfox-news.local',
        'X-Title': 'EJ Fox News'
      },
      body: {
        model: 'meta-llama/llama-3.2-3b-instruct:free',
        messages: [{
          role: 'user',
          content: prompt
        }],
        max_tokens: 200,
        temperature: 0.3
      }
    })

    return {
      summary: response.choices[0]?.message?.content || 'Unable to generate summary',
      tokens_used: response.usage?.total_tokens || 0
    }
  } catch (error) {
    console.error('OpenRouter API Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to generate summary: ${error.message || error}`
    })
  }
})