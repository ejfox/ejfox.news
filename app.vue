<template>
  <div>
    <!-- Accessibility enhancement: announces route changes to screen readers -->
    <NuxtRouteAnnouncer />

    <!-- Main layout wrapper -->
    <NuxtLayout>
      <!-- Loading indicator -->
      <NuxtLoading />
      <!-- Rendered page content -->
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script lang="ts" setup>
useHead({
  titleTemplate: '%s - ejfox.news',
  meta: [
    { name: 'description', content: 'A clean, intentional reading experience for news from your friend EJ.' },
    // Open Graph tags
    { property: 'og:title', content: 'ejfox.news - Deliberate News Consumption' },
    { property: 'og:description', content: 'A clean, intentional reading experience for news from your friend EJ.' },
    { property: 'og:image', content: '/og-image.png' },
    { property: 'og:url', content: 'https://ejfox.news' },
    { property: 'og:type', content: 'website' },
    // Twitter Card tags
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'ejfox.news - Deliberate News Consumption' },
    { name: 'twitter:description', content: 'A clean, intentional reading experience for news from your friend EJ.' },
    { name: 'twitter:image', content: '/twitter-image.png' },
    { name: 'twitter:site', content: '@mrejfox' },
  ],
})
</script>
