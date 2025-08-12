import { Feed } from 'feed'
import { getAllArticles } from '../services/database'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  // Create feed
  const feed = new Feed({
    title: 'EJ Fox News',
    description: 'Curated news from Pinboard bookmarks, powered by AI summaries',
    id: config.public.siteUrl || 'http://localhost:3000',
    link: config.public.siteUrl || 'http://localhost:3000',
    language: 'en',
    image: `${config.public.siteUrl || 'http://localhost:3000'}/favicon.ico`,
    favicon: `${config.public.siteUrl || 'http://localhost:3000'}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}`,
    generator: 'EJ Fox News - Pinboard + OpenRouter',
    feedLinks: {
      rss2: `${config.public.siteUrl || 'http://localhost:3000'}/api/rss`,
    },
    author: {
      name: 'EJ Fox News',
      email: 'news@ejfox.com',
      link: config.public.siteUrl || 'http://localhost:3000',
    }
  })

  try {
    // Get articles from storage
    const articles = await getAllArticles(50)
    
    // Add articles to feed
    articles.forEach((article) => {
      const tags = typeof article.tags === 'string' 
        ? article.tags.split(' ').filter(tag => tag !== '!news' && tag.trim() !== '')
        : article.tags?.filter(tag => tag !== '!news' && tag.trim() !== '') || []
      
      feed.addItem({
        title: article.title,
        id: article.url,
        link: article.url,
        description: article.summary,
        content: `
          <h2>${article.title}</h2>
          <p><strong>AI Summary:</strong> ${article.summary}</p>
          ${article.description ? `<p><strong>Original description:</strong> ${article.description}</p>` : ''}
          <p><strong>Tags:</strong> ${tags.join(', ')}</p>
          <p><a href="${article.url}" target="_blank">Read the full article →</a></p>
        `,
        author: [{
          name: 'EJ Fox News',
          email: 'news@ejfox.com',
          link: config.public.siteUrl || 'http://localhost:3000',
        }],
        date: new Date(article.time),
        category: tags.map(tag => ({ name: tag }))
      })
    })

    // Set proper content type
    setHeader(event, 'content-type', 'application/rss+xml')
    
    return feed.rss2()
  } catch (error) {
    console.error('RSS generation error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate RSS feed'
    })
  }
})