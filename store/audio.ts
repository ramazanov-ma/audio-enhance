import { defineStore } from 'pinia'

export interface AudioSettings {
    noiseReduction: number
    normalization: number
    equalizer: {
        low: number
        mid: number
        high: number
    }
    stereoEnhance: number
}

// Добавим интерфейс для продвинутых настроек
export interface AdvancedSettings {
    denoiseLevel: number
    harmonicEnhance: number
    clarityLevel: number
    dereverbLevel: number
    useAdvancedProcessing: boolean
}

export interface ProcessedAudio {
    id: string
    originalName: string
    processedName: string
    dateProcessed: string
    originalSize: number
    processedSize: number
    processingParams: AudioSettings
    advancedParams?: AdvancedSettings
    url: string
}

export interface AudioState {
    audioFile: File | null
    processedAudioUrl: string | null
    originalAudioUrl: string | null
    isProcessing: boolean
    settings: AudioSettings
    advancedSettings: AdvancedSettings | null
    processingHistory: ProcessedAudio[]
    currentUser: string
    currentDateTime: string
    currentPlayingId: string | null
}

export const useAudioStore = defineStore('audio', {
    state: (): AudioState => ({
        audioFile: null,
        processedAudioUrl: null,
        originalAudioUrl: null,
        isProcessing: false,
        settings: {
            noiseReduction: 50,
            normalization: 50,
            equalizer: {
                low: 0,
                mid: 0,
                high: 0
            },
            stereoEnhance: 0
        },
        advancedSettings: null,
        processingHistory: [],
        currentUser: 'ramazanov-ma',
        currentDateTime: '2025-03-01 19:49:40',
        currentPlayingId: null
    }),

    getters: {
        hasAudioFile: (state) => !!state.audioFile,
        hasProcessedAudio: (state) => !!state.processedAudioUrl
    },

    actions: {
        setAudioFile(file: File) {
            if (this.originalAudioUrl) {
                URL.revokeObjectURL(this.originalAudioUrl)
            }
            if (this.processedAudioUrl) {
                URL.revokeObjectURL(this.processedAudioUrl)
                this.processedAudioUrl = null
            }

            this.audioFile = file
            this.originalAudioUrl = URL.createObjectURL(file)

            console.log(`[${this.currentDateTime}] ${this.currentUser}: Аудиофайл загружен: ${file.name}`)
        },

        updateSettings(settings: Partial<AudioSettings>) {
            this.settings = { ...this.settings, ...settings }
            console.log(`[${this.currentDateTime}] ${this.currentUser}: Настройки аудио обновлены`)
        },

        updateAdvancedSettings(settings: Partial<AdvancedSettings>) {
            if (!this.advancedSettings) {
                this.advancedSettings = {
                    denoiseLevel: 70,
                    harmonicEnhance: 50,
                    clarityLevel: 60,
                    dereverbLevel: 40,
                    useAdvancedProcessing: false,
                    ...settings
                }
            } else {
                this.advancedSettings = { ...this.advancedSettings, ...settings }
            }
            console.log(`[${this.currentDateTime}] ${this.currentUser}: Продвинутые настройки обновлены`)
        },

        resetAudio() {
            if (this.originalAudioUrl) {
                URL.revokeObjectURL(this.originalAudioUrl)
            }
            if (this.processedAudioUrl) {
                URL.revokeObjectURL(this.processedAudioUrl)
            }
            this.audioFile = null
            this.originalAudioUrl = null
            this.processedAudioUrl = null

            console.log(`[${this.currentDateTime}] ${this.currentUser}: Сброс аудио выполнен`)
        },

        setProcessedAudio(blob: Blob) {
            if (this.processedAudioUrl) {
                URL.revokeObjectURL(this.processedAudioUrl)
            }
            this.processedAudioUrl = URL.createObjectURL(blob)

            // Добавляем в историю обработки
            if (this.audioFile) {
                const processedName = `enhanced_${this.audioFile.name.split('.')[0]}.wav`

                this.processingHistory.unshift({
                    id: Date.now().toString(),
                    originalName: this.audioFile.name,
                    processedName: processedName,
                    dateProcessed: this.currentDateTime,
                    originalSize: this.audioFile.size,
                    processedSize: blob.size,
                    processingParams: { ...this.settings },
                    advancedParams: this.advancedSettings ? { ...this.advancedSettings } : undefined,
                    url: this.processedAudioUrl
                })

                // Сохраняем историю в localStorage
                this.saveHistory()

                console.log(`[${this.currentDateTime}] ${this.currentUser}: Обработанное аудио сохранено: ${processedName}`)
            }
        },

        saveHistory() {
            try {
                localStorage.setItem('audioEnhancer_history', JSON.stringify(this.processingHistory))
                console.log(`[${this.currentDateTime}] ${this.currentUser}: История сохранена в localStorage`)
            } catch (e) {
                console.error(`[${this.currentDateTime}] ${this.currentUser}: Ошибка при сохранении истории:`, e)
            }
        },

        loadHistory() {
            try {
                const history = localStorage.getItem('audioEnhancer_history')
                if (history) {
                    const parsedHistory = JSON.parse(history)

                    // Фиксируем ошибку типизации, явно указывая тип для item
                    this.processingHistory = parsedHistory.map((item: ProcessedAudio) => {
                        // Если URL не валиден, можно предоставить заглушку или null
                        return {
                            ...item,
                            url: item.url || null
                        }
                    })

                    console.log(`[${this.currentDateTime}] ${this.currentUser}: История загружена из localStorage, ${this.processingHistory.length} записей`)
                }
            } catch (e) {
                console.error(`[${this.currentDateTime}] ${this.currentUser}: Ошибка при загрузке истории:`, e)
            }
        },

        removeFromHistory(id: string) {
            const index = this.processingHistory.findIndex(item => item.id === id)
            if (index !== -1) {
                // Если URL существует и не используется в текущем обработанном аудио,
                // освобождаем его
                const item = this.processingHistory[index]
                if (item.url && item.url !== this.processedAudioUrl) {
                    try {
                        URL.revokeObjectURL(item.url)
                    } catch (e) {
                        console.warn(`[${this.currentDateTime}] ${this.currentUser}: Не удалось освободить URL:`, e)
                    }
                }

                this.processingHistory.splice(index, 1)
                this.saveHistory()
                console.log(`[${this.currentDateTime}] ${this.currentUser}: Элемент удален из истории: ${id}`)
            }
        },

        clearHistory() {
            // Освобождаем все URL-ы истории, кроме текущего обработанного аудио
            this.processingHistory.forEach(item => {
                if (item.url && item.url !== this.processedAudioUrl) {
                    try {
                        URL.revokeObjectURL(item.url)
                    } catch (e) {
                        console.warn(`[${this.currentDateTime}] ${this.currentUser}: Не удалось освободить URL:`, e)
                    }
                }
            })

            this.processingHistory = []
            this.saveHistory()
            console.log(`[${this.currentDateTime}] ${this.currentUser}: История обработки очищена`)
        },

        updateCurrentDateTime(dateTime: string) {
            this.currentDateTime = dateTime
        },

        // Вспомогательный метод для синхронизации настроек с другими устройствами
        syncSettings() {
            try {
                // Сохраняем настройки в localStorage
                localStorage.setItem('audioEnhancer_settings', JSON.stringify(this.settings))

                // Сохраняем продвинутые настройки, если они есть
                if (this.advancedSettings) {
                    localStorage.setItem('audioEnhancer_advancedSettings', JSON.stringify(this.advancedSettings))
                }

                console.log(`[${this.currentDateTime}] ${this.currentUser}: Настройки синхронизированы`)
            } catch (e) {
                console.error(`[${this.currentDateTime}] ${this.currentUser}: Ошибка при синхронизации настроек:`, e)
            }
        },

        // Загрузка настроек из localStorage
        loadSettings() {
            try {
                const savedSettings = localStorage.getItem('audioEnhancer_settings')
                if (savedSettings) {
                    this.settings = JSON.parse(savedSettings)
                }

                const savedAdvancedSettings = localStorage.getItem('audioEnhancer_advancedSettings')
                if (savedAdvancedSettings) {
                    this.advancedSettings = JSON.parse(savedAdvancedSettings)
                }

                console.log(`[${this.currentDateTime}] ${this.currentUser}: Настройки загружены`)
            } catch (e) {
                console.error(`[${this.currentDateTime}] ${this.currentUser}: Ошибка при загрузке настроек:`, e)
            }
        },

        // Сброс настроек к значениям по умолчанию
        resetSettings() {
            this.settings = {
                noiseReduction: 50,
                normalization: 50,
                equalizer: {
                    low: 0,
                    mid: 0,
                    high: 0
                },
                stereoEnhance: 0
            }

            this.advancedSettings = null

            // Удаляем сохраненные настройки
            localStorage.removeItem('audioEnhancer_settings')
            localStorage.removeItem('audioEnhancer_advancedSettings')

            console.log(`[${this.currentDateTime}] ${this.currentUser}: Настройки сброшены к значениям по умолчанию`)
        },

        // Метод для управления воспроизведением
        setCurrentPlaying(id: string | null) {
            this.currentPlayingId = id
            console.log(`[${this.currentDateTime}] ${this.currentUser}: Установлен аудио-плеер: ${id || 'none'}`)
        },

        // Получить текущий проигрываемый ID
        getCurrentPlayingId() {
            return this.currentPlayingId
        },

        // Проверка, проигрывается ли конкретный аудио файл
        isCurrentlyPlaying(id: string) {
            return this.currentPlayingId === id
        }
    }
})