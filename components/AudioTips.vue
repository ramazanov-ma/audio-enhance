<template>
	<div class="bg-dark/50 backdrop-blur rounded-xl p-6 mt-8">
		<h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			Советы по улучшению аудио
		</h2>

		<div class="space-y-4">
			<div v-for="(tip, index) in tips" :key="index" class="bg-dark/30 p-4 rounded-lg">
				<h3 class="font-medium mb-2 flex items-center gap-2">
					<span class="text-secondary">{{ index + 1 }}.</span>
					{{ tip.title }}
				</h3>
				<p class="text-gray-300 text-sm">{{ tip.description }}</p>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
const tips = [
	{
		title: "Шумоподавление",
		description: "Начните с умеренных настроек шумоподавления (30-50%). Слишком агрессивное шумоподавление может ухудшить качество звука."
	},
	{
		title: "Нормализация",
		description: "Используйте нормализацию для выравнивания громкости аудио. Особенно полезно для записей с неравномерной громкостью."
	},
	{
		title: "Эквалайзер",
		description: "Для улучшения четкости голоса попробуйте немного поднять средние частоты (2-3 дБ) и слегка срезать низкие."
	},
	{
		title: "Стерео-эффект",
		description: "Для музыкальных записей расширение стерео создаст ощущение пространства, но для записей голоса лучше использовать минимальные значения."
	}
];
</script>