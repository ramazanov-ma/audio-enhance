<template>
	<div class="flex flex-col gap-6">
		<div class="flex justify-between items-center">
			<h2 class="text-2xl font-semibold">{{ audioStore.audioFile?.name }}</h2>
			<button
				@click="audioStore.resetAudio"
				class="text-gray-400 hover:text-red-500 transition"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Используем только AudioPlayer для воспроизведения -->
		<div>
			<h3 class="text-lg font-medium mb-2">Предварительное прослушивание</h3>
			<AudioPlayer :audio-url="audioStore.originalAudioUrl" />
		</div>

		<div>
			<h3 class="text-lg font-medium mb-4">Настройки улучшения</h3>
			<div class="grid md:grid-cols-2 gap-5">
				<div class="slider-wrapper">
					<label class="block mb-1 text-sm">Шумоподавление</label>
					<input
						type="range"
						min="0"
						max="100"
						v-model.number="audioStore.settings.noiseReduction"
						class="w-full"
						@input="updateSliderBackground"
						ref="noiseSlider"
					/>
					<div class="flex justify-between text-xs text-gray-400">
						<span>Мин</span>
						<span>{{ audioStore.settings.noiseReduction }}%</span>
						<span>Макс</span>
					</div>
				</div>

				<div class="slider-wrapper">
					<label class="block mb-1 text-sm">Нормализация</label>
					<input
						type="range"
						min="0"
						max="100"
						v-model.number="audioStore.settings.normalization"
						class="w-full"
						@input="updateSliderBackground"
						ref="normSlider"
					/>
					<div class="flex justify-between text-xs text-gray-400">
						<span>Мин</span>
						<span>{{ audioStore.settings.normalization }}%</span>
						<span>Макс</span>
					</div>
				</div>

				<div class="slider-wrapper">
					<label class="block mb-1 text-sm">Усиление стерео</label>
					<input
						type="range"
						min="0"
						max="100"
						v-model.number="audioStore.settings.stereoEnhance"
						class="w-full"
						@input="updateSliderBackground"
						ref="stereoSlider"
					/>
					<div class="flex justify-between text-xs text-gray-400">
						<span>Моно</span>
						<span>{{ audioStore.settings.stereoEnhance }}%</span>
						<span>Широкое стерео</span>
					</div>
				</div>

				<div>
					<label class="block mb-1 text-sm">Эквализация</label>
					<div class="flex gap-2">
						<div class="flex flex-col items-center">
							<span class="text-xs text-gray-400">Низкие</span>
							<input
								type="range"
								min="-12"
								max="12"
								v-model.number="audioStore.settings.equalizer.low"
								class="h-24"
								orient="vertical"
								@input="updateVerticalSliderBackground"
								ref="lowSlider"
							/>
							<span class="text-xs">{{ audioStore.settings.equalizer.low }}dB</span>
						</div>

						<div class="flex flex-col items-center">
							<span class="text-xs text-gray-400">Средние</span>
							<input
								type="range"
								min="-12"
								max="12"
								v-model.number="audioStore.settings.equalizer.mid"
								class="h-24"
								orient="vertical"
								@input="updateVerticalSliderBackground"
								ref="midSlider"
							/>
							<span class="text-xs">{{ audioStore.settings.equalizer.mid }}dB</span>
						</div>

						<div class="flex flex-col items-center">
							<span class="text-xs text-gray-400">Высокие</span>
							<input
								type="range"
								min="-12"
								max="12"
								v-model.number="audioStore.settings.equalizer.high"
								class="h-24"
								orient="vertical"
								@input="updateVerticalSliderBackground"
								ref="highSlider"
							/>
							<span class="text-xs">{{ audioStore.settings.equalizer.high }}dB</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="flex justify-center pt-4">
			<button
				@click="processAudio"
				class="px-8 py-3 bg-accent hover:bg-accent/80 rounded-full font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
				:disabled="audioStore.isProcessing"
			>
        <span v-if="audioStore.isProcessing">
          <svg class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
				{{ audioStore.isProcessing ? 'Обработка...' : 'Улучшить звук' }}
			</button>
		</div>

		<div v-if="audioStore.hasProcessedAudio" class="border-t border-gray-700 pt-5 mt-4">
			<h3 class="text-lg font-medium mb-4">Результат обработки</h3>
			<div class="grid md:grid-cols-2 gap-6">
				<div>
					<h4 class="text-sm font-medium mb-2">Исходный аудиофайл</h4>
					<AudioPlayer :audio-url="audioStore.originalAudioUrl" />
				</div>

				<div>
					<h4 class="text-sm font-medium mb-2">Улучшенный аудиофайл</h4>
					<AudioPlayer :audio-url="audioStore.processedAudioUrl" />
				</div>
			</div>

			<div class="flex justify-center mt-8">
				<a
					:href="audioStore.processedAudioUrl"
					download="enhanced_audio.wav"
					class="px-8 py-3 bg-secondary hover:bg-secondary/80 rounded-full font-medium transition-colors flex items-center gap-2"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
					</svg>
					Скачать обработанный файл
				</a>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useAudioStore } from '~/store/audio'
import { useAudioProcessor } from '~/composables/useAudioProcessor'
import { ref, onMounted } from 'vue'

const audioStore = useAudioStore()
const { processAudio } = useAudioProcessor()

// Рефы на ползунки для обновления их фона
const noiseSlider = ref(null)
const normSlider = ref(null)
const stereoSlider = ref(null)
const lowSlider = ref(null)
const midSlider = ref(null)
const highSlider = ref(null)

// Обновление фона для горизонтальных ползунков
const updateSliderBackground = (event) => {
	const target = event.target
	const min = target.min || 0
	const max = target.max || 100
	const value = target.value

	const percentage = ((value - min) / (max - min)) * 100
	target.style.backgroundImage = `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${percentage}%, #374151 ${percentage}%, #374151 100%)`
}

// Обновление фона для вертикальных ползунков
const updateVerticalSliderBackground = (event) => {
	const target = event.target
	const min = parseFloat(target.min) || 0
	const max = parseFloat(target.max) || 100
	const value = parseFloat(target.value)

	// У вертикальных ползунков 0 находится посередине
	const zero = 0
	const range = Math.max(Math.abs(min), Math.abs(max))
	const percentage = 50 + ((value / range) * 50)

	target.style.backgroundImage = `linear-gradient(to top, 
    ${value < 0 ? '#374151' : '#8B5CF6'} 0%, 
    ${value < 0 ? '#374151' : '#8B5CF6'} 50%, 
    ${value < 0 ? '#8B5CF6' : '#374151'} 50%, 
    ${value < 0 ? '#8B5CF6' : '#374151'} 100%)`
}

// Инициализация фонов ползунков при монтировании компонента
onMounted(() => {
	// Применяем начальные стили ко всем ползункам
	if (noiseSlider.value) updateSliderBackground({ target: noiseSlider.value })
	if (normSlider.value) updateSliderBackground({ target: normSlider.value })
	if (stereoSlider.value) updateSliderBackground({ target: stereoSlider.value })
	if (lowSlider.value) updateVerticalSliderBackground({ target: lowSlider.value })
	if (midSlider.value) updateVerticalSliderBackground({ target: midSlider.value })
	if (highSlider.value) updateVerticalSliderBackground({ target: highSlider.value })
})
</script>