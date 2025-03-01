import { ref } from 'vue'
import { useAudioStore } from '~/store/audio'
import { applyNoiseReduction, applyEqualizer, applyNormalization, applyStereoEnhancement,
    applyDereverberation, applyHarmonicEnhancement, applyClarity, logProcessingInfo } from '~/utils/audioProcessing'

export function useAudioProcessor() {
    const audioStore = useAudioStore()
    const isProcessing = ref(false)
    const currentUser = 'ramazanov-ma'
    const currentDateTime = '2025-03-01 20:18:43'

    // Преобразование аудиоданных в AudioBuffer
    const fileToAudioBuffer = async (file: File): Promise<AudioBuffer> => {
        const arrayBuffer = await file.arrayBuffer()
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        return await audioContext.decodeAudioData(arrayBuffer)
    }

    // Преобразование AudioBuffer в Blob
    const audioBufferToWav = (audioBuffer: AudioBuffer): Blob => {
        // Определение формата и параметров
        const numberOfChannels = audioBuffer.numberOfChannels
        const sampleRate = audioBuffer.sampleRate
        const length = audioBuffer.length

        // Вычисляем размер данных для выделения правильного буфера
        const bytesPerSample = 2 // 16-бит
        const blockAlign = numberOfChannels * bytesPerSample
        const dataSize = length * blockAlign
        const bufferSize = 44 + dataSize // 44 - размер заголовка WAV

        // Создаем буфер подходящего размера и DataView для работы с ним
        const buffer = new ArrayBuffer(bufferSize)
        const view = new DataView(buffer)

        // "RIFF" chunk descriptor
        writeString(view, 0, 'RIFF')
        view.setUint32(4, 36 + dataSize, true)
        writeString(view, 8, 'WAVE')

        // "fmt " sub-chunk
        writeString(view, 12, 'fmt ')
        view.setUint32(16, 16, true) // fmt chunk size
        view.setUint16(20, 1, true) // audio format (PCM)
        view.setUint16(22, numberOfChannels, true)
        view.setUint32(24, sampleRate, true)
        view.setUint32(28, sampleRate * blockAlign, true) // byte rate
        view.setUint16(32, blockAlign, true)
        view.setUint16(34, 16, true) // bits per sample

        // "data" sub-chunk
        writeString(view, 36, 'data')
        view.setUint32(40, dataSize, true)

        // Записываем данные аудио, используя чередование каналов
        const dataIndex = 44 // Начало аудиоданных после заголовка WAV

        // Подход с последовательной записью каждого семпла для предотвращения выхода за границы
        for (let i = 0; i < length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                const channelData = audioBuffer.getChannelData(channel)
                // Проверяем наличие данных для безопасности
                if (i < channelData.length) {
                    // Применяем мягкое ограничение для предотвращения клиппинга
                    const sample = Math.max(-1, Math.min(1, channelData[i]))

                    // Квантование до 16-бит
                    const value = Math.floor(sample < 0 ? sample * 32768 : sample * 32767)

                    // Вычисляем корректное смещение в буфере и проверяем границы
                    const sampleOffset = dataIndex + (i * numberOfChannels + channel) * bytesPerSample

                    // Проверка на выход за границы буфера
                    if (sampleOffset + 1 < buffer.byteLength) {
                        view.setInt16(sampleOffset, value, true)
                    } else {
                        console.warn(`[${currentDateTime}] ${currentUser}: Buffer overflow prevented at offset ${sampleOffset}`)
                    }
                }
            }
        }

        return new Blob([view], { type: 'audio/wav' })
    }

    // Вспомогательная функция для записи строки в DataView
    const writeString = (view: DataView, offset: number, string: string): void => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i))
        }
    }

    // Клонирование AudioBuffer для неразрушающей обработки
    const cloneAudioBuffer = async (originalBuffer: AudioBuffer): Promise<AudioBuffer> => {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)()
        const newBuffer = context.createBuffer(
            originalBuffer.numberOfChannels,
            originalBuffer.length,
            originalBuffer.sampleRate
        )

        for (let channel = 0; channel < originalBuffer.numberOfChannels; channel++) {
            const originalData = originalBuffer.getChannelData(channel)
            const newData = newBuffer.getChannelData(channel)
            newData.set(originalData)
        }

        return newBuffer
    }

    // Основной метод обработки аудио
    const processAudio = async () => {
        if (!audioStore.audioFile) {
            console.error(`[${currentDateTime}] ${currentUser}: No audio file to process`)
            return null
        }

        try {
            isProcessing.value = true
            audioStore.isProcessing = true

            console.log(`[${currentDateTime}] ${currentUser}: Starting audio processing`)

            // Получаем настройки из хранилища
            const { settings, advancedSettings } = audioStore
            const useAdvanced = advancedSettings?.useAdvancedProcessing || false

            // Шаг 1: Преобразуем файл в AudioBuffer для обработки
            const audioBuffer = await fileToAudioBuffer(audioStore.audioFile)
            console.log(`[${currentDateTime}] ${currentUser}: Audio format: ${audioBuffer.numberOfChannels} channels, ${audioBuffer.sampleRate}Hz`)

            // Шаг 2: Создаем копию данных для обработки
            let processedBuffer = await cloneAudioBuffer(audioBuffer)

            // Шаг 3: Применяем последовательную обработку аудио

            // Шаг 3.1: Шумоподавление
            if (settings.noiseReduction > 0) {
                console.log(`[${currentDateTime}] ${currentUser}: Applying intelligent noise reduction: ${settings.noiseReduction}%`)
                processedBuffer = await applyNoiseReduction(processedBuffer, settings.noiseReduction / 100, useAdvanced)
            }

            // Шаг 3.2: Удаление реверберации
            if (useAdvanced && advancedSettings?.dereverbLevel && advancedSettings.dereverbLevel > 0) {
                console.log(`[${currentDateTime}] ${currentUser}: Applying dereverberation: ${advancedSettings.dereverbLevel}%`)
                processedBuffer = await applyDereverberation(processedBuffer, advancedSettings.dereverbLevel / 100)
            }

            // Шаг 3.3: Эквализация
            console.log(`[${currentDateTime}] ${currentUser}: Applying studio-grade equalization: Low=${settings.equalizer.low}dB, Mid=${settings.equalizer.mid}dB, High=${settings.equalizer.high}dB`)
            processedBuffer = await applyEqualizer(
                processedBuffer,
                settings.equalizer.low,
                settings.equalizer.mid,
                settings.equalizer.high,
                useAdvanced
            )

            // Шаг 3.4: Улучшение чистоты звука
            if (useAdvanced && advancedSettings?.clarityLevel && advancedSettings.clarityLevel > 0) {
                console.log(`[${currentDateTime}] ${currentUser}: Enhancing clarity and definition: ${advancedSettings.clarityLevel}%`)
                processedBuffer = await applyClarity(processedBuffer, advancedSettings.clarityLevel / 100)
            }

            // Шаг 3.5: Гармоническое обогащение
            if (useAdvanced && advancedSettings?.harmonicEnhance && advancedSettings.harmonicEnhance > 0) {
                console.log(`[${currentDateTime}] ${currentUser}: Applying harmonic enhancement: ${advancedSettings.harmonicEnhance}%`)
                processedBuffer = await applyHarmonicEnhancement(processedBuffer, advancedSettings.harmonicEnhance / 100)
            }

            // Шаг 3.6: Стерео расширение
            if (settings.stereoEnhance > 0 && processedBuffer.numberOfChannels > 1) {
                console.log(`[${currentDateTime}] ${currentUser}: Applying phase-coherent stereo enhancement: ${settings.stereoEnhance}%`)
                processedBuffer = await applyStereoEnhancement(processedBuffer, settings.stereoEnhance / 100)
            }

            // Шаг 3.7: Нормализация
            if (settings.normalization > 0) {
                console.log(`[${currentDateTime}] ${currentUser}: Applying professional dynamics processing & normalization: ${settings.normalization}%`)
                processedBuffer = await applyNormalization(processedBuffer, settings.normalization / 100, useAdvanced)
            }

            // Шаг 4: Конвертация обработанного буфера обратно в Blob
            console.log(`[${currentDateTime}] ${currentUser}: Creating WAV file from processed audio buffer`)
            const processedBlob = audioBufferToWav(processedBuffer)
            const processedUrl = URL.createObjectURL(processedBlob)

            // Шаг 5: Обновляем URL обработанного аудио
            audioStore.processedAudioUrl = processedUrl

            // Шаг 6: Создаем объект для истории и добавляем в хранилище
            const historyItem = {
                id: Date.now().toString(),
                originalName: audioStore.audioFile.name,
                processedName: `Enhanced_${audioStore.audioFile.name}`,
                dateProcessed: currentDateTime,
                originalSize: audioStore.audioFile.size,
                processedSize: processedBlob.size,
                url: processedUrl
            };

            // Добавляем элемент в историю через модификацию массива
            audioStore.processingHistory.unshift(historyItem);

            // Сохраняем историю в localStorage
            try {
                localStorage.setItem('audioProcessingHistory', JSON.stringify(audioStore.processingHistory));
            } catch (storageError) {
                console.log(`[${currentDateTime}] ${currentUser}: Failed to save processing history:`, storageError);
            }

            console.log(`[${currentDateTime}] ${currentUser}: Audio processing completed successfully`)

            return processedUrl
        } catch (error) {
            console.error(`[${currentDateTime}] ${currentUser}: Audio processing error:`, error)
            throw error
        } finally {
            isProcessing.value = false
            audioStore.isProcessing = false
        }
    }

    return {
        processAudio,
        isProcessing
    }
}