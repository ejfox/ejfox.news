<template>
  <div :style="{ '--index': index }" class="mb-6">
    <UCard class="transition-transform transform hover:scale-[1.02]">
      <template #header>
        <div class="flex items-center">
          <img v-if="article.thumbnail" :src="article.thumbnail" alt="Article Thumbnail"
            class="w-16 h-16 object-cover rounded mr-4" loading="lazy" />
          <div>
            <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200">{{ article.title }}</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ formatDate(article.created_at) }} • {{ article.author || 'Unknown Author' }}
            </p>
          </div>
        </div>
      </template>
      <p class="text-gray-700 dark:text-gray-300 mt-2">{{ article.summary }}</p>
      <template #footer>
        <div class="flex justify-between items-center mt-4">
          <UButton @click="copyLink(article.url)" :icon="'i-mdi-content-copy'" variant="ghost" aria-label="Copy link" />
          <div class="flex items-center space-x-2">
            <UButton @click="shareArticle(article.url)" :icon="'i-mdi-share-variant'" variant="ghost"
              aria-label="Share article" v-if="canShare" />
            <UButton :href="article.url" target="_blank" :icon="'i-mdi-open-in-new'" variant="ghost"
              aria-label="Open article" />
          </div>
        </div>
      </template>
    </UCard>
  </div>
</template>

<script lang="ts" setup>
import { useClipboard, useShare } from '@vueuse/core'

// Define the Article interface
interface Article {
  id: number
  title: string
  summary: string
  url: string
  thumbnail?: string
  created_at: string
  author?: string
}

// Props
const props = defineProps<{
  article: Article
  index: number
}>()

// Clipboard and Share Functionality
const { copy } = useClipboard()
const { isSupported: canShare, share } = useShare()
const toast = useToast()

// Methods
const copyLink = (url: string) => {
  copy(url)
  toast.show('Link copied to clipboard!', { duration: 2000 })
}

const shareArticle = async (url: string) => {
  if (canShare.value) {
    try {
      await share({
        title: 'Check out this article on ejfox.news',
        url,
      })
    } catch (err) {
      console.error('Error sharing article:', err)
      copyLink(url)
    }
  } else {
    copyLink(url)
  }
}

// Helper Functions
const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
  return new Date(dateString).toLocaleDateString(undefined, options)
}
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
