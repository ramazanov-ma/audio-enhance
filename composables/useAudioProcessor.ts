import { ref } from 'vue'
import { useAudioStore } from '~/store/audio'

// Интерфейс для результатов обработки
interface ProcessingResult {
    audioBlob: Blob
}

export function useAudioProcessor() {
    const audioStore = useAudioStore()
    const isProcessing = ref(false)

    /**
     * Основная функция обработки аудио
     */
    const processAudio = async (): Promise<void> => {
        if (!audioStore.audioFile || !audioStore.originalAudioUrl) {
            console.error('No audio file to process')
            return
        }

        try {
            audioStore.isProcessing = true
            isProcessing.value = true

            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
            const settings = audioStore.settings

            // Загрузка аудиофайла
            const arrayBuffer = await audioStore.audioFile.arrayBuffer()
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

            // Создаем рабочий буфер
            const processedBuffer = await enhanceAudio(audioBuffer, audioContext, settings)

            // Конвертируем обработанный буфер обратно в Blob
            const processedBlob = await audioBufferToBlob(processedBuffer, audioContext)

            // Сохраняем результат
            audioStore.setProcessedAudio(processedBlob)
        } catch (error) {
            console.error('Error processing audio:', error)
            alert('Произошла ошибка при обработке аудио')
        } finally {
            audioStore.isProcessing = false
            isProcessing.value = false
        }
    }

    /**
     * Применяет улучшение к аудио буферу
     */
    const enhanceAudio = async (
        buffer: AudioBuffer,
        context: AudioContext,
        settings: any
    ): Promise<AudioBuffer> => {
        return new Promise((resolve) => {
            // Создаем оффлайн контекст для обработки
            const offlineContext = new OfflineAudioContext(
                buffer.numberOfChannels,
                buffer.length,
                buffer.sampleRate
            )

            // Источник аудио
            const source = offlineContext.createBufferSource()
            source.buffer = buffer

            // === Обработка аудио на основе настроек ===

            // 1. Создаем набор фильтров
            const lowFilter = offlineContext.createBiquadFilter()
            lowFilter.type = 'lowshelf'
            lowFilter.frequency.value = 320
            lowFilter.gain.value = settings.equalizer.low

            const midFilter = offlineContext.createBiquadFilter()
            midFilter.type = 'peaking'
            midFilter.frequency.value = 1000
            midFilter.Q.value = 0.5
            midFilter.gain.value = settings.equalizer.mid

            const highFilter = offlineContext.createBiquadFilter()
            highFilter.type = 'highshelf'
            highFilter.frequency.value = 3200
            highFilter.gain.value = settings.equalizer.high

            // 2. Компрессор для нормализации
            const compressor = offlineContext.createDynamicsCompressor()
            compressor.threshold.value = -24 + (settings.normalization / 4) // Преобразуем значение от 0-100 в параметр
            compressor.knee.value = 30
            compressor.ratio.value = 12
            compressor.attack.value = 0.003
            compressor.release.value = 0.25

            // 3. Усиление (для нормализации громкости)
            const gainNode = offlineContext.createGain()
            gainNode.gain.value = 1 + (settings.normalization / 100)

            // 4. Стерео процессор (если аудио стерео)
            let stereoNode = null
            if (buffer.numberOfChannels === 2 && settings.stereoEnhance > 0) {
                const stereoEnhanceFactor = settings.stereoEnhance / 100 * 1.5

                // Создаем свой собственный стерео эффект
                const splitter = offlineContext.createChannelSplitter(2)
                const merger = offlineContext.createChannelMerger(2)
                const leftGain = offlineContext.createGain()
                const rightGain = offlineContext.createGain()
                const leftDelayNode = offlineContext.createDelay()
                const rightDelayNode = offlineContext.createDelay()

                leftDelayNode.delayTime.value = 0.005 * stereoEnhanceFactor
                rightDelayNode.delayTime.value = 0.005 * stereoEnhanceFactor

                leftGain.gain.value = 1 + 0.1 * stereoEnhanceFactor
                rightGain.gain.value = 1 + 0.1 * stereoEnhanceFactor

                splitter.connect(leftGain, 0)
                splitter.connect(rightGain, 1)
                leftGain.connect(leftDelayNode)
                rightGain.connect(rightDelayNode)
                leftDelayNode.connect(merger, 0, 0)
                rightDelayNode.connect(merger, 0, 1)

                stereoNode = {
                    splitter,
                    merger,
                    leftGain,
                    rightGain,
                    leftDelayNode,
                    rightDelayNode
                }
            }

            // 5. Шумоподавление через простой фильтр высоких частот
            const noiseFilter = offlineContext.createBiquadFilter()
            const noiseReductionAmount = settings.noiseReduction / 100
            noiseFilter.type = 'highpass'
            noiseFilter.frequency.value = 60 + (noiseReductionAmount * 80) // Значение от 60 до 140 Гц
            noiseFilter.Q.value = 0.5 + noiseReductionAmount // Увеличиваем крутизну фильтра

            // Соединяем узлы в цепочку обработки
            source.connect(noiseFilter)

            if (stereoNode) {
                noiseFilter.connect(stereoNode.splitter)
                stereoNode.merger.connect(lowFilter)
            } else {
                noiseFilter.connect(lowFilter)
            }

            lowFilter.connect(midFilter)
            midFilter.connect(highFilter)
            highFilter.connect(compressor)
            compressor.connect(gainNode)
            gainNode.connect(offlineContext.destination)

            // Запускаем обработку
            source.start(0)

            offlineContext.startRendering().then((renderedBuffer) => {
                resolve(renderedBuffer)
            }).catch(err => {
                console.error('Rendering failed:', err)
                resolve(buffer) // Возвращаем оригинальный буфер в случае ошибки
            })
        })
    }

    /**
     * Преобразует AudioBuffer в Blob
     */
    const audioBufferToBlob = async (buffer: AudioBuffer, context: AudioContext): Promise<Blob> => {
        return new Promise((resolve) => {
            // Создаем новый оффлайн контекст
            const offlineContext = new OfflineAudioContext(
                buffer.numberOfChannels,
                buffer.length,
                buffer.sampleRate
            )

            // Создаем источник из буфера
            const source = offlineContext.createBufferSource()
            source.buffer = buffer

            // Подключаем источник к выходу
            source.connect(offlineContext.destination)
            source.start(0)

            // Рендерим финальный буфер
            offlineContext.startRendering().then((renderedBuffer) => {
                // Конвертируем в WAV
                const numberOfChannels = renderedBuffer.numberOfChannels
                const length = renderedBuffer.length
                const sampleRate = renderedBuffer.sampleRate
                const wavBuffer = createWaveFileData(renderedBuffer)
                const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' })

                resolve(wavBlob)
            })
        })
    }

    /**
     * Создает WAVE файл из AudioBuffer
     */
    const createWaveFileData = (audioBuffer: AudioBuffer): ArrayBuffer => {
        const numOfChan = audioBuffer.numberOfChannels
        const length = audioBuffer.length * numOfChan * 2 + 44
        const buffer = new ArrayBuffer(length)
        const view = new DataView(buffer)

        // Записываем WAVE header
        writeUTFBytes(view, 0, 'RIFF')
        view.setUint32(4, length - 8, true)
        writeUTFBytes(view, 8, 'WAVE')
        writeUTFBytes(view, 12, 'fmt ')
        view.setUint32(16, 16, true)
        view.setUint16(20, 1, true)
        view.setUint16(22, numOfChan, true)
        view.setUint32(24, audioBuffer.sampleRate, true)
        view.setUint32(28, audioBuffer.sampleRate * numOfChan * 2, true)
        view.setUint16(32, numOfChan * 2, true)
        view.setUint16(34, 16, true)
        writeUTFBytes(view, 36, 'data')
        view.setUint32(40, length - 44, true)

        // Записываем PCM data
        const channelData = []
        let offset = 44

        // Извлекаем каналы
        for (let i = 0; i < numOfChan; i++) {
            channelData.push(audioBuffer.getChannelData(i))
        }

        // Записываем данные сэмплов в перемешанном формате
        for (let i = 0; i < audioBuffer.length; i++) {
            for (let channel = 0; channel < numOfChan; channel++) {
                const sample = Math.max(-1, Math.min(1, channelData[channel][i]))
                sample < 0 ? sample * 0x8000 : sample * 0x7FFF

                // Записываем 16-битные сэмплы
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
                offset += 2
            }
        }

        return buffer
    }

    /**
     * Вспомогательная функция для записи UTF-8 строк в ArrayBuffer
     */
    const writeUTFBytes = (view: DataView, offset: number, string: string): void => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i))
        }
    }

    return {
        processAudio,
        isProcessing
    }
}