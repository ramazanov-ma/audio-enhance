<template>
	<header class="bg-dark p-4 shadow-lg">
		<div class="container mx-auto flex justify-between items-center">
			<NuxtLink to="/" class="flex items-center gap-2">
				<div class="text-accent text-xl">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828a1 1 0 010-1.415z" clip-rule="evenodd" />
					</svg>
				</div>
				<h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
					Audio Enhancer
				</h1>
			</NuxtLink>

			<nav>
				<ul class="flex space-x-6 items-center">
					<li><NuxtLink to="/" class="text-light hover:text-primary transition">Главная</NuxtLink></li>
					<li><NuxtLink to="/settings" class="text-light hover:text-primary transition">Настройки</NuxtLink></li>
					<li><NuxtLink to="/about" class="text-light hover:text-primary transition">О проекте</NuxtLink></li>
<!--					<li>-->
<!--						<div class="text-gray-400 text-sm flex items-center gap-1 bg-dark/60 px-2 py-1 rounded-full">-->
<!--							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">-->
<!--								<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clip-rule="evenodd" />-->
<!--							</svg>-->
<!--							ramazanov-ma-->
<!--						</div>-->
<!--					</li>-->
				</ul>
			</nav>
		</div>
	</header>
</template>