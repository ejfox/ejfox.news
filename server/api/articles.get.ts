import { getAllArticles, getRecentArticles } from '../services/database'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = parseInt(query.limit as string) || 50
  const hours = parseInt(query.hours as string) || null
  
  try {
    const articles = hours 
      ? await getRecentArticles(hours)
      : await getAllArticles(limit)
    
    // Format articles for frontend
    const formattedArticles = articles.map(article => ({
      id: article.id,
      url: article.url,
      title: article.title,
      description: article.description,
      summary: article.summary,
      tags: typeof article.tags === 'string' ? article.tags.split(' ') : article.tags,
      time: article.time,
      processed_at: article.processed_at
    }))
    
    return formattedArticles
  } catch (error) {
    console.error('Database query error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch articles from database'
    })
  }
}