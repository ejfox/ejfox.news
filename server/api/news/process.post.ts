import Bottleneck from 'bottleneck'
import { saveArticle } from '../../services/database'

// Rate limiter: 1 request every 5 seconds to be very polite to free tier
const limiter = new Bottleneck({
  minTime: 5000, // 5 second minimum between requests
  maxConcurrent: 1, // Only 1 request at a time
  reservoir: 10, // Start with 10 requests available
  reservoirRefreshAmount: 5, // Refresh 5 requests
  reservoirRefreshInterval: 60000, // Every minute
})

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const pinboardToken = config.pinboardApiToken
    const openrouterKey = config.openrouterApiKey
    
    if (!pinboardToken) {
      throw new Error('Pinboard API token not configured')
    }
    
    if (!openrouterKey) {
      throw new Error('OpenRouter API key not configured')
    }

    const newsCacheKey = 'processed:news:articles'
    
    // Check for recent cached processed news (cache for 30 minutes)
    try {
      const storage = useStorage()
      const cachedNews: any = await storage.getItem(newsCacheKey)
      if (cachedNews && cachedNews.timestamp && Date.now() - cachedNews.timestamp < 30 * 60 * 1000) {
        console.log(`Returning cached processed news (${cachedNews.news.length} items)`)
        return {
          processed: cachedNews.news.length,
          valid: cachedNews.news.filter((item: any) => !item.error).length,
          news: cachedNews.news,
          fromCache: true
        }
      }
    } catch (cacheError) {
      console.log('No cached processed news available')
    }

    // Fetch bookmarks tagged with !news directly
    console.log('Processing: Fetching from Pinboard with token:', pinboardToken?.substring(0, 10) + '...')
    const bookmarks = await $fetch('https://api.pinboard.in/v1/posts/all', {
      params: {
        auth_token: pinboardToken,
        format: 'json',
        tag: '!news'
      }
    })
    
    // Parse response if it's a string
    let parsedBookmarks = bookmarks
    if (typeof bookmarks === 'string') {
      try {
        parsedBookmarks = JSON.parse(bookmarks)
      } catch (e) {
        throw new Error('Failed to parse bookmarks response')
      }
    }
    
    console.log('Processing: Pinboard response:', parsedBookmarks?.length ? `Found ${parsedBookmarks.length} bookmarks` : 'No bookmarks')
    
    if (!parsedBookmarks || !Array.isArray(parsedBookmarks) || parsedBookmarks.length === 0) {
      throw new Error(`No !news bookmarks found. Type: ${typeof bookmarks}`)
    }

    // Process each bookmark with LLM summary using rate limiting
    console.log(`Starting to process ${parsedBookmarks.length} bookmarks with rate limiting`)
    const processedNews = []
    
    for (let i = 0; i < Math.min(parsedBookmarks.length, 3); i++) {
      const bookmark = parsedBookmarks[i]
      try {
        console.log(`Processing bookmark ${i + 1}/${Math.min(parsedBookmarks.length, 3)}: ${bookmark.description}`)
        
        const prompt = `Summarize this in 2 sentences:

"${bookmark.description}"
${bookmark.extended ? `\n\nContext: ${bookmark.extended}` : ''}

Write a factual summary focusing on what this is about:`

        // Use Bottleneck to rate limit the API call
        const summaryResponse: any = await limiter.schedule(async () => {
          return await $fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openrouterKey}`,
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
              max_tokens: 150,
              temperature: 0.3
            }
          })
        })

        const summary = summaryResponse.choices?.[0]?.message?.content || 'AI summary unavailable'
        
        console.log(`✓ Successfully processed: ${bookmark.description.substring(0, 50)}...`)
        
        const article = {
          id: bookmark.hash,
          url: bookmark.href,
          title: bookmark.description,
          description: bookmark.extended,
          summary: summary,
          tags: bookmark.tags.split(' '),
          time: bookmark.time,
          processed_at: new Date().toISOString()
        }
        
        // Save to storage
        try {
          await saveArticle({
            ...article,
            tags: bookmark.tags // Store as string for storage
          })
        } catch (dbError) {
          console.warn('Failed to save to storage:', dbError)
        }
        
        processedNews.push(article)
        
      } catch (error: any) {
        const errorType = error.message?.includes('429') ? 'Rate limited' : 
                         error.message?.includes('401') ? 'Authentication failed' :
                         error.message?.includes('500') ? 'Server error' : 'Unknown error'
                         
        console.warn(`✗ Failed to process "${bookmark.description}": ${errorType}`)
        
        // Still include the bookmark but with fallback summary
        processedNews.push({
          id: bookmark.hash,
          url: bookmark.href,
          title: bookmark.description,
          description: bookmark.extended,
          summary: bookmark.extended || `[${errorType}] Original bookmark description unavailable`,
          tags: bookmark.tags.split(' '),
          time: bookmark.time,
          processed_at: new Date().toISOString(),
          error: errorType
        })
      }
    }

    const validNews = processedNews.filter(item => !item.error)
    const failedCount = processedNews.length - validNews.length
    
    console.log(`Processing complete: ${validNews.length} successful, ${failedCount} failed`)

    // Cache the processed results for 30 minutes
    try {
      const storage = useStorage()
      await storage.setItem(newsCacheKey, {
        news: processedNews, // Cache all articles, including failed ones
        timestamp: Date.now()
      })
      console.log('Cached processed news results')
    } catch (cacheError) {
      console.warn('Failed to cache processed news:', cacheError)
    }

    return {
      processed: processedNews.length,
      valid: validNews.length,
      failed: failedCount,
      news: processedNews, // Return all articles, let frontend decide what to show
      fromCache: false
    }
  } catch (error) {
    console.error('News processing error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to process news items: ${error.message || error}`
    })
  }
})