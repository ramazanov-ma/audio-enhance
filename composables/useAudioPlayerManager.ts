import { ref } from 'vue'

// Используем синглтон для управления аудио плеерами
const activePlayerId = ref<string | null>(null)

// Регистрируем глобальные события для аудио
const audioEvents = new Map<string, () => void>()

export function useAudioPlayerManager() {
    // Регистрация плеера
    const registerPlayer = (playerId: string, pauseCallback: () => void) => {
        audioEvents.set(playerId, pauseCallback)

        // Возвращаем функцию для отмены регистрации при уничтожении компонента
        return () => {
            audioEvents.delete(playerId)
            if (activePlayerId.value === playerId) {
                activePlayerId.value = null
            }
        }
    }

    // Активируем конкретный плеер, останавливая все остальные
    const activatePlayer = (playerId: string) => {
        if (activePlayerId.value === playerId) return

        // Останавливаем предыдущий активный плеер
        if (activePlayerId.value && audioEvents.has(activePlayerId.value)) {
            const pauseCallback = audioEvents.get(activePlayerId.value)
            if (pauseCallback) {
                pauseCallback()
            }
        }

        // Устанавливаем новый активный плеер
        activePlayerId.value = playerId
    }

    // Получение активного плеера
    const getActivePlayer = () => activePlayerId.value

    return {
        registerPlayer,
        activatePlayer,
        getActivePlayer
    }
}