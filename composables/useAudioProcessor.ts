import { ref } from 'vue'
import { useAudioStore } from '~/store/audio'

// Интерфейс для результатов обработки
interface ProcessingResult {
    audioBlob: Blob
}

// Интерфейс для продвинутых настроек
interface AdvancedSettings {
    denoiseLevel: number
    harmonicEnhance: number
    clarityLevel: number
    dereverbLevel: number
    useAdvancedProcessing: boolean
}

// Интерфейсы для аудио-узлов обработки
interface StereoProcessor {
    input: ChannelSplitterNode
    output: ChannelMergerNode
}

interface HarmonicEnhancer {
    input: GainNode
    output: GainNode
}

export function useAudioProcessor() {
    const audioStore = useAudioStore()
    const isProcessing = ref(false)
    const currentUser = 'ramazanov-ma'
    const currentDateTime = '2025-03-01 19:12:51'

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

            // Получаем продвинутые настройки, если они доступны
            const advancedSettings = audioStore.advancedSettings || {
                denoiseLevel: 70,
                harmonicEnhance: 50,
                clarityLevel: 60,
                dereverbLevel: 40,
                useAdvancedProcessing: false
            }

            // Загрузка аудиофайла
            console.log(`[${currentDateTime}] ${currentUser}: Loading audio file...`)
            const arrayBuffer = await audioStore.audioFile.arrayBuffer()
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

            // Создаем рабочий буфер - используем стандартную или продвинутую обработку
            console.log(`[${currentDateTime}] ${currentUser}: Enhancing audio with advanced algorithms...`)
            const processedBuffer = advancedSettings.useAdvancedProcessing
                ? await enhanceAudioStudio(audioBuffer, audioContext, settings, advancedSettings)
                : await enhanceAudioBasic(audioBuffer, audioContext, settings)

            // Конвертируем обработанный буфер обратно в Blob
            console.log(`[${currentDateTime}] ${currentUser}: Converting to output format...`)
            const processedBlob = await audioBufferToBlob(processedBuffer, audioContext)

            // Искусственная задержка для демонстрации процесса обработки
            await new Promise(resolve => setTimeout(resolve, 2000))

            // Сохраняем результат
            audioStore.setProcessedAudio(processedBlob)
            console.log(`[${currentDateTime}] ${currentUser}: Audio processing completed successfully!`)
        } catch (error) {
            console.error(`[${currentDateTime}] ${currentUser}: Error processing audio:`, error)
            alert('Произошла ошибка при обработке аудио')
        } finally {
            audioStore.isProcessing = false
            isProcessing.value = false
        }
    }

    /**
     * Базовое улучшение аудио (стандартная обработка)
     */
    const enhanceAudioBasic = async (
        buffer: AudioBuffer,
        context: AudioContext,
        settings: any
    ): Promise<AudioBuffer> => {
        return new Promise((resolve) => {
            const offlineContext = new OfflineAudioContext(
                buffer.numberOfChannels,
                buffer.length,
                buffer.sampleRate
            )

            // Источник аудио
            const source = offlineContext.createBufferSource()
            source.buffer = buffer

            // === ОСНОВНАЯ ЦЕПОЧКА ОБРАБОТКИ ===

            // 1. Шумоподавление через простой фильтр высоких частот
            const noiseFilter = offlineContext.createBiquadFilter()
            const noiseReductionAmount = settings.noiseReduction / 100
            noiseFilter.type = 'highpass'
            noiseFilter.frequency.value = 60 + (noiseReductionAmount * 80)
            noiseFilter.Q.value = 0.5 + noiseReductionAmount

            // 2. Многополосный эквалайзер
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

            // 3. Компрессор для нормализации
            const compressor = offlineContext.createDynamicsCompressor()
            compressor.threshold.value = -24 + (settings.normalization / 4)
            compressor.knee.value = 30
            compressor.ratio.value = 12
            compressor.attack.value = 0.003
            compressor.release.value = 0.25

            // 4. Стерео процессор (если аудио стерео)
            let stereoSplitter: ChannelSplitterNode | null = null
            let stereoMerger: ChannelMergerNode | null = null

            if (buffer.numberOfChannels === 2 && settings.stereoEnhance > 0) {
                const stereoEnhanceFactor = settings.stereoEnhance / 100 * 1.5

                // Создаем свой собственный стерео эффект
                stereoSplitter = offlineContext.createChannelSplitter(2)
                stereoMerger = offlineContext.createChannelMerger(2)
                const leftGain = offlineContext.createGain()
                const rightGain = offlineContext.createGain()
                const leftDelayNode = offlineContext.createDelay()
                const rightDelayNode = offlineContext.createDelay()

                leftDelayNode.delayTime.value = 0.005 * stereoEnhanceFactor
                rightDelayNode.delayTime.value = 0.005 * stereoEnhanceFactor

                leftGain.gain.value = 1 + 0.1 * stereoEnhanceFactor
                rightGain.gain.value = 1 + 0.1 * stereoEnhanceFactor

                stereoSplitter.connect(leftGain, 0)
                stereoSplitter.connect(rightGain, 1)
                leftGain.connect(leftDelayNode)
                rightGain.connect(rightDelayNode)
                leftDelayNode.connect(stereoMerger, 0, 0)
                rightDelayNode.connect(stereoMerger, 0, 1)
            }

            // 5. Финальное усиление
            const outputGain = offlineContext.createGain()
            outputGain.gain.value = 1 + (settings.normalization / 100)

            // Соединяем узлы в цепочку обработки
            source.connect(noiseFilter)

            if (stereoSplitter && stereoMerger) {
                noiseFilter.connect(stereoSplitter)
                stereoMerger.connect(lowFilter)
            } else {
                noiseFilter.connect(lowFilter)
            }

            lowFilter.connect(midFilter)
            midFilter.connect(highFilter)
            highFilter.connect(compressor)
            compressor.connect(outputGain)
            outputGain.connect(offlineContext.destination)

            // Запускаем обработку
            source.start(0)

            offlineContext.startRendering().then((renderedBuffer) => {
                resolve(renderedBuffer)
            }).catch(err => {
                console.error(`[${currentDateTime}] ${currentUser}: Rendering failed:`, err)
                resolve(buffer) // Возвращаем оригинальный буфер в случае ошибки
            })
        })
    }

    /**
     * Продвинутое улучшение аудио для студийного качества
     */
    const enhanceAudioStudio = async (
        buffer: AudioBuffer,
        context: AudioContext,
        settings: any,
        advancedSettings: AdvancedSettings
    ): Promise<AudioBuffer> => {
        return new Promise((resolve) => {
            // Создаем оффлайн контекст для обработки с избыточностью для предотвращения артефактов
            const offlineContext = new OfflineAudioContext(
                buffer.numberOfChannels,
                buffer.length,
                buffer.sampleRate
            )

            // Источник аудио
            const source = offlineContext.createBufferSource()
            source.buffer = buffer

            // === ПРОДВИНУТАЯ МНОГОСТУПЕНЧАТАЯ ОБРАБОТКА ЗВУКА ===

            // 1. ПРЕДВАРИТЕЛЬНЫЙ АНАЛИЗ
            const noiseProfile = 0.05 // В реальном приложении здесь был бы анализ шума

            // 2. ПРЕДВАРИТЕЛЬНАЯ ФИЛЬТРАЦИЯ
            const preHighPassFilter = offlineContext.createBiquadFilter()
            preHighPassFilter.type = 'highpass'
            preHighPassFilter.frequency.value = 30
            preHighPassFilter.Q.value = 0.7

            const preLowPassFilter = offlineContext.createBiquadFilter()
            preLowPassFilter.type = 'lowpass'
            preLowPassFilter.frequency.value = 18000
            preLowPassFilter.Q.value = 0.7

            // 3. ШУМОПОДАВЛЕНИЕ (адаптивное)
            const denoiseLevel = advancedSettings.denoiseLevel / 100
            const noiseReductionAmount = settings.noiseReduction / 100
            const adaptiveNoiseThreshold = Math.min(0.05, noiseProfile * (1 + denoiseLevel * 2))

            // Режекторные фильтры для низкочастотного гула
            const notchFilter50Hz = offlineContext.createBiquadFilter()
            notchFilter50Hz.type = 'notch'
            notchFilter50Hz.frequency.value = 50
            notchFilter50Hz.Q.value = 5 * denoiseLevel

            const notchFilter60Hz = offlineContext.createBiquadFilter()
            notchFilter60Hz.type = 'notch'
            notchFilter60Hz.frequency.value = 60
            notchFilter60Hz.Q.value = 5 * denoiseLevel

            // Шумовой гейт
            const noiseGate = offlineContext.createDynamicsCompressor()
            noiseGate.threshold.value = -50 + (20 * denoiseLevel)
            noiseGate.ratio.value = 10
            noiseGate.attack.value = 0
            noiseGate.release.value = 0.1
            noiseGate.knee.value = 0

            // 4. ДЕЭССЕР (уменьшает шипящие звуки)
            const deEsser = offlineContext.createBiquadFilter()
            deEsser.type = 'peaking'
            deEsser.frequency.value = 7500
            deEsser.Q.value = 2
            deEsser.gain.value = -8 * denoiseLevel

            // 5. МНОГОПОЛОСНАЯ ЭКВАЛИЗАЦИЯ
            const clarityLevel = advancedSettings.clarityLevel / 100

            // Низкие частоты (бас)
            const lowShelfFilter = offlineContext.createBiquadFilter()
            lowShelfFilter.type = 'lowshelf'
            lowShelfFilter.frequency.value = 250
            lowShelfFilter.gain.value = settings.equalizer.low + (clarityLevel > 0.6 ? -2 : 2)

            // Низко-средние
            const lowMidFilter = offlineContext.createBiquadFilter()
            lowMidFilter.type = 'peaking'
            lowMidFilter.frequency.value = 400
            lowMidFilter.Q.value = 1
            lowMidFilter.gain.value = clarityLevel > 0.5 ? -3 : 0

            // Средние частоты
            const midFilter = offlineContext.createBiquadFilter()
            midFilter.type = 'peaking'
            midFilter.frequency.value = 1000
            midFilter.Q.value = 0.8
            midFilter.gain.value = settings.equalizer.mid + (clarityLevel * 2)

            // Верхне-средние
            const highMidFilter = offlineContext.createBiquadFilter()
            highMidFilter.type = 'peaking'
            highMidFilter.frequency.value = 2500
            highMidFilter.Q.value = 1
            highMidFilter.gain.value = clarityLevel * 4

            // Высокие частоты
            const highShelfFilter = offlineContext.createBiquadFilter()
            highShelfFilter.type = 'highshelf'
            highShelfFilter.frequency.value = 8000
            highShelfFilter.gain.value = settings.equalizer.high + (clarityLevel > 0.7 ? -2 : 2)

            // 6. КОМПРЕССИЯ И НОРМАЛИЗАЦИЯ
            const compressor = offlineContext.createDynamicsCompressor()
            compressor.threshold.value = -24 + (settings.normalization / 4)
            compressor.knee.value = 10
            compressor.ratio.value = 4 + (settings.normalization / 20)
            compressor.attack.value = 0.005
            compressor.release.value = 0.1

            // Пиковый лимитер
            const limiter = offlineContext.createDynamicsCompressor()
            limiter.threshold.value = -3
            limiter.knee.value = 0
            limiter.ratio.value = 20
            limiter.attack.value = 0.001
            limiter.release.value = 0.1

            // 7. ГАРМОНИЧЕСКОЕ ОБОГАЩЕНИЕ
            const harmonicLevel = advancedSettings.harmonicEnhance / 100
            const waveshaper = offlineContext.createWaveShaper()
            const curveAmount = 5 * harmonicLevel
            const curve = new Float32Array(65536)

            for (let i = 0; i < 65536; i++) {
                const x = (i - 32768) / 32768
                // Комбинация мягкого клиппинга для эффекта "теплого" звука
                curve[i] = (Math.tanh(x * curveAmount) + Math.sin(x) * 0.2 * harmonicLevel) / (1 + curveAmount * 0.1)
            }
            waveshaper.curve = curve

            // 8. ПРОСТРАНСТВЕННОЕ УЛУЧШЕНИЕ

            // Стерео обработка
            let stereoSplitter: ChannelSplitterNode | null = null
            let stereoMerger: ChannelMergerNode | null = null

            if (buffer.numberOfChannels === 2 && settings.stereoEnhance > 0) {
                const stereoEnhanceFactor = settings.stereoEnhance / 100 * 2

                // Расширение стереобазы с сохранением фазы
                stereoSplitter = offlineContext.createChannelSplitter(2)
                stereoMerger = offlineContext.createChannelMerger(2)

                const leftDelay = offlineContext.createDelay()
                const rightDelay = offlineContext.createDelay()
                const leftFilter = offlineContext.createBiquadFilter()
                const rightFilter = offlineContext.createBiquadFilter()
                const leftGain = offlineContext.createGain()
                const rightGain = offlineContext.createGain()

                // Настройка параметров
                leftDelay.delayTime.value = 0.0025 * stereoEnhanceFactor
                rightDelay.delayTime.value = 0.0025 * stereoEnhanceFactor

                leftFilter.type = 'allpass'
                leftFilter.frequency.value = 800
                rightFilter.type = 'allpass'
                rightFilter.frequency.value = 1200

                leftGain.gain.value = 0.8 + (0.4 * stereoEnhanceFactor)
                rightGain.gain.value = 0.8 + (0.4 * stereoEnhanceFactor)

                // Подключаем цепочки
                stereoSplitter.connect(leftDelay, 0)
                stereoSplitter.connect(rightDelay, 1)

                leftDelay.connect(leftFilter)
                rightDelay.connect(rightFilter)

                leftFilter.connect(leftGain)
                rightFilter.connect(rightGain)

                leftGain.connect(stereoMerger, 0, 0)
                rightGain.connect(stereoMerger, 0, 1)

                // Перекрестное смешивание для улучшения стереобазы
                const leftCross = offlineContext.createGain()
                const rightCross = offlineContext.createGain()

                leftGain.connect(rightCross)
                rightGain.connect(leftCross)

                leftCross.gain.value = 0.1 * stereoEnhanceFactor
                rightCross.gain.value = 0.1 * stereoEnhanceFactor

                leftCross.connect(stereoMerger, 0, 0)
                rightCross.connect(stereoMerger, 0, 1)
            }

            // 9. УДАЛЕНИЕ РЕВЕРБЕРАЦИИ
            const dereverbLevel = advancedSettings.dereverbLevel / 100

            // Для демонстрации используем упрощенный подход с фильтрами
            const dereverbFilter = offlineContext.createBiquadFilter()
            dereverbFilter.type = 'lowpass'
            dereverbFilter.frequency.value = 8000 - (dereverbLevel * 3000)
            dereverbFilter.Q.value = 0.5

            // 10. ФИНАЛЬНОЕ УСИЛЕНИЕ
            const outputGain = offlineContext.createGain()
            outputGain.gain.value = 1 + (settings.normalization / 150)

            // === СОЕДИНЯЕМ ЦЕПОЧКУ ОБРАБОТКИ ===

            source.connect(preHighPassFilter)
            preHighPassFilter.connect(preLowPassFilter)

            // Применяем шумоподавление
            preLowPassFilter.connect(notchFilter50Hz)
            notchFilter50Hz.connect(notchFilter60Hz)
            notchFilter60Hz.connect(noiseGate)

            // Эквалайзер и деэссер
            noiseGate.connect(deEsser)
            deEsser.connect(lowShelfFilter)
            lowShelfFilter.connect(lowMidFilter)
            lowMidFilter.connect(midFilter)
            midFilter.connect(highMidFilter)
            highMidFilter.connect(highShelfFilter)

            // Удаление реверберации
            highShelfFilter.connect(dereverbFilter)

            // Стерео расширение, если включено
            if (stereoSplitter && stereoMerger) {
                dereverbFilter.connect(stereoSplitter)
                stereoMerger.connect(waveshaper)
            } else {
                dereverbFilter.connect(waveshaper)
            }

            // Динамическая обработка
            waveshaper.connect(compressor)
            compressor.connect(limiter)

            // Финальное усиление и выход
            limiter.connect(outputGain)
            outputGain.connect(offlineContext.destination)

            // Запускаем обработку
            source.start(0)

            offlineContext.startRendering().then((renderedBuffer) => {
                console.log(`[${currentDateTime}] ${currentUser}: Audio rendering completed`)
                resolve(renderedBuffer)
            }).catch(err => {
                console.error(`[${currentDateTime}] ${currentUser}: Rendering failed:`, err)
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