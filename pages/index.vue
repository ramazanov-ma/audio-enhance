<template>
	<div class="py-8">
		<section class="mb-12 text-center">
			<h1 class="text-4xl font-bold mb-4">Улучшите качество вашего аудио</h1>
			<p class="text-xl text-gray-300 max-w-3xl mx-auto">
				Загрузите ваш аудио-файл и мгновенно улучшите его качество с помощью наших инновационных алгоритмов
			</p>
		</section>

		<div class="bg-dark/50 backdrop-blur rounded-xl shadow-xl p-6 max-w-5xl mx-auto">
			<AudioUploader v-if="!audioStore.hasAudioFile" />
			<AudioProcessor v-else />
		</div>

		<!-- Условное отображение истории только при наличии записей в истории -->
		<ProcessingHistory v-if="audioStore.processingHistory.length > 0" />

		<!-- Советы по улучшению аудио всегда видны -->
		<AudioTips />

		<!-- Информация о пользователе и сеансе -->
		<div class="mt-8 text-right text-sm text-gray-500">
			<p>Пользователь: {{ currentUser }}</p>
			<p>Текущее время (UTC): {{ formattedDateTime }}</p>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useAudioStore } from '~/store/audio'
import { onMounted, onUnmounted, ref } from 'vue'

const audioStore = useAudioStore()
// Обновленные значения для даты, времени и логина пользователя
const currentUser = ref('ramazanov-ma')
const formattedDateTime = ref('2025-03-01 18:51:49')

onMounted(() => {
	// Загрузка истории обработки из localStorage при монтировании компонента
	audioStore.loadHistory()

	// Функция для обновления времени каждую секунду
	const updateTime = () => {
		// Получаем текущие компоненты даты и времени
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