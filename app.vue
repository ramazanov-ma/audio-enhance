<template>
	<div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-light">
		<AppHeader />
		<main class="container mx-auto p-4">
			<NuxtPage />
		</main>
		<AppFooter />

		<!-- Компонент для инициализации приложения -->
		<AppInit />
	</div>
</template>

<script setup lang="ts">
// Глобальные стили и настройки
useHead({
	title: 'Audio Enhancer - Улучшение качества звука'
})
</script>

<style>
body {
	font-family: 'Inter', sans-serif;
}

/* Импорт шрифта Inter */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
@import url('@/assets/css/custom-sliders.css');
</style>