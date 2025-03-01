<template>
	<div class="min-h-[70vh] flex items-center justify-center flex-col p-4">
		<div class="text-accent text-7xl mb-6">404</div>
		<h1 class="text-3xl font-bold mb-2">Страница не найдена</h1>
		<p class="text-gray-300 mb-8 text-center">
			К сожалению, запрашиваемая вами страница не существует.
		</p>
		<NuxtLink
			to="/"
			class="px-6 py-3 bg-accent hover:bg-accent/80 rounded-full font-medium transition-colors"
		>
			Вернуться на главную
		</NuxtLink>
	</div>
</template>