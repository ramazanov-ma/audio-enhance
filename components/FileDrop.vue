<template>
	<div
		class="file-drop border-2 border-dashed border-gray-600 rounded-xl p-12 text-center hover:border-accent transition-colors relative"
		@dragover.prevent="dragover = true"
		@dragleave.prevent="dragover = false"
		@drop.prevent="onDrop"
		:class="{ 'border-accent bg-accent/10': dragover }"
	>
		<input
			ref="fileInput"
			type="file"
			accept="audio/*"
			class="hidden"
			@change="onFileSelected"
		/>

		<div class="flex flex-col items-center justify-center">
			<div class="text-accent mb-4">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" viewBox="0 0 20 20" fill="currentColor">
					<path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
				</svg>
			</div>

			<h3 class="text-xl font-medium mb-2">Загрузите аудиофайл для обработки</h3>
			<p class="text-gray-400 mb-6">Перетащите файл сюда или нажмите для выбора</p>

			<button
				@click="$refs.fileInput.click()"
				class="px-6 py-3 bg-accent hover:bg-accent/80 rounded-full transition-colors"
			>
				Выбрать аудиофайл
			</button>

			<div class="mt-4 text-sm text-gray-500">
				Поддерживаемые форматы: WAV, MP3, OGG, FLAC, AAC
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits(['file-selected'])
const dragover = ref(false)
const fileInput = ref(null)

const onFileSelected = (event: Event) => {
	const target = event.target as HTMLInputElement
	if (target.files && target.files.length > 0) {
		emit('file-selected', target.files[0])
	}
}

const onDrop = (event: DragEvent) => {
	dragover.value = false
	if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
		emit('file-selected', event.dataTransfer.files[0])
	}
}
</script>

<style scoped>
.file-drop {
	min-height: 300px;
	cursor: pointer;
	transition: all 0.2s ease;
}
</style>