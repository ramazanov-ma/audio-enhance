<template>
	<div class="py-8 max-w-4xl mx-auto">
		<div class="text-center mb-12">
			<h1 class="text-4xl font-bold mb-4">О проекте</h1>
			<div class="w-20 h-1 bg-accent mx-auto mb-4"></div>
			<p class="text-xl text-gray-300">
				Улучшите качество ваших аудиозаписей с помощью современных технологий
			</p>
		</div>

		<div class="space-y-10">
			<!-- О приложении -->
			<section class="bg-dark/50 backdrop-blur rounded-xl p-6 shadow-lg">
				<h2 class="text-2xl font-bold mb-4 text-primary">Audio Enhancer</h2>
				<p class="text-gray-300 mb-4">
					Audio Enhancer — это мощное веб-приложение, разработанное для улучшения качества
					аудиофайлов непосредственно в браузере. Наше приложение предлагает простой и интуитивно
					понятный интерфейс, который позволяет пользователям быстро загружать, настраивать
					и улучшать качество своих аудиофайлов без необходимости установки специального программного обеспечения.
				</p>
				<p class="text-gray-300">
					Независимо от того, являетесь ли вы профессиональным звукорежиссером, подкастером,
					музыкантом или просто хотите улучшить качество старых аудиозаписей, Audio Enhancer
					предоставляет набор инструментов, которые помогут вам достичь желаемых результатов за считанные секунды.
				</p>
			</section>

			<!-- Функции -->
			<section class="bg-dark/50 backdrop-blur rounded-xl p-6 shadow-lg">
				<h2 class="text-2xl font-bold mb-4 text-primary">Основные функции</h2>
				<div class="grid md:grid-cols-2 gap-6">
					<div class="flex items-start gap-3">
						<div class="text-accent mt-1">
							<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<div>
							<h3 class="font-semibold text-lg mb-1">Шумоподавление</h3>
							<p class="text-gray-400">Удаляет фоновый шум и ненужные звуки из аудиозаписей</p>
						</div>
					</div>

					<div class="flex items-start gap-3">
						<div class="text-accent mt-1">
							<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<div>
							<h3 class="font-semibold text-lg mb-1">Нормализация уровня</h3>
							<p class="text-gray-400">Приведение уровня громкости к оптимальным значениям</p>
						</div>
					</div>

					<div class="flex items-start gap-3">
						<div class="text-accent mt-1">
							<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<div>
							<h3 class="font-semibold text-lg mb-1">Эквалайзер</h3>
							<p class="text-gray-400">Настройка баланса низких, средних и высоких частот</p>
						</div>
					</div>

					<div class="flex items-start gap-3">
						<div class="text-accent mt-1">
							<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<div>
							<h3 class="font-semibold text-lg mb-1">Расширение стерео</h3>
							<p class="text-gray-400">Улучшение пространственного звучания стерео-записей</p>
						</div>
					</div>

					<div class="flex items-start gap-3">
						<div class="text-accent mt-1">
							<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<div>
							<h3 class="font-semibold text-lg mb-1">Визуализация аудио</h3>
							<p class="text-gray-400">Отображение волновой формы аудио для наглядного анализа</p>
						</div>
					</div>

					<div class="flex items-start gap-3">
						<div class="text-accent mt-1">
							<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<div>
							<h3 class="font-semibold text-lg mb-1">Мгновенное сравнение</h3>
							<p class="text-gray-400">Прослушивание и сравнение оригинала с обработанной версией</p>
						</div>
					</div>
				</div>
			</section>

			<!-- Технологии -->
			<section class="bg-dark/50 backdrop-blur rounded-xl p-6 shadow-lg">
				<h2 class="text-2xl font-bold mb-4 text-primary">Используемые технологии</h2>
				<div class="grid md:grid-cols-3 gap-4">
					<div class="bg-dark p-4 rounded-lg text-center">
						<img src="https://nuxt.com/assets/design-kit/icon-green.svg" alt="Nuxt.js" class="w-12 h-12 mx-auto mb-2">
						<h3 class="font-medium">Nuxt 3</h3>
					</div>
					<div class="bg-dark p-4 rounded-lg text-center">
						<img src="https://upload.wikimedia.org/wikipedia/commons/9/95/Vue.js_Logo_2.svg" alt="Vue.js" class="w-12 h-12 mx-auto mb-2">
						<h3 class="font-medium">Vue 3</h3>
					</div>
					<div class="bg-dark p-4 rounded-lg text-center">
						<img src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Tailwind_CSS_Logo.svg" alt="Tailwind CSS" class="w-12 h-12 mx-auto mb-2">
						<h3 class="font-medium">Tailwind CSS</h3>
					</div>
					<div class="bg-dark p-4 rounded-lg text-center">
						<img src="https://pinia.vuejs.org/logo.svg" alt="Pinia" class="w-12 h-12 mx-auto mb-2">
						<h3 class="font-medium">Pinia</h3>
					</div>
					<div class="bg-dark p-4 rounded-lg text-center">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
						</svg>
						<h3 class="font-medium">Web Audio API</h3>
					</div>
					<div class="bg-dark p-4 rounded-lg text-center">
						<img src="https://wavesurfer-js.org/assets/img/wavesurfer-logo.svg" alt="WaveSurfer.js" class="w-12 h-12 mx-auto mb-2">
						<h3 class="font-medium">WaveSurfer.js</h3>
					</div>
				</div>
			</section>

			<!-- FAQ -->
			<section class="bg-dark/50 backdrop-blur rounded-xl p-6 shadow-lg">
				<h2 class="text-2xl font-bold mb-4 text-primary">Часто задаваемые вопросы</h2>

				<div class="space-y-4">
					<div class="border border-gray-700 rounded-lg overflow-hidden">
						<div class="p-4 cursor-pointer bg-dark/50 hover:bg-dark/70">
							<h3 class="font-semibold text-lg">Какие форматы аудио поддерживаются?</h3>
						</div>
						<div class="p-4 bg-dark/20 text-gray-300">
							<p>Audio Enhancer поддерживает все основные аудиоформаты, включая MP3, WAV, OGG, AAC, FLAC и M4A.</p>
						</div>
					</div>

					<div class="border border-gray-700 rounded-lg overflow-hidden">
						<div class="p-4 cursor-pointer bg-dark/50 hover:bg-dark/70">
							<h3 class="font-semibold text-lg">Куда сохраняются обработанные файлы?</h3>
						</div>
						<div class="p-4 bg-dark/20 text-gray-300">
							<p>Обработанные файлы сохраняются локально на вашем устройстве. Мы не храним ваши аудиофайлы на серверах.</p>
						</div>
					</div>

					<div class="border border-gray-700 rounded-lg overflow-hidden">
						<div class="p-4 cursor-pointer bg-dark/50 hover:bg-dark/70">
							<h3 class="font-semibold text-lg">Могу ли я использовать приложение на мобильном устройстве?</h3>
						</div>
						<div class="p-4 bg-dark/20 text-gray-300">
							<p>Да, Audio Enhancer полностью адаптивен и работает на любом устройстве с современным веб-браузером.</p>
						</div>
					</div>
				</div>
			</section>

			<!-- Разработчик -->
			<section class="bg-dark/50 backdrop-blur rounded-xl p-6 shadow-lg">
				<h2 class="text-2xl font-bold mb-4 text-primary">О разработчике</h2>
				<div class="flex flex-col md:flex-row gap-6 items-center">
					<div class="bg-gradient-to-br from-primary/20 to-accent/20 p-1 rounded-full">
						<div class="w-32 h-32 rounded-full bg-dark/80 flex items-center justify-center text-4xl font-bold text-accent">
							RM
						</div>
					</div>
					<div>
						<h3 class="text-xl font-semibold">ramazanov-ma</h3>
						<p class="text-gray-400 mb-2">Разработчик аудио-приложений</p>
						<p class="text-gray-300 mb-4">
							Создаю инновационные веб-приложения с фокусом на обработку аудио и медиа-контента.
							Audio Enhancer — это проект, направленный на то, чтобы сделать профессиональные
							инструменты обработки звука доступными для всех.
						</p>
						<p class="text-gray-400 text-sm">Последнее обновление: 01 марта 2025 г.</p>
					</div>
				</div>
			</section>
		</div>
	</div>
</template>