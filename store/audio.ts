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
    advancedParams: AdvancedSettings | undefined
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
        currentDateTime: '2025-03-01 20:13:07',
        currentPlayingId: null
    }),

    getters: {
        hasAudioFile: (state) => !!state.audioFile,
        hasProcessedAudio: (state) => !!state.processedAudioUrl,
    },

    actions: {
        setAudioFile(file: File) {
            this.audioFile = file
            if (this.originalAudioUrl) {
                URL.revokeObjectURL(this.originalAudioUrl)
            }
            this.originalAudioUrl = URL.createObjectURL(file)
            this.processedAudioUrl = null
        },

        addToHistory(item: ProcessedAudio) {
            this.processingHistory.unshift(item)
            this.saveHistory()
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
                localStorage.setItem('audioProcessingHistory', JSON.stringify(this.processingHistory))
            } catch (error) {
                console.error(`[${this.currentDateTime}] ${this.currentUser}: Error saving history:`, error)
            }
        },

        loadHistory() {
            try {
                const history = localStorage.getItem('audioProcessingHistory')
                if (history) {
                    this.processingHistory = JSON.parse(history)
                }
            } catch (error) {
                console.error(`[${this.currentDateTime}] ${this.currentUser}: Error loading history:`, error)
            }
        },

        removeFromHistory(id: string) {
            this.processingHistory = this.processingHistory.filter(item => item.id !== id)
            this.saveHistory()
        },

        clearHistory() {
            this.processingHistory = []
            this.saveHistory()
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