<template>
	<div>
		<!-- Компонент не рендерит никакого UI -->
	</div>
</template>

<script setup lang="ts">
import { useAudioStore } from '~/store/audio'
import { onMounted } from 'vue'

const audioStore = useAudioStore()

onMounted(() => {
	// Инициализация приложения: загрузка сохраненных настроек, истории и т.д.
	audioStore.loadHistory()

	// Включим этот компонент в app.vue для инициализации при запуске
})
</script>