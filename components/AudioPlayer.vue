<template>
	<div class="audio-player bg-dark/50 rounded-lg p-3 border border-gray-700">
		<!-- Волновая дорожка на полную высоту -->
		<div class="flex flex-col gap-2">
			<div class="waveform-container relative" ref="waveformContainer">
				<!-- Волновая дорожка (waveform) -->
				<div class="absolute inset-0" ref="waveformElement"></div>

				<!-- Прогресс бар -->
				<div class="progress-overlay absolute top-0 left-0 h-full bg-accent/30 pointer-events-none" :style="{ width: `${progressPercentage}%` }"></div>

				<!-- Область для клика -->
				<div
					class="absolute inset-0 cursor-pointer"
					@click="seekTo"
				></div>
			</div>

			<!-- Контроллеры под волновой дорожкой -->
			<div class="flex items-center justify-between">
				<!-- Отображение времени слева -->
				<div class="time-display text-xs text-gray-400">
					<span>{{ formatTime(currentTime) }}</span>
				</div>

				<!-- Кнопка Play по центру -->
				<button
					@click="togglePlay"
					class="play-btn h-10 w-10 bg-accent hover:bg-accent/80 rounded-full flex items-center justify-center transition-colors mx-auto"
					:class="{ 'loading': loading }"
				>
					<span v-if="loading" class="loading-spinner"></span>
					<svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
						<path v-if="isPlaying" fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
						<path v-else fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
					</svg>
				</button>

				<!-- Управление громкостью и отображение полного времени справа -->
				<div class="flex items-center gap-2">
					<span class="text-xs text-gray-400">{{ formatTime(duration) }}</span>
					<button @click="toggleMute" class="text-gray-400 hover:text-white transition ml-3">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
							<path v-if="isMuted" fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clip-rule="evenodd" />
							<path v-else-if="volume < 0.5" fill-rule="evenodd" d="M10 3.75a.75.75 0 00-1.264-.546L4.703 7H3.167a.75.75 0 00-.75.75v4.5c0 .414.336.75.75.75h1.536l4.033 3.796A.75.75 0 0010 16.25v-12.5zm2.792 5.744a.75.75 0 10-1.084 1.036 2.5 2.5 0 010 2.94.75.75 0 001.084 1.036 4 4 0 000-5.012z" />
							<path v-else fill-rule="evenodd" d="M10 3.75a.75.75 0 00-1.264-.546L4.703 7H3.167a.75.75 0 00-.75.75v4.5c0 .414.336.75.75.75h1.536l4.033 3.796A.75.75 0 0010 16.25v-12.5zm2.792 5.744a.75.75 0 10-1.084 1.036 2.5 2.5 0 010 2.94.75.75 0 001.084 1.036 4 4 0 000-5.012z M14.523 8.7a.75.75 0 00-1.046 1.073 4.25 4.25 0 010 5.454.75.75 0 001.046 1.073 5.75 5.75 0 000-7.6z" />
						</svg>
					</button>

					<input
						type="range"
						min="0"
						max="1"
						step="0.01"
						v-model="volume"
						class="volume-slider w-16"
					/>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import WaveSurfer from 'wavesurfer.js'
import { useAudioStore } from '~/store/audio'

const props = defineProps({
	audioUrl: {
		type: String,
		required: true
	},
	playerId: {
		type: String,
		required: true
	}
})

const audioStore = useAudioStore()

// Состояние плеера
const audio = ref<HTMLAudioElement | null>(null)
const wavesurfer = ref<WaveSurfer | null>(null)
const isPlaying = ref(false)
const loading = ref(true)
const isMuted = ref(false)
const volume = ref(0.8)
const currentTime = ref(0)
const duration = ref(0)
const waveformContainer = ref(null)
const waveformElement = ref(null)

// Вычисляемые свойства
const progressPercentage = computed(() => {
	if (duration.value === 0) return 0
	return (currentTime.value / duration.value) * 100
})

// Форматирование времени
const formatTime = (seconds: number): string => {
	seconds = Math.floor(seconds)
	const minutes = Math.floor(seconds / 60)
	seconds = seconds % 60
	return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// Управление воспроизведением с поддержкой одиночного проигрывания
const togglePlay = () => {
	if (!wavesurfer.value) return

	if (isPlaying.value) {
		wavesurfer.value.pause()
		audioStore.setCurrentPlaying(null)
	} else {
		// Если сейчас проигрывается другая дорожка, останавливаем ее
		if (audioStore.currentPlayingId && audioStore.currentPlayingId !== props.playerId) {
			// Событие для остановки предыдущего проигрывания
			window.dispatchEvent(new CustomEvent('audio-stop', {
				detail: { exceptId: props.playerId }
			}))
		}

		wavesurfer.value.play()
		audioStore.setCurrentPlaying(props.playerId)
	}
}

// Управление звуком
const toggleMute = () => {
	if (!wavesurfer.value) return

	isMuted.value = !isMuted.value
	wavesurfer.value.setMuted(isMuted.value)
}

// Перемотка
const seekTo = (event: MouseEvent) => {
	if (!wavesurfer.value || !waveformContainer.value) return

	const container = waveformContainer.value as HTMLDivElement
	const rect = container.getBoundingClientRect()
	const offsetX = event.clientX - rect.left
	const percentage = offsetX / rect.width

	wavesurfer.value.seekTo(percentage)
}

// Остановка проигрывания в ответ на внешнее событие
const handleExternalStopEvent = (event: CustomEvent) => {
	if (event.detail?.exceptId === props.playerId) return
	if (wavesurfer.value && isPlaying.value) {
		wavesurfer.value.pause()
	}
}

// Инициализация волновой дорожки
const initWaveform = () => {
	if (!waveformElement.value || !props.audioUrl) return

	// Уничтожаем предыдущий экземпляр, если есть
	if (wavesurfer.value) {
		wavesurfer.value.destroy()
	}

	wavesurfer.value = WaveSurfer.create({
		container: waveformElement.value,
		waveColor: '#64748B',
		progressColor: '#8B5CF6',
		cursorColor: '#8B5CF6',
		barWidth: 2,
		barRadius: 2,
		barGap: 1,
		height: 90,  // Увеличиваем высоту волновой дорожки
		responsive: true,
		normalize: true,
		partialRender: true,
		fillParent: true
	})

	// Загружаем аудио в wavesurfer
	wavesurfer.value.load(props.audioUrl)

	// События wavesurfer
	wavesurfer.value.on('ready', () => {
		loading.value = false
		duration.value = wavesurfer.value?.getDuration() || 0
		wavesurfer.value?.setVolume(volume.value)

		// Проверка на пустую дорожку
		const audioData = wavesurfer.value.getDecodedData()
		let maxValue = 0;

		if (audioData) {
			for (let channel = 0; channel < audioData.numberOfChannels; channel++) {
				const channelData = audioData.getChannelData(channel)
				for (let i = 0; i < Math.min(10000, channelData.length); i++) {
					maxValue = Math.max(maxValue, Math.abs(channelData[i]))
				}
			}

			console.log(`[${props.playerId}] Max audio value: ${maxValue}`)

			// Если значения слишком малы, масштабируем их для отображения
			if (maxValue > 0 && maxValue < 0.01) {
				wavesurfer.value.setOptions({
					normalize: true,
					waveColor: '#64748B',
					progressColor: '#8B5CF6'
				})
				console.log(`[${props.playerId}] Normalizing waveform display due to low amplitude`)
			}
		}
	})

	wavesurfer.value.on('play', () => {
		isPlaying.value = true
	})

	wavesurfer.value.on('pause', () => {
		isPlaying.value = false
	})

	wavesurfer.value.on('finish', () => {
		isPlaying.value = false
		audioStore.setCurrentPlaying(null)
	})

	wavesurfer.value.on('audioprocess', (time) => {
		currentTime.value = time
	})

	wavesurfer.value.on('error', (err) => {
		loading.value = false
		console.error('WaveSurfer error:', err)
	})
}

// Применение изменения громкости
watch(volume, (newVolume) => {
	if (wavesurfer.value) {
		wavesurfer.value.setVolume(newVolume)
	}
})

// Обновление аудио при изменении URL
watch(() => props.audioUrl, (newUrl) => {
	if (!newUrl) return

	loading.value = true
	isPlaying.value = false
	currentTime.value = 0
	duration.value = 0

	nextTick(() => {
		initWaveform()
	})
})

// Отслеживание изменений в хранилище для синхронизации состояния
watch(() => audioStore.currentPlayingId, (newId) => {
	// Если текущий плеер перестал быть активным - остановим его
	if (isPlaying.value && newId !== props.playerId) {
		if (wavesurfer.value) {
			wavesurfer.value.pause()
		}
	}
})

// Инициализация при монтировании компонента
onMounted(() => {
	// Добавляем слушатель события для остановки проигрывания
	window.addEventListener('audio-stop', handleExternalStopEvent as EventListener)

	// Инициализация waveform с небольшой задержкой
	setTimeout(() => {
		initWaveform()
	}, 100)
})

// Очистка ресурсов при размонтировании компонента
onUnmounted(() => {
	// Если этот плеер был активным, очищаем состояние
	if (audioStore.currentPlayingId === props.playerId) {
		audioStore.setCurrentPlaying(null)
	}

	// Удаляем слушатель события
	window.removeEventListener('audio-stop', handleExternalStopEvent as EventListener)

	// Уничтожаем wavesurfer
	if (wavesurfer.value) {
		wavesurfer.value.destroy()
		wavesurfer.value = null
	}
})
</script>

<style scoped>
.audio-player {
	font-family: 'Inter', sans-serif;
}

.play-btn {
	transition: transform 0.1s ease;
}

.play-btn:active {
	transform: scale(0.95);
}

.volume-slider {
	-webkit-appearance: none;
	appearance: none;
	height: 4px;
	border-radius: 2px;
	background: linear-gradient(to right, #8B5CF6 var(--volume-percentage, 80%), #4B5563 var(--volume-percentage, 80%));
}

.volume-slider::-webkit-slider-thumb {
	-webkit-appearance: none;
	appearance: none;
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background: #8B5CF6;
	cursor: pointer;
	border: none;
}

.volume-slider::-moz-range-thumb {
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background: #8B5CF6;
	cursor: pointer;
	border: none;
}

.waveform-container {
	position: relative;
	user-select: none;
	border-radius: 8px;
	overflow: hidden;
	background-color: #1F2937;
	padding: 12px;
	height: 100px; /* Задаем фиксированную высоту контейнера */
}

/* Обеспечиваем, чтобы canvas занимал всю доступную высоту */
.waveform-container wave {
	height: 100% !important;
}

/* Анимация загрузки */
.loading-spinner {
	width: 16px;
	height: 16px;
	border: 2px solid rgba(255, 255, 255, 0.3);
	border-radius: 50%;
	border-top-color: #fff;
	animation: spin 1s linear infinite;
}

@keyframes spin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}
</style>