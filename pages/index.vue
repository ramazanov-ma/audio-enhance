<template>
	<div class="py-8">
		<div class="container mx-auto px-4">
			<h1 class="text-3xl font-bold text-center mb-8">Аудио Энхансер</h1>

			<div v-if="!audioStore.hasAudioFile" class="upload-section py-8">
				<FileDrop @file-selected="handleFileSelect" />
			</div>

			<div v-else>
				<AudioProcessor />
			</div>

			<!-- История обработки -->
			<div v-if="audioStore.processingHistory.length > 0" class="mt-12">
				<div class="flex justify-between items-center mb-6">
					<h2 class="text-2xl font-semibold">История обработки</h2>
					<button
						@click="clearAllHistory"
						class="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 rounded-lg text-white transition"
					>
						Очистить всю историю
					</button>
				</div>

				<div class="grid md:grid-cols-2 gap-4">
					<div
						v-for="item in audioStore.processingHistory"
						:key="item.id"
						class="bg-dark/50 rounded-lg p-4 border border-gray-700"
					>
						<div class="flex justify-between items-center mb-2">
							<h3 class="font-medium">{{ item.processedName }}</h3>
							<button
								@click="removeHistoryItem(item.id)"
								class="text-gray-400 hover:text-red-500 transition"
							>
								<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
									<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
								</svg>
							</button>
						</div>
						<p class="text-sm text-gray-400">Исходный файл: {{ item.originalName }}</p>
						<p class="text-sm text-gray-400">Дата обработки: {{ item.dateProcessed }}</p>
						<div class="text-xs text-gray-500">
							Размер до: {{ formatFileSize(item.originalSize) }} |
							После: {{ formatFileSize(item.processedSize) }}
						</div>

						<div class="mt-3 flex justify-end">
							<a
								v-if="item.url"
								:href="item.url"
								download
								class="text-accent hover:text-accent/80 text-sm flex items-center gap-1"
							>
								<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
									<path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
								</svg>
								Скачать
							</a>
						</div>
					</div>
				</div>
			</div>

			<!-- Точные данные о пользователе -->
			<div class="mt-10 text-right text-sm text-gray-500">
				<p>Current User's Login: {{ currentUser }}</p>
				<p>Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS formatted): {{ currentDateTime }}</p>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useAudioStore } from '~/store/audio'
import { onMounted, ref } from 'vue'

const audioStore = useAudioStore()
// Обновляем согласно указанной информации
const currentUser = 'ramazanov-ma'
const currentDateTime = '2025-03-01 19:46:20'

// Функция для форматирования размера файла
const formatFileSize = (bytes: number): string => {
	if (bytes < 1024) return bytes + ' bytes'
	else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
	else return (bytes / 1048576).toFixed(1) + ' MB'
}

// Обработка выбора файла
const handleFileSelect = (file: File) => {
	audioStore.setAudioFile(file)
}

// Удаление элемента из истории
const removeHistoryItem = (id: string) => {
	audioStore.removeFromHistory(id)
}

// Очистка всей истории
const clearAllHistory = () => {
	audioStore.clearHistory()
}

onMounted(() => {
	// Очищаем историю при монтировании для удаления дефолтных файлов
	audioStore.clearHistory()

	// Загрузка истории обработки из localStorage
	audioStore.loadHistory()

	// Устанавливаем фиксированные значения в хранилище
	audioStore.currentDateTime = currentDateTime
	audioStore.currentUser = currentUser
})
</script>