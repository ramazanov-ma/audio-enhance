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

export interface ProcessedAudio {
    id: string
    originalName: string
    processedName: string
    dateProcessed: string
    originalSize: number
    processedSize: number
    processingParams: AudioSettings
    url: string
}

export interface AudioState {
    audioFile: File | null
    processedAudioUrl: string | null
    originalAudioUrl: string | null
    isProcessing: boolean
    settings: AudioSettings
    processingHistory: ProcessedAudio[]
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
        processingHistory: []
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
        },

        updateSettings(settings: Partial<AudioSettings>) {
            this.settings = { ...this.settings, ...settings }
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
        },

        setProcessedAudio(blob: Blob) {
            if (this.processedAudioUrl) {
                URL.revokeObjectURL(this.processedAudioUrl)
            }
            this.processedAudioUrl = URL.createObjectURL(blob)

            // Добавляем в историю обработки
            if (this.audioFile) {
                const now = new Date()
                const processedName = `enhanced_${this.audioFile.name.split('.')[0]}.wav`

                this.processingHistory.unshift({
                    id: Date.now().toString(),
                    originalName: this.audioFile.name,
                    processedName: processedName,
                    dateProcessed: now.toLocaleDateString(),
                    originalSize: this.audioFile.size,
                    processedSize: blob.size,
                    processingParams: { ...this.settings },
                    url: this.processedAudioUrl
                })

                // Сохраняем историю в localStorage
                this.saveHistory()
            }
        },

        saveHistory() {
            try {
                localStorage.setItem('audioEnhancer_history', JSON.stringify(this.processingHistory))
            } catch (e) {
                console.error('Ошибка при сохранении истории:', e)
            }
        },

        loadHistory() {
            try {
                const history = localStorage.getItem('audioEnhancer_history')
                if (history) {
                    this.processingHistory = JSON.parse(history)
                }
            } catch (e) {
                console.error('Ошибка при загрузке истории:', e)
            }
        },

        removeFromHistory(id: string) {
            const index = this.processingHistory.findIndex(item => item.id === id)
            if (index !== -1) {
                this.processingHistory.splice(index, 1)
                this.saveHistory()
            }
        },

        clearHistory() {
            this.processingHistory = []
            this.saveHistory()
        }
    }
})