interface ProcessedBookmark {
  url: string
  title: string
  description: string
  tags: string[]
  time: string
  shared: boolean
  toread: boolean
  hash: string
}

interface BookmarksResponse {
  bookmarks: ProcessedBookmark[]
  count: number
  total: number
  tag: string
  cached_at: string
  error?: string
  message?: string
}

export const useBookmarks = () => {
  const bookmarks = ref<ProcessedBookmark[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastFetched = ref<string | null>(null)

  const fetchBookmarks = async (options: {
    count?: number
    tag?: string
    baseUrl?: string
  } = {}) => {
    isLoading.value = true
    error.value = null

    try {
      const { count = 300, tag = '!news', baseUrl = 'https://ejfox.com' } = options
      
      const params = new URLSearchParams({
        count: count.toString()
      })
      
      if (tag && tag !== '!news') {
        params.append('tag', tag)
      }
      
      const url = `${baseUrl}/api/bookmarks?${params}`
      const data = await $fetch<BookmarksResponse>(url)
      
      if (data.error) {
        throw new Error(data.message || 'Failed to fetch bookmarks')
      }
      
      bookmarks.value = data.bookmarks
      lastFetched.value = data.cached_at
      
      return data
      
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch bookmarks'
      console.error('Bookmarks fetch error:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const getBookmarksByTag = (tag: string) => {
    return computed(() => 
      bookmarks.value.filter(bookmark => 
        bookmark.tags.includes(tag)
      )
    )
  }

  const getAllTags = computed(() => {
    const tagCounts = new Map<string, number>()
    
    bookmarks.value.forEach(bookmark => {
      bookmark.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })
    })
    
    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .map(([tag, count]) => ({ tag, count }))
  })

  const getRecentBookmarks = (days: number = 7) => {
    return computed(() => {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      
      return bookmarks.value.filter(bookmark => {
        const bookmarkDate = new Date(bookmark.time)
        return bookmarkDate >= cutoffDate
      })
    })
  }

  return {
    bookmarks: readonly(bookmarks),
    isLoading: readonly(isLoading),
    error: readonly(error),
    lastFetched: readonly(lastFetched),
    fetchBookmarks,
    getBookmarksByTag,
    getAllTags,
    getRecentBookmarks
  }
}