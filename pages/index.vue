<template>
  <div class="min-h-screen bg-white dark:bg-black text-black dark:text-white font-mono">
    <!-- Masthead -->
    <header class="border-b border-black dark:border-white">
      <div class="max-w-7xl mx-auto px-8 py-16">
        <div class="grid grid-cols-12 gap-8">
          <div class="col-span-12 lg:col-span-8">
            <h1 class="text-6xl lg:text-8xl font-normal tracking-tight leading-none mb-4">
              EJ FOX<br>NEWS
            </h1>
            <div class="w-24 h-px bg-black dark:bg-white mb-6"></div>
            <p class="text-sm uppercase tracking-widest">
              Pinboard × OpenRouter × AI Curation
            </p>
          </div>
          <div class="col-span-12 lg:col-span-4 flex flex-col justify-end">
            <div class="text-right text-xs uppercase tracking-wider space-y-2">
              <div>{{ new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) }}</div>
              <div v-if="formattedTime" class="opacity-60">
                Update: {{ formattedTime }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Error State -->
    <div v-if="errorMessage" class="border-b border-black dark:border-white">
      <div class="max-w-7xl mx-auto px-8 py-8">
        <div class="bg-black dark:bg-white text-white dark:text-black p-6">
          <div class="text-xs uppercase tracking-widest mb-2">Error</div>
          <div class="text-sm">{{ errorMessage }}</div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && newsArticles.length === 0" class="border-b border-black dark:border-white">
      <div class="max-w-7xl mx-auto px-8 py-24 text-center">
        <div class="text-xs uppercase tracking-widest opacity-60">Loading stories...</div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="newsArticles.length === 0 && !loading" class="border-b border-black dark:border-white">
      <div class="max-w-7xl mx-auto px-8 py-24 text-center">
        <div class="text-xs uppercase tracking-widest opacity-60">No stories found</div>
        <div class="text-xs mt-2 opacity-40">Tag bookmarks with !news in Pinboard</div>
      </div>
    </div>

    <!-- News Grid -->
    <main class="max-w-7xl mx-auto px-8 py-16">
      <div class="grid grid-cols-12 gap-8">
        <article 
          v-for="(article, index) in newsArticles" 
          :key="article.id"
          :class="getArticleColumnClass(index)"
          class="border-b border-black dark:border-white pb-12 mb-12 last:border-b-0 last:mb-0"
        >
          <!-- Article Number -->
          <div class="text-xs uppercase tracking-widest opacity-40 mb-6">
            {{ String(index + 1).padStart(2, '0') }}
          </div>

          <!-- Headline -->
          <h2 class="text-2xl lg:text-3xl font-normal leading-tight mb-8 tracking-tight">
            <a :href="article.url" target="_blank" class="hover:opacity-60 transition-opacity">
              {{ article.title }}
            </a>
          </h2>

          <!-- Meta Info -->
          <div class="text-xs uppercase tracking-wider opacity-60 mb-8 space-y-1">
            <div>{{ formatDate(article.time) }}</div>
            <div v-if="article.tags.filter(t => t !== '!news').length > 0">
              {{ article.tags.filter(t => t !== '!news').slice(0, 3).join(' · ') }}
            </div>
          </div>

          <!-- Summary -->
          <div class="prose prose-sm max-w-none mb-8">
            <p class="text-sm leading-relaxed">{{ article.summary }}</p>
          </div>

          <!-- Actions -->
          <div class="flex space-x-6 text-xs uppercase tracking-widest">
            <button @click="copyLink(article.url)" class="hover:opacity-60 transition-opacity">
              Copy
            </button>
            <button v-if="canShare" @click="shareArticle(article.url)" class="hover:opacity-60 transition-opacity">
              Share
            </button>
            <a :href="article.url" target="_blank" class="hover:opacity-60 transition-opacity">
              Read →
            </a>
          </div>
        </article>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-black dark:border-white mt-24">
      <div class="max-w-7xl mx-auto px-8 py-8">
        <div class="flex justify-center items-center space-x-8 text-xs uppercase tracking-widest opacity-40">
          <span>Automated news curation system</span>
          <a href="/api/rss" target="_blank" class="hover:opacity-100 transition-opacity">
            RSS Feed
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>


<script setup lang="ts">
import { useIntervalFn, useClipboard, useShare } from '@vueuse/core'

interface NewsArticle {
  id: string
  url: string
  title: string
  description?: string
  summary: string
  tags: string[]
  time: string
  processed_at: string
}

const newsArticles = ref<NewsArticle[]>([])
const loading = ref(false)
const errorMessage = ref('')
const { copy } = useClipboard()
const { isSupported: canShare, share } = useShare()
const toast = useToast()

// Swiss grid layout logic
const getArticleColumnClass = (index: number) => {
  // Varied column spans for visual interest - Swiss magazine style
  const patterns = [
    'col-span-12 lg:col-span-8',    // Lead story - full width
    'col-span-12 lg:col-span-4',    // Secondary story  
    'col-span-12 lg:col-span-6',    // Half width
    'col-span-12 lg:col-span-6',    // Half width
    'col-span-12 lg:col-span-4',    // Third width
    'col-span-12 lg:col-span-8',    // Two thirds
    'col-span-12 lg:col-span-12',   // Full width feature
  ]
  return patterns[index % patterns.length]
}

// Article actions
const copyLink = (url: string) => {
  copy(url)
  toast.add({ title: 'Link copied' })
}

const shareArticle = async (url: string) => {
  if (canShare.value) {
    try {
      await share({ url })
    } catch (err) {
      copyLink(url)
    }
  } else {
    copyLink(url)
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).toUpperCase()
}

const loadAndProcessNews = async () => {
  loading.value = true
  errorMessage.value = ''
  
  try {
    // Try to load from database first (already processed articles)
    try {
      const dbArticles = await $fetch('/api/articles')
      if (dbArticles && Array.isArray(dbArticles) && dbArticles.length > 0) {
        newsArticles.value = dbArticles.map((article: any) => ({
          id: article.id,
          url: article.url,
          title: article.title,
          description: article.description,
          summary: article.summary,
          tags: Array.isArray(article.tags) ? article.tags : article.tags.split(' '),
          time: article.time,
          processed_at: article.processed_at
        }))
        console.log(`Loaded ${dbArticles.length} articles from database`)
        loading.value = false
        return // We have articles, done!
      }
    } catch (dbError) {
      console.log('No database articles available, falling back to live processing')
    }
    
    // Fallback: load raw bookmarks first to ensure we show something
    const bookmarks = await $fetch('/api/pinboard/bookmarks')
    
    console.log('Bookmarks response type:', typeof bookmarks, 'Array?', Array.isArray(bookmarks))
    
    if (!bookmarks) {
      errorMessage.value = 'Failed to load bookmarks from Pinboard'
      return
    }
    
    // Ensure bookmarks is an array
    const bookmarksArray = Array.isArray(bookmarks) ? bookmarks : []
    
    if (bookmarksArray.length === 0) {
      errorMessage.value = 'No !news bookmarks found in Pinboard'
      return
    }
    
    // Show bookmarks immediately
    newsArticles.value = bookmarksArray.map((bookmark: any) => ({
      id: bookmark.hash,
      url: bookmark.href,
      title: bookmark.description,
      description: bookmark.extended,
      summary: 'Generating AI summary...',
      tags: bookmark.tags.split(' '),
      time: bookmark.time,
      processed_at: new Date().toISOString()
    }))
    
    // Now try to get AI summaries in the background
    try {
      const response = await $fetch('/api/news/process', {
        method: 'POST'
      })
      
      if (response?.news && Array.isArray(response.news) && response.news.length > 0) {
        // Update with AI summaries - properly type the articles
        const validArticles: NewsArticle[] = response.news
          .filter((article: any) => !article.error)
          .map((article: any) => ({
            id: article.id,
            url: article.url,
            title: article.title,
            description: article.description,
            summary: article.summary,
            tags: Array.isArray(article.tags) ? article.tags : article.tags.split(' '),
            time: article.time,
            processed_at: article.processed_at
          }))
        
        newsArticles.value = validArticles
        console.log(`Updated with ${validArticles.length} AI-processed articles`)
      }
    } catch (aiError: any) {
      // If AI processing fails, keep the bookmarks but update summary text
      newsArticles.value = newsArticles.value.map(article => ({
        ...article,
        summary: article.description || 'AI summary temporarily unavailable'
      }))
      console.log('AI processing failed, showing raw bookmarks:', aiError.message)
    }
    
  } catch (err: any) {
    errorMessage.value = 'Unable to load bookmarks from Pinboard'
    console.error('Failed to load bookmarks:', err)
  } finally {
    loading.value = false
  }
}

// Auto-update functionality
const updateTimes = [0, 4, 8, 12, 16, 20]
const getNextUpdateTime = () => {
  const now = new Date()
  const currentHour = now.getHours()
  const nextHour = updateTimes.find(hour => hour > currentHour)
  const nextUpdateDate = new Date(now)
  if (nextHour !== undefined) {
    nextUpdateDate.setHours(nextHour, 0, 0, 0)
  } else {
    nextUpdateDate.setDate(now.getDate() + 1)
    nextUpdateDate.setHours(updateTimes[0], 0, 0, 0)
  }
  return nextUpdateDate.getTime()
}

const nextUpdate = ref(getNextUpdateTime())
const formattedTime = ref('')

const updateFormattedTime = () => {
  const remainingTime = nextUpdate.value - Date.now()
  if (remainingTime <= 0) {
    nextUpdate.value = getNextUpdateTime()
    loadAndProcessNews()
    formattedTime.value = 'Updating now...'
  } else {
    const hours = Math.floor((remainingTime / (1000 * 60 * 60)) % 24)
    const minutes = Math.floor((remainingTime / (1000 * 60)) % 60)
    const seconds = Math.floor((remainingTime / 1000) % 60)
    formattedTime.value = `${hours}h ${minutes}m ${seconds}s`
  }
}

useIntervalFn(updateFormattedTime, 1000)

onMounted(() => {
  loadAndProcessNews()
  updateFormattedTime()
})
</script>

<style scoped>
/* Swiss typography refinements */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');

.font-mono {
  font-family: 'JetBrains Mono', 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
}

/* Ensure proper contrast */
.prose p {
  @apply text-current;
}

/* Smooth interactions */
a, button {
  transition: opacity 150ms ease;
}

/* Grid system respects Swiss principles */
.grid {
  @apply items-start;
}
</style>
