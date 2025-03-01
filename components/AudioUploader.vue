<template>
	<div class="flex flex-col items-center justify-center py-12">
		<div
			class="border-2 border-dashed border-gray-600 rounded-lg p-8 w-full max-w-2xl transition-all duration-300"
			:class="{ 'border-accent bg-accent/10': isDragging }"
			@dragover.prevent="isDragging = true"
			@dragleave.prevent="isDragging = false"
			@drop.prevent="onDrop"
		>
			<div class="text-center">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-accent mb-4" fill="none"
					 viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
						  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
				</svg>

				<h3 class="text-xl font-semibold mb-2">Перетащите аудиофайл сюда</h3>
				<p class="text-gray-400 mb-6">или нажмите для выбора файла</p>

				<input
					ref="fileInput"
					type="file"
					accept="audio/*"
					class="hidden"
					@change="onFileChange"
				>

				<button
					@click="fileInput.click()"
					class="px-6 py-2 bg-primary hover:bg-primary/80 rounded-full font-medium transition-colors"
				>
					Выбрать файл
				</button>
			</div>
		</div>

		<div class="mt-8 text-center">
			<h4 class="text-lg font-medium mb-2">Поддерживаемые форматы</h4>
			<div class="flex gap-2 justify-center flex-wrap">
        <span v-for="format in supportedFormats" :key="format"
			  class="inline-block px-3 py-1 bg-gray-800 rounded-full text-sm">
          {{ format }}
        </span>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAudioStore } from '~/store/audio'

const audioStore = useAudioStore()
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const supportedFormats = [
	'MP3', 'WAV', 'OGG', 'AAC', 'FLAC', 'M4A'
]

const onFileChange = (event: Event) => {
	const target = event.target as HTMLInputElement
	if (target.files && target.files.length > 0) {
		handleFile(target.files[0])
	}
}

const onDrop = (event: DragEvent) => {
	isDragging.value = false
	if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
		handleFile(event.dataTransfer.files[0])
	}
}

const handleFile = (file: File) => {
	const validAudioTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac', 'audio/m4a']

	if (!validAudioTypes.includes(file.type) && !file.type.startsWith('audio/')) {
		alert('Пожалуйста, загрузите аудиофайл в правильном формате.')
		return
	}

	audioStore.setAudioFile(file)
}
</script>