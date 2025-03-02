import { ref, computed, onMounted, onUnmounted } from 'vue';
import * as tf from '@tensorflow/tfjs';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

// Интерфейс настроек процессора
interface AudioProcessorSettings {
    noiseSuppression: boolean;
    enhanceBass: boolean;
    enhanceTreble: boolean;
    normalizeVolume: boolean;
    removeEcho: boolean;
    addCompression: boolean;
    addStereoWidth: boolean;
    useAIEnhancement: boolean;
    aiEnhancementLevel: number; // от 0 до 1
}

// Состояния процессора
enum ProcessorState {
    IDLE = 'idle',
    LOADING = 'loading',
    PROCESSING = 'processing',
    READY = 'ready',
    ERROR = 'error'
}

/**
 * Хук для обработки аудио и улучшения качества до студийного уровня
 */
export function useAudioProcessor() {
    // Состояние
    const audioContext = ref<AudioContext | null>(null);
    const originalBuffer = ref<AudioBuffer | null>(null);
    const processedBuffer = ref<AudioBuffer | null>(null);
    const isModelLoaded = ref<boolean>(false);
    const processorState = ref<ProcessorState>(ProcessorState.IDLE);
    const processingProgress = ref<number>(0);
    const ffmpeg = ref<FFmpeg | null>(null);
    const errorMessage = ref<string | null>(null);

    // Настройки обработки по умолчанию
    const settings = ref<AudioProcessorSettings>({
        noiseSuppression: true,
        enhanceBass: true,
        enhanceTreble: true,
        normalizeVolume: true,
        removeEcho: false,
        addCompression: true,
        addStereoWidth: false,
        useAIEnhancement: true,
        aiEnhancementLevel: 0.7,
    });

    // Модели нейросетей
    const noiseSuppressionModel = ref<tf.LayersModel | null>(null);
    const enhancementModel = ref<tf.LayersModel | null>(null);

    // Инициализация
    onMounted(async () => {
        try {
            processorState.value = ProcessorState.LOADING;

            // Инициализация аудио контекста
            audioContext.value = new AudioContext();

            // Загрузка FFmpeg
            ffmpeg.value = new FFmpeg();
            const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.2/dist/umd';
            await ffmpeg.value.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });

            // Загрузка моделей нейросетей, если включено использование AI
            if (settings.value.useAIEnhancement) {
                await loadAIModels();
            }

            processorState.value = ProcessorState.IDLE;
        } catch (error) {
            processorState.value = ProcessorState.ERROR;
            errorMessage.value = `Ошибка инициализации: ${(error as Error).message}`;
            console.error('Ошибка инициализации аудио процессора:', error);
        }
    });

    // Освобождение ресурсов
    onUnmounted(() => {
        if (audioContext.value) {
            audioContext.value.close();
        }
    });

    /**
     * Загружает необходимые нейросетевые модели
     */
    async function loadAIModels() {
        try {
            processorState.value = ProcessorState.LOADING;

            // Загрузка модели шумоподавления
            noiseSuppressionModel.value = await tf.loadLayersModel(
                'https://example.com/noise-suppression-model/model.json'
            );

            // Загрузка модели улучшения аудио
            enhancementModel.value = await tf.loadLayersModel(
                'https://example.com/audio-enhancement-model/model.json'
            );

            isModelLoaded.value = true;

            processorState.value = ProcessorState.IDLE;
        } catch (error) {
            processorState.value = ProcessorState.ERROR;
            errorMessage.value = `Ошибка загрузки моделей: ${(error as Error).message}`;
            console.error('Ошибка загрузки AI моделей:', error);
        }
    }

    /**
     * Загружает аудиофайл для обработки
     */
    async function loadAudioFile(file: File): Promise<boolean> {
        try {
            processorState.value = ProcessorState.LOADING;
            processingProgress.value = 0;

            if (!audioContext.value) {
                audioContext.value = new AudioContext();
            }

            const arrayBuffer = await file.arrayBuffer();
            originalBuffer.value = await audioContext.value.decodeAudioData(arrayBuffer);

            processorState.value = ProcessorState.READY;
            processingProgress.value = 100;

            return true;
        } catch (error) {
            processorState.value = ProcessorState.ERROR;
            errorMessage.value = `Ошибка загрузки аудио: ${(error as Error).message}`;
            console.error('Ошибка загрузки аудиофайла:', error);
            return false;
        }
    }

    /**
     * Применяет нейросетевое шумоподавление
     */
    async function applyAINoiseSuppression(buffer: AudioBuffer): Promise<AudioBuffer> {
        if (!noiseSuppressionModel.value || !audioContext.value) {
            throw new Error('Модель шумоподавления не загружена');
        }

        // Конвертация аудиобуфера в тензор
        const audioData = buffer.getChannelData(0);
        const tensor = tf.tensor1d(audioData);

        // Применение модели шумоподавления
        const denoisedTensor = noiseSuppressionModel.value.predict(tensor.reshape([-1, 1024])) as tf.Tensor;
        const denoisedData = await denoisedTensor.reshape([audioData.length]).array() as number[];

        // Создание нового буфера с очищенными данными
        const denoisedBuffer = audioContext.value.createBuffer(
            buffer.numberOfChannels,
            buffer.length,
            buffer.sampleRate
        );

        denoisedBuffer.getChannelData(0).set(denoisedData);

        // Если есть второй канал (стерео), обрабатываем и его
        if (buffer.numberOfChannels > 1) {
            const audioData2 = buffer.getChannelData(1);
            const tensor2 = tf.tensor1d(audioData2);
            const denoisedTensor2 = noiseSuppressionModel.value.predict(tensor2.reshape([-1, 1024])) as tf.Tensor;
            const denoisedData2 = await denoisedTensor2.reshape([audioData2.length]).array() as number[];
            denoisedBuffer.getChannelData(1).set(denoisedData2);
        }

        return denoisedBuffer;
    }

    /**
     * Применяет нейросетевое улучшение аудио
     */
    async function applyAIEnhancement(buffer: AudioBuffer): Promise<AudioBuffer> {
        if (!enhancementModel.value || !audioContext.value) {
            throw new Error('Модель улучшения аудио не загружена');
        }

        // Аналогичные шаги как для шумоподавления, но с моделью улучшения
        const audioData = buffer.getChannelData(0);
        const tensor = tf.tensor1d(audioData);

        // Применение модели улучшения с учетом уровня улучшения
        const enhancedTensor = enhancementModel.value.predict(tensor.reshape([-1, 1024])) as tf.Tensor;
        const enhancedData = await enhancedTensor.reshape([audioData.length]).array() as number[];

        // Создание нового буфера с улучшенными данными
        const enhancedBuffer = audioContext.value.createBuffer(
            buffer.numberOfChannels,
            buffer.length,
            buffer.sampleRate
        );

        enhancedBuffer.getChannelData(0).set(enhancedData);

        // Обработка второго канала для стерео
        if (buffer.numberOfChannels > 1) {
            const audioData2 = buffer.getChannelData(1);
            const tensor2 = tf.tensor1d(audioData2);
            const enhancedTensor2 = enhancementModel.value.predict(tensor2.reshape([-1, 1024])) as tf.Tensor;
            const enhancedData2 = await enhancedTensor2.reshape([audioData2.length]).array() as number[];
            enhancedBuffer.getChannelData(1).set(enhancedData2);
        }

        return enhancedBuffer;
    }

    /**
     * Применяет традиционные методы обработки аудио (без нейросетей)
     */
    function applyTraditionalProcessing(buffer: AudioBuffer): AudioBuffer {
        if (!audioContext.value) {
            throw new Error('Аудио контекст не инициализирован');
        }

        // Создаем копию буфера для обработки
        const processedBuffer = audioContext.value.createBuffer(
            buffer.numberOfChannels,
            buffer.length,
            buffer.sampleRate
        );

        // Обрабатываем каждый канал
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const inputData = buffer.getChannelData(channel);
            const outputData = processedBuffer.getChannelData(channel);

            // Копируем данные
            outputData.set(new Float32Array(inputData));

            // Применяем настройки обработки
            if (settings.value.normalizeVolume) {
                normalizeChannel(outputData);
            }

            if (settings.value.enhanceBass) {
                enhanceBass(outputData, buffer.sampleRate);
            }

            if (settings.value.enhanceTreble) {
                enhanceTreble(outputData, buffer.sampleRate);
            }

            if (settings.value.addCompression) {
                applyCompression(outputData);
            }
        }

        // Если нужно увеличить стерео ширину и аудио стерео
        if (settings.value.addStereoWidth && buffer.numberOfChannels === 2) {
            enhanceStereoWidth(processedBuffer);
        }

        return processedBuffer;
    }

    /**
     * Нормализует громкость канала
     */
    function normalizeChannel(channelData: Float32Array) {
        // Находим максимальную амплитуду
        let maxAmp = 0;
        for (let i = 0; i < channelData.length; i++) {
            const absVal = Math.abs(channelData[i]);
            if (absVal > maxAmp) {
                maxAmp = absVal;
            }
        }

        // Нормализуем до 95% максимальной громкости чтобы избежать клиппинга
        const targetAmp = 0.95;
        if (maxAmp > 0) {
            const amplificationFactor = targetAmp / maxAmp;
            for (let i = 0; i < channelData.length; i++) {
                channelData[i] *= amplificationFactor;
            }
        }
    }

    /**
     * Усиливает низкие частоты
     */
    function enhanceBass(channelData: Float32Array, sampleRate: number) {
        // Простая реализация усиления низких частот
        // В реальном проекте здесь был бы низкочастотный фильтр и усиление
        const bassBoost = 1.5; // Коэффициент усиления

        // Частоты ниже ~200Hz считаются басами
        const bassFrequency = 200;
        const rc = 1.0 / (2.0 * Math.PI * bassFrequency);
        const dt = 1.0 / sampleRate;
        const alpha = dt / (rc + dt);

        let lastOutput = 0;

        // Применяем низкочастотный фильтр и усиливаем
        for (let i = 0; i < channelData.length; i++) {
            lastOutput = lastOutput + alpha * (channelData[i] - lastOutput);
            channelData[i] += lastOutput * (bassBoost - 1);
        }
    }

    /**
     * Усиливает высокие частоты
     */
    function enhanceTreble(channelData: Float32Array, sampleRate: number) {
        // Простая реализация усиления высоких частот
        const trebleBoost = 1.3;
        const trebleFrequency = 4000;
        const rc = 1.0 / (2.0 * Math.PI * trebleFrequency);
        const dt = 1.0 / sampleRate;
        const alpha = dt / (rc + dt);

        let lastOutput = 0;

        // Применяем высокочастотный фильтр и усиливаем
        for (let i = 0; i < channelData.length; i++) {
            lastOutput = alpha * (lastOutput + channelData[i] - channelData[i > 0 ? i - 1 : 0]);
            channelData[i] += lastOutput * (trebleBoost - 1);
        }
    }

    /**
     * Применяет компрессию динамического диапазона
     */
    function applyCompression(channelData: Float32Array) {
        const threshold = 0.5;
        const ratio = 4;
        const makeupGain = 1.5;

        for (let i = 0; i < channelData.length; i++) {
            const input = Math.abs(channelData[i]);
            let output = input;

            // Если сигнал выше порога, применяем компрессию
            if (input > threshold) {
                output = threshold + (input - threshold) / ratio;
            }

            // Сохраняем знак и применяем усиление
            channelData[i] = (channelData[i] > 0 ? output : -output) * makeupGain;
        }
    }

    /**
     * Усиливает стерео эффект
     */
    function enhanceStereoWidth(buffer: AudioBuffer) {
        if (buffer.numberOfChannels !== 2) return;

        const leftChannel = buffer.getChannelData(0);
        const rightChannel = buffer.getChannelData(1);
        const widthFactor = 1.5; // Коэффициент расширения стерео

        for (let i = 0; i < buffer.length; i++) {
            // Рассчитываем моно и стерео компоненты
            const mono = (leftChannel[i] + rightChannel[i]) / 2;
            const stereo = (leftChannel[i] - rightChannel[i]) / 2;

            // Усиливаем стерео компонент
            const enhancedStereo = stereo * widthFactor;

            // Применяем новые значения
            leftChannel[i] = mono + enhancedStereo;
            rightChannel[i] = mono - enhancedStereo;
        }
    }

    /**
     * Основной метод обработки аудио
     */
    async function processAudio(): Promise<boolean> {
        if (!originalBuffer.value || !audioContext.value) {
            errorMessage.value = 'Аудио файл не загружен';
            return false;
        }

        try {
            processorState.value = ProcessorState.PROCESSING;
            processingProgress.value = 0;

            // Делаем копию оригинального буфера для обработки
            let buffer = audioContext.value.createBuffer(
                originalBuffer.value.numberOfChannels,
                originalBuffer.value.length,
                originalBuffer.value.sampleRate
            );

            // Копируем данные в новый буфер
            for (let channel = 0; channel < originalBuffer.value.numberOfChannels; channel++) {
                buffer.getChannelData(channel).set(originalBuffer.value.getChannelData(channel));
            }

            processingProgress.value = 10;

            // Применяем традиционную обработку
            buffer = applyTraditionalProcessing(buffer);

            processingProgress.value = 40;

            // Если включено использование AI и модели загружены
            if (settings.value.useAIEnhancement && isModelLoaded.value) {
                // Применяем шумоподавление
                if (settings.value.noiseSuppression) {
                    buffer = await applyAINoiseSuppression(buffer);
                    processingProgress.value = 60;
                }

                // Применяем нейросетевое улучшение
                buffer = await applyAIEnhancement(buffer);
                processingProgress.value = 80;
            }

            // Сохраняем обработанный буфер
            processedBuffer.value = buffer;

            processorState.value = ProcessorState.READY;
            processingProgress.value = 100;
            return true;
        } catch (error) {
            processorState.value = ProcessorState.ERROR;
            errorMessage.value = `Ошибка обработки аудио: ${(error as Error).message}`;
            console.error('Ошибка обработки аудио:', error);
            return false;
        }
    }

    /**
     * Экспортирует обработанный аудиофайл
     */
    async function exportProcessedAudio(
        format: 'mp3' | 'wav' | 'flac' = 'wav',
        quality: 'low' | 'medium' | 'high' = 'high'
    ): Promise<Blob | null> {
        if (!processedBuffer.value || !audioContext.value || !ffmpeg.value) {
            errorMessage.value = 'Нет обработанного аудио для экспорта';
            return null;
        }

        try {
            processorState.value = ProcessorState.PROCESSING;
            processingProgress.value = 0;

            // Конвертируем AudioBuffer в WAV для дальнейшей обработки
            const wavBuffer = await audioBufferToWav(processedBuffer.value);
            processingProgress.value = 30;

            // Настройки битрейта в зависимости от выбранного качества
            let bitrateSettings = '';
            if (format === 'mp3') {
                bitrateSettings = quality === 'high' ? '-b:a 320k' :
                    quality === 'medium' ? '-b:a 192k' : '-b:a 128k';
            } else if (format === 'flac') {
                bitrateSettings = quality === 'high' ? '-compression_level 12' :
                    quality === 'medium' ? '-compression_level 8' : '-compression_level 5';
            }

            // Записываем буфер WAV во временный файл для ffmpeg
            ffmpeg.value.writeFile('input.wav', new Uint8Array(wavBuffer));
            processingProgress.value = 50;

            // Используем ffmpeg для конвертации в выбранный формат с нужным качеством
            await ffmpeg.value.exec([
                '-i', 'input.wav',
                ...bitrateSettings.split(' '),
                `output.${format}`
            ]);
            processingProgress.value = 80;

            // Получаем результат
            const outputData = await ffmpeg.value.readFile(`output.${format}`);
            processingProgress.value = 100;

            // Создаем blob с соответствующим MIME типом
            const mimeType = format === 'mp3' ? 'audio/mp3' :
                format === 'flac' ? 'audio/flac' : 'audio/wav';

            const blob = new Blob([outputData], { type: mimeType });

            processorState.value = ProcessorState.READY;
            return blob;
        } catch (error) {
            processorState.value = ProcessorState.ERROR;
            errorMessage.value = `Ошибка экспорта аудио: ${(error as Error).message}`;
            console.error('Ошибка экспорта аудио:', error);
            return null;
        }
    }

    /**
     * Конвертирует AudioBuffer в WAV формат
     */
    function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
        const numOfChannels = buffer.numberOfChannels;
        const length = buffer.length * numOfChannels * 2; // 2 байта на сэмпл
        const sampleRate = buffer.sampleRate;

        const wavDataView = new DataView(new ArrayBuffer(44 + length));

        // RIFF заголовок
        writeString(wavDataView, 0, 'RIFF');
        wavDataView.setUint32(4, 36 + length, true);
        writeString(wavDataView, 8, 'WAVE');

        // fmt подчанк
        writeString(wavDataView, 12, 'fmt ');
        wavDataView.setUint32(16, 16, true);
        wavDataView.setUint16(20, 1, true); // PCM формат
        wavDataView.setUint16(22, numOfChannels, true);
        wavDataView.setUint32(24, sampleRate, true);
        wavDataView.setUint32(28, sampleRate * numOfChannels * 2, true); // байт в секунду
        wavDataView.setUint16(32, numOfChannels * 2, true); // байт на сэмпл
        wavDataView.setUint16(34, 16, true); // битность

        // data подчанк
        writeString(wavDataView, 36, 'data');
        wavDataView.setUint32(40, length, true);

        // Заполняем данные аудио из буфера
        let offset = 44;
        for (let i = 0; i < buffer.length; i++) {
            for (let channel = 0; channel < numOfChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
                const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                wavDataView.setInt16(offset, value, true);
                offset += 2;
            }
        }

        return wavDataView.buffer;
    }

    /**
     * Записывает строку в DataView
     */
    function writeString(view: DataView, offset: number, str: string) {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
    }

    /**
     * Создает предпросмотр аудио для воспроизведения
     */
    function createAudioPreview(buffer: AudioBuffer): string {
        const offlineCtx = new OfflineAudioContext(
            buffer.numberOfChannels,
            buffer.length,
            buffer.sampleRate
        );

        const source = offlineCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(offlineCtx.destination);
        source.start();

        // Рендерим аудио и создаем URL
        return offlineCtx.startRendering().then(renderedBuffer => {
            const wavBuffer = audioBufferToWav(renderedBuffer);
            return URL.createObjectURL(new Blob([wavBuffer], { type: 'audio/wav' }));
        }).catch(err => {
            console.error('Ошибка создания предпросмотра:', err);
            return '';
        });
    }

    // Вычисляемые свойства
    const isProcessing = computed(() =>
        processorState.value === ProcessorState.PROCESSING ||
        processorState.value === ProcessorState.LOADING
    );

    const canProcess = computed(() =>
        originalBuffer.value !== null && processorState.value !== ProcessorState.PROCESSING
    );

    const canExport = computed(() =>
        processedBuffer.value !== null && processorState.value !== ProcessorState.PROCESSING
    );

    return {
        // Состояние
        processorState,
        processingProgress,
        errorMessage,
        isModelLoaded,

        // Буферы аудио
        originalBuffer,
        processedBuffer,

        // Настройки
        settings,

        // Методы
        loadAudioFile,
        processAudio,
        exportProcessedAudio,
        createAudioPreview,

        // Вычисляемые свойства
        isProcessing,
        canProcess,
        canExport
    };
}