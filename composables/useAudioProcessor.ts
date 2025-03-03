import { ref, onMounted, onUnmounted } from 'vue';
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
            console.log("Initializing audio processor...");

            // Инициализация аудио контекста
            audioContext.value = new AudioContext();
            console.log("Audio context initialized.");

            // Загрузка FFmpeg
            ffmpeg.value = new FFmpeg();
            const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.2/dist/umd';
            await ffmpeg.value.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });
            console.log("FFmpeg loaded.");

            // Загрузка моделей нейронных сетей
            noiseSuppressionModel.value = await tf.loadLayersModel('/models/noise_suppression/model.json');
            enhancementModel.value = await tf.loadLayersModel('/models/enhancement/model.json');
            console.log("Models loaded.");

            isModelLoaded.value = true;
            processorState.value = ProcessorState.READY;
            console.log("Audio processor is ready.");
        } catch (error) {
            console.error('Error initializing audio processor:', error);
            errorMessage.value = 'Failed to initialize audio processor.';
            processorState.value = ProcessorState.ERROR;
        }
    });

    onUnmounted(() => {
        if (audioContext.value) {
            audioContext.value.close();
        }
    });

    // Функция обработки аудио
    const originalProcessAudio = async (audioBuffer: AudioBuffer) => {
        if (!isModelLoaded.value || !audioContext.value || !ffmpeg.value || !noiseSuppressionModel.value || !enhancementModel.value) {
            throw new Error('Audio processor is not fully initialized.');
        }

        try {
            processorState.value = ProcessorState.PROCESSING;
            processingProgress.value = 0;

            // Применение шумоподавления
            console.log("Applying noise suppression...");
            const noiseSuppressedBuffer = await applyNoiseSuppression(audioBuffer, noiseSuppressionModel.value);
            processingProgress.value = 25;
            console.log("Noise suppression applied.");

            // Применение AI улучшений
            console.log("Applying AI enhancements...");
            const enhancedBuffer = await applyAIEnhancements(noiseSuppressedBuffer, enhancementModel.value, settings.value.aiEnhancementLevel);
            processingProgress.value = 50;
            console.log("AI enhancements applied.");

            // Применение FFmpeg фильтров
            console.log("Applying FFmpeg filters...");
            const ffmpegOutput = await applyFFmpegFilters(enhancedBuffer);
            processingProgress.value = 75;
            console.log("FFmpeg filters applied.");

            // Создание финального буфера
            console.log("Creating final buffer...");
            processedBuffer.value = await createFinalBuffer(ffmpegOutput);
            processingProgress.value = 100;
            console.log("Final buffer created.");

            processorState.value = ProcessorState.READY;
        } catch (error) {
            console.error('Error processing audio:', error);
            errorMessage.value = 'Failed to process audio.';
            processorState.value = ProcessorState.ERROR;
        }
    };

    return {
        audioContext,
        originalBuffer,
        processedBuffer,
        isModelLoaded,
        processorState,
        processingProgress,
        ffmpeg,
        errorMessage,
        settings,
        originalProcessAudio,
    };
}

/**
 * Применяет шумоподавление к аудио буферу
 */
async function applyNoiseSuppression(audioBuffer: AudioBuffer, model: tf.LayersModel): Promise<AudioBuffer> {
    // Применение шумоподавления
    const inputTensor = tf.tensor(audioBuffer.getChannelData(0));
    const outputTensor = model.predict(inputTensor) as tf.Tensor;
    const outputData = outputTensor.dataSync();

    const newBuffer = audioBuffer.context.createBuffer(1, outputData.length, audioBuffer.sampleRate);
    newBuffer.copyToChannel(outputData, 0);

    return newBuffer;
}

/**
 * Применяет AI улучшения к аудио буферу
 */
async function applyAIEnhancements(audioBuffer: AudioBuffer, model: tf.LayersModel, enhancementLevel: number): Promise<AudioBuffer> {
    // Применение AI улучшений
    const inputTensor = tf.tensor(audioBuffer.getChannelData(0));
    const outputTensor = model.predict(inputTensor.mul(enhancementLevel)) as tf.Tensor;
    const outputData = outputTensor.dataSync();

    const newBuffer = audioBuffer.context.createBuffer(1, outputData.length, audioBuffer.sampleRate);
    newBuffer.copyToChannel(outputData, 0);

    return newBuffer;
}

/**
 * Применяет FFmpeg фильтры к аудио буферу
 */
async function applyFFmpegFilters(audioBuffer: AudioBuffer): Promise<AudioBuffer> {
    // Применение FFmpeg фильтров
    const ffmpegInstance = ffmpeg.value!;
    const audioData = audioBuffer.getChannelData(0);
    const audioBlob = new Blob([audioData], { type: 'audio/wav' });
    const audioURL = URL.createObjectURL(audioBlob);

    await ffmpegInstance.run('-i', audioURL, '-af', 'acompressor=threshold=0.5', 'output.wav');

    const outputBlob = await ffmpegInstance.read('output.wav');
    const outputArrayBuffer = await outputBlob.arrayBuffer();
    const newBuffer = await audioContext.value!.decodeAudioData(outputArrayBuffer);

    return newBuffer;
}

/**
 * Создает финальный аудио буфер
 */
async function createFinalBuffer(audioBuffer: AudioBuffer): Promise<AudioBuffer> {
    // Создание финального аудио буфера
    const newBuffer = audioContext.value!.createBuffer(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate);
    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
        newBuffer.copyToChannel(audioBuffer.getChannelData(i), i);
    }
    return newBuffer;
}