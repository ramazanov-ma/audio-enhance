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
			<AudioPlayer :audio-url="audioStore.originalAudioUrl" player-id="original-audio" />
		</div>

		<!-- Все настройки теперь располагаются на одном уровне -->
		<div>
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-lg font-medium">Настройки обработки звука</h3>
				<div class="flex items-center">
					<select v-model="currentPreset" @change="applySelectedPreset"
							class="bg-dark text-light border border-gray-700 rounded px-3 py-1 text-sm">
						<option value="">Выберите пресет...</option>
						<option v-for="preset in presets" :key="preset.name" :value="preset.name">
							{{ preset.name }}
						</option>
					</select>
				</div>
			</div>

			<div class="grid md:grid-cols-2 gap-5">
				<!-- Основные настройки -->
				<div class="slider-wrapper">
					<label class="block mb-1 flex justify-between">
						<span class="text-sm">Шумоподавление</span>
						<span class="text-xs text-accent">{{ audioStore.settings.noiseReduction }}%</span>
					</label>
					<input
						type="range"
						min="0"
						max="100"
						v-model.number="audioStore.settings.noiseReduction"
						class="w-full accent-slider"
						@input="updateSliderBackground"
						ref="noiseSlider"
					/>
					<div class="flex justify-between text-xs text-gray-400">
						<span>Минимум</span>
						<span>Максимум</span>
					</div>
				</div>

				<div class="slider-wrapper">
					<label class="block mb-1 flex justify-between">
						<span class="text-sm">Удаление гула и реверберации</span>
						<span class="text-xs text-accent">{{ advancedSettings.dereverbLevel }}%</span>
					</label>
					<input
						type="range"
						min="0"
						max="100"
						v-model.number="advancedSettings.dereverbLevel"
						class="w-full accent-slider"
						@input="updateSliderBackground"
						ref="dereverbSlider"
					/>
					<div class="flex justify-between text-xs text-gray-400">
						<span>Минимум</span>
						<span>Максимум</span>
					</div>
				</div>

				<div class="slider-wrapper">
					<label class="block mb-1 flex justify-between">
						<span class="text-sm">Нормализация и плотность звука</span>
						<span class="text-xs text-accent">{{ audioStore.settings.normalization }}%</span>
					</label>
					<input
						type="range"
						min="0"
						max="100"
						v-model.number="audioStore.settings.normalization"
						class="w-full accent-slider"
						@input="updateSliderBackground"
						ref="normSlider"
					/>
					<div class="flex justify-between text-xs text-gray-400">
						<span>Естественно</span>
						<span>Профессионально</span>
					</div>
				</div>

				<div class="slider-wrapper">
					<label class="block mb-1 flex justify-between">
						<span class="text-sm">Чистота и разборчивость</span>
						<span class="text-xs text-accent">{{ advancedSettings.clarityLevel }}%</span>
					</label>
					<input
						type="range"
						min="0"
						max="100"
						v-model.number="advancedSettings.clarityLevel"
						class="w-full accent-slider"
						@input="updateSliderBackground"
						ref="claritySlider"
					/>
					<div class="flex justify-between text-xs text-gray-400">
						<span>Минимум</span>
						<span>Максимум</span>
					</div>
				</div>

				<div class="slider-wrapper">
					<label class="block mb-1 flex justify-between">
						<span class="text-sm">Расширение стереобазы</span>
						<span class="text-xs text-accent">{{ audioStore.settings.stereoEnhance }}%</span>
					</label>
					<input
						type="range"
						min="0"
						max="100"
						v-model.number="audioStore.settings.stereoEnhance"
						class="w-full accent-slider"
						@input="updateSliderBackground"
						ref="stereoSlider"
					/>
					<div class="flex justify-between text-xs text-gray-400">
						<span>Моно</span>
						<span>Широкое стерео</span>
					</div>
				</div>

				<div class="slider-wrapper">
					<label class="block mb-1 flex justify-between">
						<span class="text-sm">Обогащение гармоник</span>
						<span class="text-xs text-accent">{{ advancedSettings.harmonicEnhance }}%</span>
					</label>
					<input
						type="range"
						min="0"
						max="100"
						v-model.number="advancedSettings.harmonicEnhance"
						class="w-full accent-slider"
						@input="updateSliderBackground"
						ref="harmonicSlider"
					/>
					<div class="flex justify-between text-xs text-gray-400">
						<span>Минимум</span>
						<span>Максимум</span>
					</div>
				</div>

				<!-- Эквалайзер -->
				<div class="md:col-span-2">
					<label class="block mb-2 text-sm">Многополосная эквализация</label>
					<div class="flex gap-6 justify-center">
						<div class="flex flex-col items-center">
							<span class="text-xs text-gray-300">Низкие</span>
							<input
								type="range"
								min="-12"
								max="12"
								v-model.number="audioStore.settings.equalizer.low"
								class="h-24 accent-vertical-slider"
								orient="vertical"
								@input="updateVerticalSliderBackground"
								ref="lowSlider"
							/>
							<span class="text-xs">{{ audioStore.settings.equalizer.low }}dB</span>
						</div>

						<div class="flex flex-col items-center">
							<span class="text-xs text-gray-300">Средние</span>
							<input
								type="range"
								min="-12"
								max="12"
								v-model.number="audioStore.settings.equalizer.mid"
								class="h-24 accent-vertical-slider"
								orient="vertical"
								@input="updateVerticalSliderBackground"
								ref="midSlider"
							/>
							<span class="text-xs">{{ audioStore.settings.equalizer.mid }}dB</span>
						</div>

						<div class="flex flex-col items-center">
							<span class="text-xs text-gray-300">Высокие</span>
							<input
								type="range"
								min="-12"
								max="12"
								v-model.number="audioStore.settings.equalizer.high"
								class="h-24 accent-vertical-slider"
								orient="vertical"
								@input="updateVerticalSliderBackground"
								ref="highSlider"
							/>
							<span class="text-xs">{{ audioStore.settings.equalizer.high }}dB</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Опция AI студийного качества -->
			<div class="mt-5 pt-4 border-t border-gray-700">
				<div class="flex items-center">
					<input
						type="checkbox"
						id="advanced-processing"
						v-model="useAdvancedProcessing"
						class="mr-2 h-4 w-4 accent-accent"
					>
					<label for="advanced-processing" class="text-accent font-medium">
						Использовать расширенную AI-обработку для студийного качества
					</label>
				</div>
				<p class="text-sm text-gray-400 mt-1 ml-6">
					Включает продвинутые алгоритмы нейронной обработки для максимального улучшения качества звука
				</p>
			</div>
		</div>

		<div class="flex justify-center pt-4">
			<button
				@click="processAudioWithStatus"
				class="px-8 py-3 bg-accent hover:bg-accent/80 rounded-full font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
				:disabled="audioStore.isProcessing"
			>
        <span v-if="audioStore.isProcessing" class="flex items-center">
          <svg class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ processingStatus }}
        </span>
				<span v-else>Улучшить звук</span>
			</button>
		</div>

		<!-- Технические параметры аудио -->
		<div class="text-xs text-gray-500 text-center" v-if="audioStore.audioFile">
			<p>Формат: {{ audioFormat }} | Размер: {{ formatFileSize(audioStore.audioFile.size) }} | {{ currentDateText }}</p>
		</div>

		<div v-if="audioStore.hasProcessedAudio" class="border-t border-gray-700 pt-5 mt-4">
			<h3 class="text-lg font-medium mb-4">Результат обработки</h3>
			<div class="grid md:grid-cols-2 gap-6">
				<div>
					<h4 class="text-sm font-medium mb-2">Исходный аудиофайл</h4>
					<AudioPlayer :audio-url="audioStore.originalAudioUrl" player-id="result-original" />
				</div>

				<div>
					<h4 class="text-sm font-medium mb-2">Улучшенный аудиофайл</h4>
					<AudioPlayer :audio-url="audioStore.processedAudioUrl" player-id="result-processed" />
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
import { ref, reactive, computed, onMounted, watch, onUnmounted, nextTick } from 'vue';
import { useAudioProcessor } from '~/composables/useAudioProcessor';
import { useAudioStore } from '~/store/audio';

const audioStore = useAudioStore();
const { loadAudio, originalProcessAudio, originalBuffer, processorState, processingProgress } = useAudioProcessor();

const currentDateText = ref('2025-03-01 19:25:48');
const currentUser = ref('ramazanov-ma');

// Status information for processing
const processingStatus = ref('Обработка...');
const processingSteps = [
	'Анализ звука...',
	'Подавление шума...',
	'Применение эквализации...',
	'Улучшение качества...',
	'Финальная обработка...'
];
let processingInterval: ReturnType<typeof setInterval> | null = null;

// Compute audio format and file size information
const audioFormat = computed(() => {
	if (!audioStore.audioFile) return '';
	const type = audioStore.audioFile.type;
	if (type === 'audio/mpeg' || type === 'audio/mp3') return 'MP3';
	if (type === 'audio/wav' || type === 'audio/x-wav') return 'WAV';
	if (type === 'audio/ogg') return 'OGG';
	if (type === 'audio/aac') return 'AAC';
	if (type === 'audio/flac') return 'FLAC';
	if (type === 'audio/m4a') return 'M4A';
	return type.split('/')[1]?.toUpperCase() || 'AUDIO';
});

const formatFileSize = (bytes: number): string => {
	if (bytes < 1024) return bytes + ' bytes';
	else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
	else return (bytes / 1048576).toFixed(1) + ' MB';
};

// Reference elements for sliders (if needed for dynamic style updates)
const noiseSlider = ref(null);
const normSlider = ref(null);
const stereoSlider = ref(null);
const dereverbSlider = ref(null);
const lowSlider = ref(null);
const midSlider = ref(null);
const highSlider = ref(null);
const harmonicSlider = ref(null);
const claritySlider = ref(null);

// Advanced processing settings (controlled via a checkbox)
const useAdvancedProcessing = ref(true);
const advancedSettings = reactive({
	denoiseLevel: 70,
	harmonicEnhance: 50,
	clarityLevel: 60,
	dereverbLevel: 40
});

// Presets for quick configuration
const presets = [
	{
		name: 'Студийное качество',
		settings: {
			denoiseLevel: 75,
			harmonicEnhance: 70,
			clarityLevel: 65,
			dereverbLevel: 60,
			eqSettings: { low: 2, mid: 3, high: 1 },
			noiseReduction: 60,
			normalization: 80,
			stereoEnhance: 60
		}
	},
	// Additional presets omitted for brevity…
];

const currentPreset = ref('');

// Apply a selected preset to update settings
const applyPreset = (preset: any) => {
	advancedSettings.denoiseLevel = preset.settings.denoiseLevel;
	advancedSettings.harmonicEnhance = preset.settings.harmonicEnhance;
	advancedSettings.clarityLevel = preset.settings.clarityLevel;
	advancedSettings.dereverbLevel = preset.settings.dereverbLevel;

	audioStore.updateSettings({
		equalizer: preset.settings.eqSettings,
		noiseReduction: preset.settings.noiseReduction,
		normalization: preset.settings.normalization,
		stereoEnhance: preset.settings.stereoEnhance
	});

	currentPreset.value = preset.name;
	nextTick(updateAllSliders);
};

// Called when a preset is selected from the dropdown
const applySelectedPreset = () => {
	if (!currentPreset.value) return;
	const preset = presets.find(p => p.name === currentPreset.value);
	if (preset) applyPreset(preset);
};

// Update slider backgrounds based on their value (for horizontal sliders)
const updateSliderBackground = (event: any) => {
	const target = event.target;
	if (!target) return;
	const min = parseFloat(target.min) || 0;
	const max = parseFloat(target.max) || 100;
	const value = parseFloat(target.value);
	const percentage = ((value - min) / (max - min)) * 100;
	target.style.backgroundImage = `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${percentage}%, #374151 ${percentage}%, #374151 100%)`;
};

// For vertical sliders (e.g. the equalizer)
const updateVerticalSliderBackground = (event: any) => {
	const target = event.target;
	if (!target) return;
	const min = parseFloat(target.min) || -12;
	const max = parseFloat(target.max) || 12;
	const value = parseFloat(target.value);
	let percentage = value >= 0 ? 50 + (value / max) * 50 : 50 + (value / Math.abs(min)) * 50;
	target.style.backgroundImage = `linear-gradient(to top, ${value < 0 ? '#374151' : '#8B5CF6'} 0%, ${value < 0 ? '#374151' : '#8B5CF6'} 50%, ${value < 0 ? '#8B5CF6' : '#374151'} 50%, ${value < 0 ? '#8B5CF6' : '#374151'} 100%)`;
};

const updateAllSliders = () => {
	if (noiseSlider.value) updateSliderBackground({ target: noiseSlider.value });
	if (normSlider.value) updateSliderBackground({ target: normSlider.value });
	if (stereoSlider.value) updateSliderBackground({ target: stereoSlider.value });
	if (dereverbSlider.value) updateSliderBackground({ target: dereverbSlider.value });
	if (harmonicSlider.value) updateSliderBackground({ target: harmonicSlider.value });
	if (claritySlider.value) updateSliderBackground({ target: claritySlider.value });
	if (lowSlider.value) updateVerticalSliderBackground({ target: lowSlider.value });
	if (midSlider.value) updateVerticalSliderBackground({ target: midSlider.value });
	if (highSlider.value) updateVerticalSliderBackground({ target: highSlider.value });
};

// Function to process the audio with status animation
const processAudioWithStatus = async () => {
	console.log("Starting processing animation...");
	let stepIndex = 0;
	processingStatus.value = processingSteps[0];
	processingInterval = setInterval(() => {
		stepIndex = (stepIndex + 1) % processingSteps.length;
		processingStatus.value = processingSteps[stepIndex];
	}, 1000);

	try {
		if (!originalBuffer.value) {
			throw new Error('No audio buffer available for processing.');
		}
		console.log("Starting audio processing...");
		await originalProcessAudio(originalBuffer.value);
		console.log("Audio processing completed.");
	} catch (error: any) {
		console.error(`Error during processing: ${error.message}`);
		processingStatus.value = `Ошибка: ${error.message}`;
	} finally {
		if (processingInterval) {
			clearInterval(processingInterval);
			processingInterval = null;
		}
		processingStatus.value = 'Обработка завершена';
	}
};

// Clock update example (updates the current time string)
const updateClock = () => {
	const parts = currentDateText.value.split(' ');
	const date = parts[0];
	const timeParts = parts[1].split(':').map(Number);
	timeParts[2]++;
	if (timeParts[2] >= 60) {
		timeParts[2] = 0;
		timeParts[1]++;
		if (timeParts[1] >= 60) {
			timeParts[1] = 0;
			timeParts[0]++;
			if (timeParts[0] >= 24) timeParts[0] = 0;
		}
	}
	const newTime = timeParts.map(num => num.toString().padStart(2, '0')).join(':');
	currentDateText.value = `${date} ${newTime}`;
};

onMounted(() => {
	// Set initial date/time and user in the store
	audioStore.currentDateTime = currentDateText.value;
	audioStore.currentUser = currentUser.value;

	// Use advanced settings from the store if available
	if (audioStore.advancedSettings) {
		useAdvancedProcessing.value = audioStore.advancedSettings.useAdvancedProcessing;
		advancedSettings.denoiseLevel = audioStore.advancedSettings.denoiseLevel;
		advancedSettings.harmonicEnhance = audioStore.advancedSettings.harmonicEnhance;
		advancedSettings.clarityLevel = audioStore.advancedSettings.clarityLevel;
		advancedSettings.dereverbLevel = audioStore.advancedSettings.dereverbLevel;
	} else {
		audioStore.updateAdvancedSettings({
			...advancedSettings,
			useAdvancedProcessing: useAdvancedProcessing.value
		});
	}
	nextTick(updateAllSliders);
	const clockInterval = setInterval(updateClock, 1000);
	onUnmounted(() => {
		clearInterval(clockInterval);
		if (processingInterval) clearInterval(processingInterval);
	});
});

// Watch for settings changes and update sliders
watch([() => audioStore.settings, () => advancedSettings, useAdvancedProcessing], () => {
	nextTick(updateAllSliders);
}, { deep: true });

watch(useAdvancedProcessing, newValue => {
	audioStore.updateAdvancedSettings({
		...advancedSettings,
		useAdvancedProcessing: newValue
	});
});

watch(advancedSettings, newValue => {
	audioStore.updateAdvancedSettings({
		...newValue,
		useAdvancedProcessing: useAdvancedProcessing.value
	});
}, { deep: true });

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
	border: 2px solid #1F2937;
	box-shadow: 0 0 5px rgba(139, 92, 246, 0.3);
}

input[type="range"]::-moz-range-thumb {
	width: 16px;
	height: 16px;
	border-radius: 50%;
	background: #8B5CF6;
	cursor: pointer;
	border: 2px solid #1F2937;
	box-shadow: 0 0 5px rgba(139, 92, 246, 0.3);
}

input[type="range"][orient="vertical"] {
	writing-mode: bt-lr;
	width: 8px;
	height: 100px;
}

input[type="checkbox"] {
	accent-color: #8B5CF6;
}

.slider-wrapper {
	position: relative;
	padding: 8px;
	border-radius: 8px;
	background-color: rgba(31, 41, 55, 0.3);
	border: 1px solid rgba(55, 65, 81, 0.5);
}

/* Анимация для обработки */
@keyframes pulse {
	0% { opacity: 1; }
	50% { opacity: 0.5; }
	100% { opacity: 1; }
}

.processing-animation {
	animation: pulse 1.5s infinite;
}

/* Подсветка активных пресетов */
.preset-active {
	background-color: #8B5CF6;
	color: white;
}

/* Стилизация выпадающего списка */
select {
	background-color: #1F2937;
	color: #F9FAFB;
	border: 1px solid #4B5563;
	border-radius: 4px;
	padding: 0.5rem;
	appearance: none;
	background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23A78BFA' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
	background-position: right 0.5rem center;
	background-repeat: no-repeat;
	background-size: 1.5em 1.5em;
	padding-right: 2.5rem;
	cursor: pointer;
}

select:focus {
	outline: 2px solid #8B5CF6;
	outline-offset: 2px;
}

/* Единый стиль для всех ползунков */
.accent-slider {
	background: linear-gradient(to right, #8B5CF6 50%, #374151 50%);
}

.accent-vertical-slider {
	background: linear-gradient(to top, #374151 50%, #8B5CF6 50%);
}

/* Стили для улучшения доступности */
button:focus, a:focus, input:focus {
	outline: 2px solid #8B5CF6;
	outline-offset: 2px;
}

/* Эффекты наведения */
.slider-wrapper:hover {
	border-color: rgba(139, 92, 246, 0.5);
	box-shadow: 0 0 5px rgba(139, 92, 246, 0.2);
}

/* Стилизация контейнера с результатами */
.result-container {
	background-color: rgba(31, 41, 55, 0.5);
	border-radius: 12px;
	border: 1px solid rgba(55, 65, 81, 0.7);
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
	transition: all 0.3s ease;
}

.result-container:hover {
	border-color: rgba(139, 92, 246, 0.3);
}
</style>