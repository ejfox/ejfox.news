export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiToken = config.pinboardApiToken
  
  if (!apiToken) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Pinboard API token not configured'
    })
  }

  const cacheKey = 'pinboard:news:bookmarks'
  
  try {
    // Try to get cached data first (cache for 10 minutes)
    const storage = useStorage()
    const cached = await storage.getItem(cacheKey)
    if (cached) {
      console.log(`Returning cached Pinboard bookmarks (${cached.length} items)`)
      return cached
    }

    console.log('Cache miss - fetching fresh data from Pinboard API')
    const response = await $fetch('https://api.pinboard.in/v1/posts/all', {
      params: {
        auth_token: apiToken,
        format: 'json',
        tag: '!news'
      }
    })

    console.log('Pinboard response:', response?.length ? `Found ${response.length} bookmarks` : 'No bookmarks')
    
    // Cache the response for 10 minutes (600 seconds)
    if (response) {
      await storage.setItem(cacheKey, response, {
        ttl: 600 // 10 minutes
      })
      console.log('Cached Pinboard response')
    }
    
    return response
  } catch (error) {
    console.error('Pinboard API error:', error)
    
    // Try to return stale cached data if available
    try {
      const storage = useStorage()
      const stale = await storage.getItem(cacheKey)
      if (stale) {
        console.log('Returning stale cached data due to API error')
        return stale
      }
    } catch (cacheError) {
      console.log('No cached data available')
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch Pinboard bookmarks: ${error.message || error}`
    })
  }
})