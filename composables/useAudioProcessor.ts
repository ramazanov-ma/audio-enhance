import { ref } from 'vue'
import { useAudioStore } from '~/store/audio'
// Используем проверенные профессиональные библиотеки
import WaveSurfer from 'wavesurfer.js'
import Tuna from 'tunajs'

export function useAudioProcessor() {
    const audioStore = useAudioStore()
    const isProcessing = ref(false)
    const currentUser = 'ramazanov-ma'
    const currentDateTime = '2025-03-02 03:17:43'

    /**
     * Основной метод обработки аудио с использованием
     * профессиональных библиотек обработки звука
     */
    const processAudio = async (): Promise<string | null> => {
        if (!audioStore.audioFile) {
            console.error(`[${currentDateTime}] ${currentUser}: No audio file selected`)
            return null
        }

        try {
            isProcessing.value = true
            audioStore.isProcessing = true
            console.log(`[${currentDateTime}] ${currentUser}: Starting professional audio processing`)

            // Загружаем аудиофайл для обработки
            const arrayBuffer = await audioStore.audioFile.arrayBuffer()
            const audioContext = new AudioContext()
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

            console.log(`[${currentDateTime}] ${currentUser}: Audio decoded: ${audioBuffer.numberOfChannels} channels, ${audioBuffer.sampleRate}Hz, ${audioBuffer.duration.toFixed(2)}s`)

            // Применяем профессиональную студийную обработку
            const processedBuffer = await processWithProfessionalEffects(audioBuffer, audioStore.settings, audioContext)

            // Конвертируем обработанный буфер в WAV
            const processedBlob = await convertBufferToWav(processedBuffer)
            const processedUrl = URL.createObjectURL(processedBlob)

            // Обновляем URL обработанного аудио
            audioStore.processedAudioUrl = processedUrl

            // Создаем запись в истории
            const historyItem = {
                id: Date.now().toString(),
                originalName: audioStore.audioFile.name,
                processedName: `Studio_${audioStore.audioFile.name}`,
                dateProcessed: currentDateTime,
                originalSize: audioStore.audioFile.size,
                processedSize: processedBlob.size,
                processingParams: {
                    noiseReduction: audioStore.settings.noiseReduction,
                    normalization: audioStore.settings.normalization,
                    equalizer: {
                        low: audioStore.settings.equalizer.low,
                        mid: audioStore.settings.equalizer.mid,
                        high: audioStore.settings.equalizer.high
                    },
                    stereoEnhance: audioStore.settings.stereoEnhance
                },
                advancedParams: audioStore.advancedSettings || undefined,
                url: processedUrl
            }

            audioStore.processingHistory.unshift(historyItem)

            // Сохраняем историю в локальное хранилище
            try {
                localStorage.setItem('audioProcessingHistory', JSON.stringify(audioStore.processingHistory))
            } catch (storageError) {
                console.log(`[${currentDateTime}] ${currentUser}: Failed to save processing history:`, storageError)
            }

            console.log(`[${currentDateTime}] ${currentUser}: Professional audio processing completed successfully`)

            return processedUrl
        } catch (error: any) {
            console.error(`[${currentDateTime}] ${currentUser}: Error processing audio:`, error)
            throw error
        } finally {
            isProcessing.value = false
            audioStore.isProcessing = false
        }
    }

    /**
     * Обрабатывает аудио с применением высококачественных эффектов
     * из библиотеки Tuna.js
     */
    const processWithProfessionalEffects = async (
        buffer: AudioBuffer,
        settings: any,
        context: AudioContext
    ): Promise<AudioBuffer> => {
        console.log(`[${currentDateTime}] ${currentUser}: Setting up professional effects chain with Tuna.js`)

        // Создаем офлайн-контекст для рендеринга
        const offlineCtx = new OfflineAudioContext(
            buffer.numberOfChannels,
            buffer.length,
            buffer.sampleRate
        )

        // Создаем библиотеку эффектов Tuna для нашего контекста
        const tuna = new Tuna(offlineCtx)

        // Источник аудио
        const source = offlineCtx.createBufferSource()
        source.buffer = buffer

        // === ПРОФЕССИОНАЛЬНАЯ ЦЕПОЧКА ЭФФЕКТОВ ===

        // 1. Noise Gate для удаления шума
        const noiseGate = new tuna.NoiseGate({
            threshold: -40,
            attack: 5,
            release: 50,
            gainReduction: -20
        })
        console.log(`[${currentDateTime}] ${currentUser}: Added professional Noise Gate, threshold: -40dB`)

        // 2. Эквалайзер (3-Band EQ)
        const eq = new tuna.Filter({
            frequency: 440,
            Q: 1,
            gain: 0,
            filterType: "lowshelf",
            bypass: 0
        })

        // Настройка низких частот
        eq.frequency = 250
        eq.gain = settings.equalizer.low
        console.log(`[${currentDateTime}] ${currentUser}: EQ Low band set to ${settings.equalizer.low}dB at 250Hz`)

        // 3. Эквалайзер среднечастотный
        const midEq = new tuna.Filter({
            frequency: 1700,
            Q: 1,
            gain: settings.equalizer.mid,
            filterType: "peaking",
            bypass: 0
        })
        console.log(`[${currentDateTime}] ${currentUser}: EQ Mid band set to ${settings.equalizer.mid}dB at 1.7kHz`)

        // 4. Эквалайзер высокочастотный
        const highEq = new tuna.Filter({
            frequency: 5000,
            Q: 1,
            gain: settings.equalizer.high,
            filterType: "highshelf",
            bypass: 0
        })
        console.log(`[${currentDateTime}] ${currentUser}: EQ High band set to ${settings.equalizer.high}dB at 5kHz`)

        // 5. Компрессор для сбалансированного звучания
        const compressor = new tuna.Compressor({
            threshold: -24,
            makeupGain: 1,
            attack: 5,
            release: 250,
            ratio: 4,
            knee: 5,
            automakeup: true,
            bypass: 0
        })
        console.log(`[${currentDateTime}] ${currentUser}: Added studio-grade Compressor, ratio: 4:1`)

        // 6. Enhancer (использует аналоговую эмуляцию для улучшения звучания)
        const enhancer = new tuna.Overdrive({
            outputGain: 0.2,
            drive: 0.2,
            curveAmount: 0.3,
            algorithmIndex: 0,
            bypass: 0
        })
        console.log(`[${currentDateTime}] ${currentUser}: Added enhancer for analog warmth`)

        // 7. Мультиполосное усиление для лучшей детализации
        const cabinet = new tuna.Cabinet({
            makeupGain: settings.normalization / 100,
            bypass: 0
        })
        console.log(`[${currentDateTime}] ${currentUser}: Added multiband enhancement`)

        // 8. De-esser (для вокала)
        const deEsser = new tuna.Filter({
            frequency: 7500,
            Q: 5,
            gain: -6,
            filterType: "peaking",
            bypass: settings.noiseReduction < 30 ? 1 : 0
        })
        console.log(`[${currentDateTime}] ${currentUser}: Added de-esser for vocal enhancement`)

        // 9. Финальный лимитер для предотвращения клиппинга
        const limiter = new tuna.Compressor({
            threshold: -2,
            makeupGain: 1,
            attack: 1,
            release: 100,
            ratio: 20,
            knee: 1,
            automakeup: false,
            bypass: 0
        })
        console.log(`[${currentDateTime}] ${currentUser}: Added brick-wall limiter to prevent clipping`)

        // 10. Конечное усиление для окончательной настройки громкости
        const gain = offlineCtx.createGain()
        gain.gain.value = 0.95 + (settings.normalization / 100) * 0.2
        console.log(`[${currentDateTime}] ${currentUser}: Final gain set to ${gain.gain.value}`)

        // Соединяем цепочку эффектов
        source.connect(noiseGate.input)
        noiseGate.connect(eq.input)
        eq.connect(midEq.input)
        midEq.connect(highEq.input)
        highEq.connect(compressor.input)
        compressor.connect(enhancer.input)
        enhancer.connect(cabinet.input)
        cabinet.connect(deEsser.input)
        deEsser.connect(limiter.input)
        limiter.connect(gain)
        gain.connect(offlineCtx.destination)

        // Запускаем источник
        source.start(0)
        console.log(`[${currentDateTime}] ${currentUser}: Starting offline rendering with studio-quality effects`)

        // Рендерим обработанный звук
        try {
            const renderedBuffer = await offlineCtx.startRendering()
            console.log(`[${currentDateTime}] ${currentUser}: Audio processing rendered successfully: ${renderedBuffer.duration.toFixed(2)}s`)
            return renderedBuffer
        } catch (error) {
            console.error(`[${currentDateTime}] ${currentUser}: Error during audio rendering:`, error)
            throw error
        }
    }

    /**
     * Конвертирует AudioBuffer в WAV-файл
     * используя стандартный подход без дополнительных зависимостей
     */
    const convertBufferToWav = async (audioBuffer: AudioBuffer): Promise<Blob> => {
        console.log(`[2025-03-02 03:22:25] ramazanov-ma: Converting processed audio to WAV`)

        if (!audioBuffer || typeof audioBuffer.numberOfChannels !== 'number') {
            console.error(`[2025-03-02 03:22:25] ramazanov-ma: Invalid audio buffer provided to convertBufferToWav`)
            throw new Error('Invalid audio buffer')
        }

        const numberOfChannels = audioBuffer.numberOfChannels
        const sampleRate = audioBuffer.sampleRate
        const length = audioBuffer.length

        console.log(`[2025-03-02 03:22:25] ramazanov-ma: WAV params - channels: ${numberOfChannels}, sampleRate: ${sampleRate}, samples: ${length}`)

        // Настраиваем WAV-файл
        const bytesPerSample = 2 // 16-bit
        const blockAlign = numberOfChannels * bytesPerSample
        const dataSize = length * blockAlign
        const bufferSize = 44 + dataSize // WAV header (44 bytes) + data

        const buffer = new ArrayBuffer(bufferSize)
        const view = new DataView(buffer)

        // Заполняем WAV заголовок
        // "RIFF" chunk descriptor
        writeString(view, 0, 'RIFF')
        view.setUint32(4, 36 + dataSize, true)
        writeString(view, 8, 'WAVE')

        // "fmt " sub-chunk
        writeString(view, 12, 'fmt ')
        view.setUint32(16, 16, true)
        view.setUint16(20, 1, true) // PCM формат = 1
        view.setUint16(22, numberOfChannels, true)
        view.setUint32(24, sampleRate, true)
        view.setUint32(28, sampleRate * blockAlign, true)
        view.setUint16(32, blockAlign, true)
        view.setUint16(34, 16, true) // 16 бит на семпл

        // "data" sub-chunk
        writeString(view, 36, 'data')
        view.setUint32(40, dataSize, true)

        // Заполняем данные с мягким лимитированием
        const dataIndex = 44
        let maxSample = 0

        try {
            for (let i = 0; i < length; i++) {
                for (let channel = 0; channel < numberOfChannels; channel++) {
                    const channelData = audioBuffer.getChannelData(channel)

                    // Применяем мягкое ограничение для предотвращения клиппинга
                    let sample = channelData[i]
                    if (sample > 0.98) sample = 0.98 + (sample - 0.98) * 0.1
                    else if (sample < -0.98) sample = -0.98 + (sample + 0.98) * 0.1

                    maxSample = Math.max(maxSample, Math.abs(sample))

                    // Конвертируем float [-1,1] в 16-bit PCM
                    const value = Math.floor(sample < 0 ? sample * 32768 : sample * 32767)
                    const sampleOffset = dataIndex + (i * numberOfChannels + channel) * bytesPerSample

                    if (sampleOffset + 1 < buffer.byteLength) {
                        view.setInt16(sampleOffset, value, true)
                    }
                }
            }
        } catch (error) {
            console.error(`[2025-03-02 03:22:25] ramazanov-ma: Error writing WAV data:`, error)
            throw error
        }

        console.log(`[2025-03-02 03:22:25] ramazanov-ma: WAV conversion completed, max amplitude: ${maxSample.toFixed(4)}`)

        return new Blob([buffer], { type: 'audio/wav' })
    }

    // Вспомогательная функция для записи строки в DataView
    const writeString = (view: DataView, offset: number, string: string): void => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i))
        }
    }

    return {
        processAudio,
        isProcessing
    }
}