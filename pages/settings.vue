<template>
	<div class="py-8 max-w-4xl mx-auto">
		<h1 class="text-3xl font-bold mb-8">Настройки</h1>

		<div class="bg-dark/50 backdrop-blur rounded-xl p-6 shadow-lg">
			<h2 class="text-xl font-semibold mb-4">Параметры по умолчанию</h2>
			<p class="text-gray-300 mb-6">
				Установите параметры обработки аудио по умолчанию, которые будут применяться при загрузке новых файлов.
			</p>

			<div class="grid md:grid-cols-2 gap-5">
				<div>
					<label class="block mb-1 text-sm">Шумоподавление</label>
					<input
						type="range"
						min="0"
						max="100"
						v-model.number="defaultSettings.noiseReduction"
						class="w-full"
					/>
					<div class="flex justify-between text-xs text-gray-400">
						<span>Мин</span>
						<span>{{ defaultSettings.noiseReduction }}%</span>
						<span>Макс</span>
					</div>
				</div>

				<div>
					<label class="block mb-1 text-sm">Нормализация</label>
					<input
						type="range"
						min="0"
						max="100"
						v-model.number="defaultSettings.normalization"
						class="w-full"
					/>
					<div class="flex justify-between text-xs text-gray-400">
						<span>Мин</span>
						<span>{{ defaultSettings.normalization }}%</span>
						<span>Макс</span>
					</div>
				</div>
			</div>

			<div class="mt-8">
				<h3 class="font-medium mb-3">Конфигурация эквалайзера</h3>
				<div class="flex gap-4 flex-wrap">
					<div class="flex flex-col items-center">
						<span class="text-xs text-gray-400">Низкие</span>
						<input
							type="range"
							min="-12"
							max="12"
							v-model.number="defaultSettings.equalizer.low"
							class="h-24"
							orient="vertical"
						/>
						<span class="text-xs">{{ defaultSettings.equalizer.low }}dB</span>
					</div>

					<div class="flex flex-col items-center">
						<span class="text-xs text-gray-400">Средние</span>
						<input
							type="range"
							min="-12"
							max="12"
							v-model.number="defaultSettings.equalizer.mid"
							class="h-24"
							orient="vertical"
						/>
						<span class="text-xs">{{ defaultSettings.equalizer.mid }}dB</span>
					</div>

					<div class="flex flex-col items-center">
						<span class="text-xs text-gray-400">Высокие</span>
						<input
							type="range"
							min="-12"
							max="12"
							v-model.number="defaultSettings.equalizer.high"
							class="h-24"
							orient="vertical"
						/>
						<span class="text-xs">{{ defaultSettings.equalizer.high }}dB</span>
					</div>
				</div>
			</div>

			<div class="flex justify-between mt-8">
				<button
					@click="resetToDefaults"
					class="px-4 py-2 border border-gray-600 rounded-lg hover:bg-dark/80 transition"
				>
					Сбросить настройки
				</button>

				<button
					@click="saveSettings"
					class="px-6 py-2 bg-primary hover:bg-primary/80 rounded-lg font-medium transition-colors"
				>
					Сохранить настройки
				</button>
			</div>
		</div>

		<div class="bg-dark/50 backdrop-blur rounded-xl p-6 shadow-lg mt-8">
			<h2 class="text-xl font-semibold mb-4">Данные приложения</h2>

			<div class="space-y-4">
				<div>
					<h3 class="font-medium mb-2">История обработки</h3>
					<div class="flex justify-between items-center">
						<p class="text-gray-300">Количество записей: {{ audioStore.processingHistory.length }}</p>
						<button
							@click="clearHistory"
							class="text-red-500 hover:text-red-400 transition text-sm"
						>
							Очистить историю
						</button>
					</div>
				</div>

				<div>
					<h3 class="font-medium mb-2">Активная сессия</h3>
					<div class="flex justify-between items-center">
						<p class="text-gray-300">Пользователь: {{ currentUser }}</p>
						<p class="text-gray-400 text-sm">{{ formattedDateTime }}</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useAudioStore, type AudioSettings } from '~/store/audio'

const audioStore = useAudioStore()
const currentUser = ref('ramazanov-ma')
const formattedDateTime = ref('2025-03-01 18:51:49')

// Настройки по умолчанию
const defaultSettings = reactive<AudioSettings>({
	noiseReduction: 50,
	normalization: 50,
	equalizer: {
		low: 0,
		mid: 0,
		high: 0
	},
	stereoEnhance: 0
})

// Загрузка сохраненных настроек
const loadSavedSettings = () => {
	try {
		const saved = localStorage.getItem('audioEnhancer_defaultSettings')
		if (saved) {
			const parsedSettings = JSON.parse(saved)
			Object.assign(defaultSettings, parsedSettings)
		}
	} catch (e) {
		console.error('Ошибка при загрузке настроек:', e)
	}
}

// Сохранение настроек
const saveSettings = () => {
	try {
		localStorage.setItem('audioEnhancer_defaultSettings', JSON.stringify(defaultSettings))
		alert('Настройки успешно сохранены')

		// Обновляем текущие настройки, если пользователь хочет их применить немедленно
		if (confirm('Применить эти настройки к текущей сессии?')) {
			audioStore.updateSettings(defaultSettings)
		}
	} catch (e) {
		console.error('Ошибка при сохранении настроек:', e)
		alert('Произошла ошибка при сохранении настроек')
	}
}

// Сброс настроек
const resetToDefaults = () => {
	if (confirm('Вы уверены, что хотите сбросить все настройки к заводским значениям?')) {
		defaultSettings.noiseReduction = 50
		defaultSettings.normalization = 50
		defaultSettings.equalizer.low = 0
		defaultSettings.equalizer.mid = 0
		defaultSettings.equalizer.high = 0
		defaultSettings.stereoEnhance = 0

		localStorage.removeItem('audioEnhancer_defaultSettings')
		alert('Настройки сброшены к значениям по умолчанию')
	}
}

// Очистка истории
const clearHistory = () => {
	if (confirm('Вы уверены, что хотите удалить всю историю обработки аудио?')) {
		audioStore.clearHistory()
		alert('История обработки очищена')
	}
}

onMounted(() => {
	loadSavedSettings()
})
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
	background: #3B82F6;
	cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
	width: 16px;
	height: 16px;
	border-radius: 50%;
	background: #3B82F6;
	cursor: pointer;
}

input[type="range"][orient="vertical"] {
	writing-mode: bt-lr;
	-webkit-appearance: slider-vertical;
	width: 8px;
	height: 100px;
}
</style>