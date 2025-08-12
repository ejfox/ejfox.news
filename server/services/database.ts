interface NewsArticle {
  id: string
  url: string
  title: string
  description?: string
  summary: string
  tags: string
  time: string
  processed_at: string
  created_at?: string
}

export async function saveArticle(article: NewsArticle) {
  const storage = useStorage()
  const key = `articles:${article.id}`
  
  try {
    await storage.setItem(key, {
      ...article,
      created_at: new Date().toISOString()
    })
    
    // Also save to a list for easy retrieval
    const articlesKey = 'articles:list'
    const existingList: string[] = await storage.getItem(articlesKey) || []
    
    if (!existingList.includes(article.id)) {
      existingList.unshift(article.id) // Add to beginning
      // Keep only last 100 articles
      const trimmedList = existingList.slice(0, 100)
      await storage.setItem(articlesKey, trimmedList)
    }
    
    console.log(`Saved article: ${article.title.substring(0, 50)}...`)
  } catch (error) {
    console.error('Error saving article:', error)
    throw error
  }
}

export async function getAllArticles(limit = 50): Promise<NewsArticle[]> {
  const storage = useStorage()
  const articlesKey = 'articles:list'
  
  try {
    const articleIds: string[] = await storage.getItem(articlesKey) || []
    const articles: NewsArticle[] = []
    
    for (const id of articleIds.slice(0, limit)) {
      const article = await storage.getItem(`articles:${id}`)
      if (article) {
        articles.push(article as NewsArticle)
      }
    }
    
    // Sort by time descending
    return articles.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  } catch (error) {
    console.error('Error fetching articles:', error)
    return []
  }
}

export async function getRecentArticles(hours = 24): Promise<NewsArticle[]> {
  const allArticles = await getAllArticles(100)
  const cutoff = Date.now() - (hours * 60 * 60 * 1000)
  
  return allArticles.filter(article => 
    new Date(article.processed_at).getTime() >= cutoff
  )
}