import { ref, onMounted, onUnmounted } from 'vue';
import * as tf from '@tensorflow/tfjs';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

// Interface for the processor settings
export interface AudioProcessorSettings {
    noiseSuppression: boolean;
    enhanceBass: boolean;
    enhanceTreble: boolean;
    normalizeVolume: boolean;
    removeEcho: boolean;
    addCompression: boolean;
    addStereoWidth: boolean;
    useAIEnhancement: boolean;
    aiEnhancementLevel: number; // a value between 0 and 1
}

// Processor state enum
export enum ProcessorState {
    IDLE = 'idle',
    LOADING = 'loading',
    PROCESSING = 'processing',
    READY = 'ready',
    ERROR = 'error'
}

/**
 * This hook handles loading and processing audio so that it reaches studio quality.
 * It allows you to load an audio file (URL or Blob) into an AudioBuffer,
 * then processes it via noise suppression, AI enhancement, and FFmpeg filters.
 */
export function useAudioProcessor() {
    // Core state objects
    const audioContext = ref<AudioContext | null>(null);
    const originalBuffer = ref<AudioBuffer | null>(null);
    const processedBuffer = ref<AudioBuffer | null>(null);
    const isModelLoaded = ref<boolean>(false);
    const processorState = ref<ProcessorState>(ProcessorState.IDLE);
    const processingProgress = ref<number>(0);
    const ffmpeg = ref<FFmpeg | null>(null);
    const errorMessage = ref<string | null>(null);

    // Default settings
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

    // Neural network models references
    const noiseSuppressionModel = ref<tf.LayersModel | null>(null);
    const enhancementModel = ref<tf.LayersModel | null>(null);

    // Initialization
    onMounted(async () => {
        try {
            processorState.value = ProcessorState.LOADING;
            console.log('Initializing audio processor...');

            // Create an audio context
            audioContext.value = new AudioContext();
            console.log('Audio context initialized.');

            // Initialize FFmpeg instance
            ffmpeg.value = new FFmpeg();
            const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.2/dist/umd';
            await ffmpeg.value.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });
            console.log('FFmpeg loaded.');

            // Load neural network models for processing
            noiseSuppressionModel.value = await tf.loadLayersModel('/models/noise_suppression/model.json');
            enhancementModel.value = await tf.loadLayersModel('/models/enhancement/model.json');
            console.log('Models loaded.');

            isModelLoaded.value = true;
            processorState.value = ProcessorState.READY;
            console.log('Audio processor is ready.');
        } catch (error) {
            console.error('Error initializing audio processor:', error);
            errorMessage.value = 'Failed to initialize audio processor.';
            processorState.value = ProcessorState.ERROR;
        }
    });

    onUnmounted(() => {
        if (audioContext.value) audioContext.value.close();
    });

    /**
     * loadAudio - Loads an audio file from a URL or Blob.
     * After loading, the audio is decoded into an AudioBuffer and stored in originalBuffer.
     */
    const loadAudio = async (audioSource: string | Blob) => {
        if (!audioContext.value) {
            throw new Error('Audio context is not initialized.');
        }
        try {
            let arrayBuffer: ArrayBuffer;
            if (typeof audioSource === 'string') {
                const response = await fetch(audioSource);
                arrayBuffer = await response.arrayBuffer();
            } else {
                arrayBuffer = await audioSource.arrayBuffer();
            }
            const decodedBuffer = await audioContext.value.decodeAudioData(arrayBuffer);
            originalBuffer.value = decodedBuffer;
            console.log('[loadAudio] Audio loaded. Max audio value:', Math.max(...decodedBuffer.getChannelData(0)));
        } catch (error) {
            console.error('Error loading audio:', error);
            throw error;
        }
    };

    /**
     * originalProcessAudio - Processes the provided AudioBuffer through a series of steps:
     * noise suppression -> AI enhancements -> FFmpeg filtering -> final buffer creation.
     * The final processed AudioBuffer is stored in processedBuffer.
     */
    const originalProcessAudio = async (audioBuffer: AudioBuffer) => {
        if (
            !isModelLoaded.value ||
            !audioContext.value ||
            !ffmpeg.value ||
            !noiseSuppressionModel.value ||
            !enhancementModel.value
        ) {
            throw new Error('Audio processor is not fully initialized.');
        }
        try {
            processorState.value = ProcessorState.PROCESSING;
            processingProgress.value = 0;

            console.log('Applying noise suppression...');
            const noiseSuppressedBuffer = await applyNoiseSuppression(audioBuffer, noiseSuppressionModel.value);
            processingProgress.value = 25;
            console.log('Noise suppression applied.');

            console.log('Applying AI enhancements...');
            const enhancedBuffer = await applyAIEnhancements(noiseSuppressedBuffer, enhancementModel.value, settings.value.aiEnhancementLevel);
            processingProgress.value = 50;
            console.log('AI enhancements applied.');

            console.log('Applying FFmpeg filters...');
            const ffmpegOutput = await applyFFmpegFilters(enhancedBuffer);
            processingProgress.value = 75;
            console.log('FFmpeg filters applied.');

            console.log('Creating final buffer...');
            processedBuffer.value = await createFinalBuffer(ffmpegOutput);
            processingProgress.value = 100;
            console.log('Final buffer created.');

            processorState.value = ProcessorState.READY;
        } catch (error) {
            console.error('Error processing audio:', error);
            errorMessage.value = 'Failed to process audio.';
            processorState.value = ProcessorState.ERROR;
            throw error;
        }
    };

    // Helper function: applies noise suppression using a neural network model
    async function applyNoiseSuppression(audioBuffer: AudioBuffer, model: tf.LayersModel): Promise<AudioBuffer> {
        const inputTensor = tf.tensor(audioBuffer.getChannelData(0));
        const outputTensor = model.predict(inputTensor) as tf.Tensor;
        const outputData = outputTensor.dataSync();
        const newBuffer = audioBuffer.context.createBuffer(1, outputData.length, audioBuffer.sampleRate);
        newBuffer.copyToChannel(outputData, 0);
        return newBuffer;
    }

    // Helper function: applies AI enhancements to the audio signal
    async function applyAIEnhancements(audioBuffer: AudioBuffer, model: tf.LayersModel, enhancementLevel: number): Promise<AudioBuffer> {
        const inputTensor = tf.tensor(audioBuffer.getChannelData(0));
        const scaledTensor = inputTensor.mul(enhancementLevel);
        const outputTensor = model.predict(scaledTensor) as tf.Tensor;
        const outputData = outputTensor.dataSync();
        const newBuffer = audioBuffer.context.createBuffer(1, outputData.length, audioBuffer.sampleRate);
        newBuffer.copyToChannel(outputData, 0);
        return newBuffer;
    }

    // Helper function: applies FFmpeg filters; here we compress the audio signal as an example.
    async function applyFFmpegFilters(audioBuffer: AudioBuffer): Promise<AudioBuffer> {
        // Convert AudioBuffer to a WAV blob
        const wavBlob = encodeWAV(audioBuffer);
        // Create an object URL for FFmpeg input
        const audioURL = URL.createObjectURL(wavBlob);

        const ffmpegInstance = ffmpeg.value!;
        // Run a simple FFmpeg filter command (adjust parameters as needed)
        await ffmpegInstance.run('-i', audioURL, '-af', 'acompressor=threshold=0.5', 'output.wav');

        const outputBlob = await ffmpegInstance.read('output.wav');
        const outputArrayBuffer = await outputBlob.arrayBuffer();
        const newBuffer = await audioContext.value!.decodeAudioData(outputArrayBuffer);
        return newBuffer;
    }

    // Helper function: creates a final AudioBuffer copy from the processed data
    async function createFinalBuffer(audioBuffer: AudioBuffer): Promise<AudioBuffer> {
        const newBuffer = audioContext.value!.createBuffer(
            audioBuffer.numberOfChannels,
            audioBuffer.length,
            audioBuffer.sampleRate
        );
        for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
            newBuffer.copyToChannel(audioBuffer.getChannelData(i), i);
        }
        return newBuffer;
    }

    /**
     * Helper function to encode an AudioBuffer as a WAV file.
     * This is a basic implementation; you may use a more robust encoder if needed.
     */
    function encodeWAV(buffer: AudioBuffer): Blob {
        const numOfChan = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;

        // Combine channel data
        let interleaved;
        if (numOfChan === 2) {
            interleaved = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
        } else {
            interleaved = buffer.getChannelData(0);
        }

        const dataLength = interleaved.length * (bitDepth / 8);
        const bufferLength = 44 + dataLength;
        const arrayBuffer = new ArrayBuffer(bufferLength);
        const view = new DataView(arrayBuffer);

        // Write WAV header
        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + dataLength, true);
        writeString(view, 8, 'WAVE');
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true); // PCM chunk size
        view.setUint16(20, format, true);
        view.setUint16(22, numOfChan, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numOfChan * (bitDepth / 8), true);
        view.setUint16(32, numOfChan * (bitDepth / 8), true);
        view.setUint16(34, bitDepth, true);
        writeString(view, 36, 'data');
        view.setUint32(40, dataLength, true);

        // Write PCM samples
        let offset = 44;
        for (let i = 0; i < interleaved.length; i++, offset += 2) {
            const s = Math.max(-1, Math.min(1, interleaved[i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }

        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }

    function writeString(view: DataView, offset: number, str: string) {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
    }

    /**
     * Interleave left and right channel data.
     */
    function interleave(left: Float32Array, right: Float32Array): Float32Array {
        const totalLength = left.length + right.length;
        const result = new Float32Array(totalLength);
        let index = 0;
        for (let i = 0; i < left.length; i++) {
            result[index++] = left[i];
            result[index++] = right[i];
        }
        return result;
    }

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
        loadAudio,
        originalProcessAudio,
    };
}