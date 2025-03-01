<template>
	<footer class="bg-dark p-4 border-t border-gray-800">
		<div class="container mx-auto text-center text-gray-400">
			<p>© {{ new Date().getFullYear() }} Audio Enhancer | Разработано с ❤️</p>
			<p class="text-sm mt-1">
				Версия 1.0.0 | Последнее обновление: {{ currentDate }}
			</p>
		</div>
	</footer>
</template>

<script setup lang="ts">
// Используем текущую дату из запроса
const currentDate = '2025-03-01'
</script>