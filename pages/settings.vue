<template>
	<div class="py-8 max-w-4xl mx-auto px-4">
		<h1 class="text-3xl font-bold mb-8">Настройки</h1>

		<div class="bg-dark/50 backdrop-blur rounded-xl p-6 shadow-lg">
			<h2 class="text-xl font-semibold mb-4">Настройки аудиообработки</h2>

			<div class="space-y-6">
				<!-- Настройки обработки по умолчанию -->
				<div>
					<h3 class="font-medium mb-4">Настройки по умолчанию</h3>
					<div class="grid md:grid-cols-2 gap-5">
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
							/>
						</div>

						<!-- Другие настройки по умолчанию -->
					</div>

					<div class="mt-4 flex gap-3 justify-end">
						<button
							@click="resetSettings"
							class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
						>
							Сбросить
						</button>

						<button
							@click="saveSettings"
							class="px-4 py-2 bg-accent hover:bg-accent/80 rounded text-sm"
						>
							Сохранить настройки
						</button>
					</div>
				</div>
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
import { useAudioStore } from '~/store/audio'
import { ref, onMounted, onUnmounted } from 'vue'

const audioStore = useAudioStore()
const currentUser = ref('ramazanov-ma')
const formattedDateTime = ref('2025-03-01 19:32:21')

// Функция для обновления фона ползунков
const updateSliderBackground = (event) => {
	const target = event.target
	if (!target) return

	const min = parseFloat(target.min) || 0
	const max = parseFloat(target.max) || 100
	const value = parseFloat(target.value)

	const percentage = ((value - min) / (max - min)) * 100
	target.style.backgroundImage = `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${percentage}%, #374151 ${percentage}%, #374151 100%)`
}

// Сохранение настроек
const saveSettings = () => {
	audioStore.syncSettings()
	alert('Настройки успешно сохранены')
}

// Сброс настроек
const resetSettings = () => {
	if (confirm('Вы уверены, что хотите сбросить все настройки к значениям по умолчанию?')) {
		audioStore.resetSettings()
	}
}

// Очистка истории
const clearHistory = () => {
	if (confirm('Вы уверены, что хотите очистить всю историю обработки?')) {
		audioStore.clearHistory()
	}
}

onMounted(() => {
	// Загружаем сохраненные настройки
	audioStore.loadSettings()

	// Функция для обновления времени каждую секунду
	const updateTime = () => {
		// Получаем компоненты даты и времени
		const parts = formattedDateTime.value.split(' ')
		const date = parts[0]
		const timeParts = parts[1].split(':')
		let hours = parseInt(timeParts[0])
		let minutes = parseInt(timeParts[1])
		let seconds = parseInt(timeParts[2]) + 1

		if (seconds >= 60) {
			seconds = 0
			minutes += 1
			if (minutes >= 60) {
				minutes = 0
				hours += 1
				if (hours >= 24) {
					hours = 0
				}
			}
		}

		const newTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
		formattedDateTime.value = `${date} ${newTime}`
	}

	// Обновляем время каждую секунду
	const interval = setInterval(updateTime, 1000)

	// Очистка интервала при размонтировании компонента
	onUnmounted(() => {
		clearInterval(interval)
	})
})
</script>

<style scoped>
/* Стилизация ползунков для консистентности с главной страницей */
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

.slider-wrapper {
	position: relative;
	padding: 8px;
	border-radius: 8px;
	background-color: rgba(31, 41, 55, 0.3);
	border: 1px solid rgba(55, 65, 81, 0.5);
}

.accent-slider {
	background: linear-gradient(to right, #8B5CF6 50%, #374151 50%);
}
</style>