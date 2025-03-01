<template>
	<div class="flex flex-col">
		<div class="audio-wave-container relative h-36 bg-gray-800/50 rounded-lg overflow-hidden mb-2">
			<AudioWaveform :audio-url="audioUrl" ref="waveformRef" />
		</div>
		<div class="flex items-center justify-center gap-4">
			<button
				@click="togglePlay"
				class="p-3 rounded-full bg-accent hover:bg-accent/90 transition-colors shadow-lg flex items-center justify-center"
			>
				<svg v-if="isPlaying" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			</button>

			<div class="text-sm">
				{{ currentTime }} / {{ duration }}
			</div>

			<div class="volume-control flex items-center gap-2">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072M12 8c1.657 0 3 1.343 3 3s-1.343 3-3 3-3-1.343-3-3 1.343-3 3-3zm0 0V3" />
				</svg>
				<input
					type="range"
					min="0"
					max="1"
					step="0.01"
					v-model.number="volume"
					class="w-24"
					@input="updateSliderBackground"
					ref="volumeSlider"
				/>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, onBeforeUnmount } from 'vue'
import { useAudioPlayerManager } from '~/composables/useAudioPlayerManager'

const props = defineProps({
	audioUrl: {
		type: String,
		required: true
	}
})

// Уникальный ID для этого плеера
const playerId = ref(`player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
const waveformRef = ref(null)
const isPlaying = ref(false)
const volume = ref(0.8)
const currentTimeSeconds = ref(0)
const durationSeconds = ref(0)
const volumeSlider = ref(null)

// Получение менеджера плееров
const playerManager = useAudioPlayerManager()

// Форматирование времени в мм:сс
const formatTime = (seconds: number): string => {
	seconds = Math.max(0, seconds || 0)
	const mins = Math.floor(seconds / 60)
	const secs = Math.floor(seconds % 60)
	return `${mins}:${secs.toString().padStart(2, '0')}`
}

const currentTime = computed(() => formatTime(currentTimeSeconds.value))
const duration = computed(() => formatTime(durationSeconds.value))

// Обновляем бэкграунд ползунка громкости
const updateSliderBackground = (event) => {
	const target = event.target || volumeSlider.value
	if (!target) return

	const min = target.min || 0
	const max = target.max || 1
	const value = target.value

	const percentage = ((value - min) / (max - min)) * 100
	target.style.backgroundImage = `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${percentage}%, #374151 ${percentage}%, #374151 100%)`
}

// Пауза плеера (для вызова из менеджера плееров)
const pausePlayer = () => {
	if (isPlaying.value && waveformRef.value) {
		waveformRef.value.pause()
		isPlaying.value = false
	}
}

const togglePlay = async () => {
	if (!waveformRef.value) return

	if (!isPlaying.value) {
		// Активируем этот плеер в менеджере
		playerManager.activatePlayer(playerId.value)

		// Включаем воспроизведение
		waveformRef.value.play()
		isPlaying.value = true
	} else {
		// Останавливаем воспроизведение
		waveformRef.value.pause()
		isPlaying.value = false
	}
}

let timeUpdateInterval = null

onMounted(() => {
	// Регистрируем плеер в менеджере
	const unregister = playerManager.registerPlayer(playerId.value, pausePlayer)

	// Обновляем стиль ползунка громкости
	if (volumeSlider.value) {
		updateSliderBackground({ target: volumeSlider.value })
	}

	// Устанавливаем интервал для обновления текущего времени
	timeUpdateInterval = setInterval(() => {
		if (waveformRef.value && isPlaying.value) {
			// Получаем текущее время из WaveSurfer
			const waveSurfer = waveformRef.value.wavesurfer?.value
			if (waveSurfer) {
				currentTimeSeconds.value = waveSurfer.getCurrentTime()
				durationSeconds.value = waveSurfer.getDuration() || 0
			}
		}
	}, 250)

	// Отменяем регистрацию при уничтожении компонента
	onBeforeUnmount(() => {
		unregister()
		if (timeUpdateInterval) {
			clearInterval(timeUpdateInterval)
		}
	})
})

// Отслеживаем изменение громкости и обновляем у WaveSurfer
watch(volume, (newVolume) => {
	if (waveformRef.value?.wavesurfer?.value) {
		waveformRef.value.wavesurfer.value.setVolume(newVolume)
	}
})

// Обновляем плеер при изменении URL
watch(() => props.audioUrl, () => {
	isPlaying.value = false
	currentTimeSeconds.value = 0
	durationSeconds.value = 0
}, { immediate: false })
</script>

<style scoped>
input[type="range"] {
	-webkit-appearance: none;
	appearance: none;
	height: 6px;
	border-radius: 3px;
	background: #374151;
	outline: none;
}

input[type="range"]::-webkit-slider-thumb {
	-webkit-appearance: none;
	appearance: none;
	width: 16px;
	height: 16px;
	border-radius: 50%;
	background: #8B5CF6;
	cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
	width: 16px;
	height: 16px;
	border-radius: 50%;
	background: #8B5CF6;
	cursor: pointer;
}
</style>