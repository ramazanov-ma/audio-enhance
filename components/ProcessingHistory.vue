<template>
	<div class="bg-dark/50 backdrop-blur rounded-xl p-6 mt-8">
		<h2 class="text-2xl font-semibold mb-4 flex items-center gap-2">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			История обработки
		</h2>

		<div v-if="processingHistory.length > 0" class="space-y-4">
			<div
				v-for="(item, index) in processingHistory"
				:key="index"
				class="border border-gray-700 rounded-lg p-4 flex justify-between items-center"
			>
				<div>
					<h3 class="font-medium mb-1">{{ item.fileName }}</h3>
					<div class="flex gap-3 text-sm text-gray-400">
						<span>{{ item.date }}</span>
						<span>{{ formatFileSize(item.fileSize) }}</span>
					</div>
				</div>
				<div class="flex gap-2">
					<button
						@click="downloadFile(item)"
						class="p-2 rounded-lg bg-dark hover:bg-primary/20 transition text-primary"
						title="Скачать"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
						</svg>
					</button>
					<button
						@click="removeFromHistory(index)"
						class="p-2 rounded-lg bg-dark hover:bg-red-500/20 transition text-red-500"
						title="Удалить из истории"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
					</button>
				</div>
			</div>
		</div>

		<div v-else class="text-center py-8 text-gray-400">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<p>История пока пуста</p>
			<p class="text-sm mt-1">Обработанные аудиофайлы появятся здесь</p>
		</div>
	</div>
</template>

<script setup lang="ts">
// В реальном приложении это могло бы храниться в localStorage или IndexedDB
const processingHistory = ref([
	{
		id: 1,
		fileName: 'interview_enhanced.wav',
		date: '01.03.2025',
		fileSize: 2540000,
		url: '#'
	},
	{
		id: 2,
		fileName: 'podcast_episode_12_improved.mp3',
		date: '28.02.2025',
		fileSize: 4200000,
		url: '#'
	}
]);

// Форматирование размера файла
const formatFileSize = (bytes: number): string => {
	if (bytes < 1024) return bytes + ' bytes';
	else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
	else return (bytes / 1048576).toFixed(1) + ' MB';
};

// Удаление из истории
const removeFromHistory = (index: number) => {
	processingHistory.value.splice(index, 1);
};

// Скачивание файла
const downloadFile = (item: any) => {
	// В реальном приложении здесь был бы код для скачивания файла
	alert(`Скачивание файла: ${item.fileName}`);
};
</script>