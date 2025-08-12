<template>
  <div :style="{ '--index': index }" class="mb-6">
    <UCard class="transition-transform transform hover:scale-[1.02]">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200">{{ article.title }}</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ formatDate(article.time) }} • via Pinboard
            </p>
          </div>
          <UBadge v-for="tag in displayTags" :key="tag" variant="outline" class="ml-2">
            {{ tag }}
          </UBadge>
        </div>
      </template>
      
      <div class="space-y-3">
        <p v-if="article.description" class="text-gray-600 dark:text-gray-400 text-sm italic">
          {{ article.description }}
        </p>
        <p class="text-gray-700 dark:text-gray-300 font-medium">{{ article.summary }}</p>
      </div>
      
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

<script setup lang="ts">
import { useClipboard, useShare } from '@vueuse/core'

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

const props = defineProps<{
  article: NewsArticle
  index: number
}>()

const { copy } = useClipboard()
const { isSupported: canShare, share } = useShare()
const toast = useToast()

const displayTags = computed(() => 
  props.article.tags.filter(tag => tag !== '!news' && tag.trim() !== '').slice(0, 3)
)

const copyLink = (url: string) => {
  copy(url)
  toast.add({ title: 'Link copied to clipboard!' })
}

const shareArticle = async (url: string) => {
  if (canShare.value) {
    try {
      await share({
        title: props.article.title,
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

const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
  return new Date(dateString).toLocaleDateString(undefined, options)
}
</script>