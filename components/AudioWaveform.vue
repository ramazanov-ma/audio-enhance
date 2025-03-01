<template>
	<div class="h-full w-full" ref="waveformRef"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, defineExpose } from 'vue'
import WaveSurfer from 'wavesurfer.js'

const props = defineProps({
	audioUrl: {
		type: String,
		required: true
	}
})

const waveformRef = ref<HTMLElement | null>(null)
const wavesurfer = ref<WaveSurfer | null>(null)

const initWaveSurfer = () => {
	if (!waveformRef.value) return

	wavesurfer.value = WaveSurfer.create({
		container: waveformRef.value,
		waveColor: '#8B5CF6',
		progressColor: '#3B82F6',
		cursorColor: 'transparent',
		barWidth: 2,
		barRadius: 2,
		barGap: 1,
		height: 80,
		normalize: true,
		responsive: true,
		fillParent: true,
		backend: 'WebAudio'
	})

	wavesurfer.value.load(props.audioUrl)
}

// Экспортируем методы для управления из внешнего компонента
const play = () => {
	if (wavesurfer.value) {
		wavesurfer.value.play()
		return true
	}
	return false
}

const pause = () => {
	if (wavesurfer.value) {
		wavesurfer.value.pause()
	}
}

// Экспортируем wavesurfer для доступа из родительского компонента
defineExpose({
	play,
	pause,
	wavesurfer
})

onMounted(() => {
	initWaveSurfer()
})

onBeforeUnmount(() => {
	if (wavesurfer.value) {
		wavesurfer.value.destroy()
	}
})

watch(() => props.audioUrl, (newUrl) => {
	if (wavesurfer.value) {
		wavesurfer.value.destroy()
	}

	nextTick(() => {
		initWaveSurfer()
	})
}, { immediate: false })
</script>