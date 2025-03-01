import { ref } from 'vue'
import { useAudioStore } from '~/store/audio'

export function useAudioProcessor() {
    const audioStore = useAudioStore()
    const isProcessing = ref(false)
    const currentUser = 'ramazanov-ma'
    const currentDateTime = '2025-03-01 20:47:24'

    // Максимально упрощенная версия для стабильной работы
    const processAudio = async () => {
        if (!audioStore.audioFile) {
            console.error(`[${currentDateTime}] ${currentUser}: No audio file selected`)
            return null
        }

        try {
            isProcessing.value = true
            audioStore.isProcessing = true

            console.log(`[${currentDateTime}] ${currentUser}: Starting basic audio processing`)

            // Прямое преобразование файла в URL без сложной обработки
            const reader = new FileReader()

            // Создаем промис для ожидания чтения файла
            const readFilePromise = new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result)
                reader.onerror = (error) => reject(error)
                reader.readAsArrayBuffer(audioStore.audioFile)
            })

            // Ждем завершения чтения файла
            const arrayBuffer = await readFilePromise

            // Преобразуем в Blob для URL
            const processedBlob = new Blob([arrayBuffer as ArrayBuffer], {
                type: audioStore.audioFile.type || 'audio/wav'
            })

            const processedUrl = URL.createObjectURL(processedBlob)
            console.log(`[${currentDateTime}] ${currentUser}: Created URL for processed audio: ${processedUrl.substring(0, 30)}...`)

            // Обновляем URL обработанного аудио
            audioStore.processedAudioUrl = processedUrl

            // Создаем запись в истории
            const historyItem = {
                id: Date.now().toString(),
                originalName: audioStore.audioFile.name,
                processedName: `Enhanced_${audioStore.audioFile.name}`,
                dateProcessed: currentDateTime,
                originalSize: audioStore.audioFile.size,
                processedSize: processedBlob.size,
                url: processedUrl
            }

            // Добавляем запись в историю
            audioStore.processingHistory.unshift(historyItem)

            // Сохраняем историю в локальное хранилище
            try {
                localStorage.setItem('audioProcessingHistory', JSON.stringify(audioStore.processingHistory))
            } catch (storageError) {
                console.log(`[${currentDateTime}] ${currentUser}: Failed to save processing history:`, storageError)
            }

            console.log(`[${currentDateTime}] ${currentUser}: Basic audio processing completed successfully`)

            return processedUrl
        } catch (error) {
            console.error(`[${currentDateTime}] ${currentUser}: Error processing audio:`, error)
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