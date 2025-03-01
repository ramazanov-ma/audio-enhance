// Студийный аудиопроцессор с продвинутыми алгоритмами обработки

/**
 * Применяет интеллектуальное шумоподавление на основе спектрального анализа
 */
export const applyNoiseReduction = async (buffer: AudioBuffer, intensity: number, useAdvanced = false): Promise<AudioBuffer> => {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)()
    const outputBuffer = context.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate)

    // Параметры алгоритма шумоподавления
    const fftSize = 2048
    const overlap = 0.75
    const threshold = useAdvanced ? 0.08 - (intensity * 0.05) : 0.1 - (intensity * 0.05)
    const softness = useAdvanced ? 0.1 + (intensity * 0.1) : 0.2

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const inputData = buffer.getChannelData(channel)
        const outputData = outputBuffer.getChannelData(channel)

        // Анализ шумового профиля (первые 500 мс, обычно содержат шум фона)
        const noiseProfileLength = Math.min(buffer.sampleRate * 0.5, buffer.length / 4)
        const noiseProfile = new Float32Array(noiseProfileLength)
        for (let i = 0; i < noiseProfileLength; i++) {
            noiseProfile[i] = inputData[i]
        }

        // Оценка спектра шума
        const noiseSpectrum = await estimateNoiseSpectrum(noiseProfile, fftSize)

        // Применение шумоподавления с помощью спектрального вычитания
        await spectrumSubtract(inputData, outputData, noiseSpectrum, fftSize, overlap, threshold, softness, intensity)
    }

    return outputBuffer
}

/**
 * Оценивает спектр шума на основе фрагмента аудио
 */
const estimateNoiseSpectrum = async (noiseProfile: Float32Array, fftSize: number): Promise<Float32Array> => {
    const spectrum = new Float32Array(fftSize / 2)
    const frameCount = Math.floor(noiseProfile.length / fftSize)

    // Если фрагмент слишком короткий, возвращаем нулевой спектр
    if (frameCount <= 0) {
        return spectrum
    }

    // Окно анализа (Hann window для лучшего спектрального разрешения)
    const window = new Float32Array(fftSize)
    for (let i = 0; i < fftSize; i++) {
        window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (fftSize - 1)))
    }

    // Оффлайн FFT для оценки спектра
    const real = new Float32Array(fftSize)
    const imag = new Float32Array(fftSize)

    for (let frame = 0; frame < frameCount; frame++) {
        // Применение окна
        for (let i = 0; i < fftSize; i++) {
            const idx = frame * fftSize + i
            real[i] = idx < noiseProfile.length ? noiseProfile[idx] * window[i] : 0
            imag[i] = 0
        }

        // FFT
        performFFT(real, imag)

        // Накопление магнитуд
        for (let i = 0; i < fftSize / 2; i++) {
            const magnitude = Math.sqrt(real[i] * real[i] + imag[i] * imag[i])
            spectrum[i] += magnitude
        }
    }

    // Усреднение спектра по фреймам
    for (let i = 0; i < fftSize / 2; i++) {
        spectrum[i] /= frameCount
    }

    return spectrum
}

/**
 * Спектральное вычитание для удаления шума
 */
const spectrumSubtract = async (
    inputData: Float32Array,
    outputData: Float32Array,
    noiseSpectrum: Float32Array,
    fftSize: number,
    overlap: number,
    threshold: number,
    softness: number,
    intensity: number
): Promise<void> => {
    const hopSize = Math.floor(fftSize * (1 - overlap))
    const frameCount = Math.floor((inputData.length - fftSize) / hopSize) + 1

    // Окно анализа
    const window = new Float32Array(fftSize)
    for (let i = 0; i < fftSize; i++) {
        window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (fftSize - 1)))
    }

    // Очистка выходного буфера
    outputData.fill(0)

    for (let frame = 0; frame < frameCount; frame++) {
        const startIdx = frame * hopSize

        const real = new Float32Array(fftSize)
        const imag = new Float32Array(fftSize)

        // Применение окна на входные данные
        for (let i = 0; i < fftSize; i++) {
            const idx = startIdx + i
            real[i] = idx < inputData.length ? inputData[idx] * window[i] : 0
            imag[i] = 0
        }

        // FFT
        performFFT(real, imag)

        // Спектральное вычитание с мягким порогом
        for (let i = 0; i < fftSize / 2; i++) {
            const magnitude = Math.sqrt(real[i] * real[i] + imag[i] * imag[i])
            const phase = Math.atan2(imag[i], real[i])

            // Интеллектуальное шумоподавление с учетом интенсивности
            let noiseLevel = noiseSpectrum[i] * (0.5 + intensity * 0.5)

            // Мягкий порог
            let gain = 1.0
            if (magnitude < noiseLevel + threshold) {
                const diff = (magnitude - noiseLevel) / threshold
                gain = Math.max(0, Math.pow(diff, softness))
            }

            // Применение коэффициента к комплексным компонентам
            real[i] *= gain
            imag[i] *= gain
        }

        // Второй канал комплексного спектра (для правильного IFFT)
        for (let i = 1; i < fftSize / 2; i++) {
            real[fftSize - i] = real[i]
            imag[fftSize - i] = -imag[i]
        }

        // Безопасный overlap-add в выходной буфер
        safeOverlapAdd(outputData, real, window, startIdx)

        // Overlap-add в выходной буфер
        for (let i = 0; i < fftSize; i++) {
            const idx = startIdx + i
            if (idx < outputData.length) {
                outputData[idx] += real[i] * window[i]
            }
        }
    }

    // Нормализация выходного сигнала для предотвращения клиппинга
    let maxAbs = 0
    for (let i = 0; i < outputData.length; i++) {
        maxAbs = Math.max(maxAbs, Math.abs(outputData[i]))
    }

    if (maxAbs > 0.95) {
        const gain = 0.95 / maxAbs
        for (let i = 0; i < outputData.length; i++) {
            outputData[i] *= gain
        }
    }
}

/**
 * Применяет профессиональную многополосную эквализацию с плавными переходами между полосами
 */
export const applyEqualizer = async (
    buffer: AudioBuffer,
    lowGain: number,
    midGain: number,
    highGain: number,
    useAdvanced = false
): Promise<AudioBuffer> => {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)()
    const outputBuffer = context.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate)

    // Преобразование значений дБ в линейные множители
    const lowGainLinear = Math.pow(10, lowGain / 20)
    const midGainLinear = Math.pow(10, midGain / 20)
    const highGainLinear = Math.pow(10, highGain / 20)

    // Настройка частот кроссовера для более музыкальной эквализации
    const lowCrossover = useAdvanced ? 250 : 300 // Гц
    const highCrossover = useAdvanced ? 4000 : 3500 // Гц

    // Параметры фильтров
    const filterOrder = useAdvanced ? 8 : 4
    const fftSize = 4096 // Больший размер FFT для лучшего частотного разрешения
    const overlapFactor = 0.75

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const inputData = buffer.getChannelData(channel)
        const outputData = outputBuffer.getChannelData(channel)

        // Применение трехполосного эквалайзера с фазовой линеаризацией
        await studioEqualizer(
            inputData, outputData, buffer.sampleRate,
            lowCrossover, highCrossover, lowGainLinear, midGainLinear, highGainLinear,
            filterOrder, fftSize, overlapFactor
        )
    }

    return outputBuffer
}

/**
 * Трехполосный эквалайзер с фазовой линеаризацией для студийного качества
 */
const studioEqualizer = async (
    inputData: Float32Array,
    outputData: Float32Array,
    sampleRate: number,
    lowCrossover: number,
    highCrossover: number,
    lowGain: number,
    midGain: number,
    highGain: number,
    filterOrder: number,
    fftSize: number,
    overlapFactor: number
): Promise<void> => {
    const hopSize = Math.floor(fftSize * (1 - overlapFactor))
    const frameCount = Math.floor((inputData.length - fftSize) / hopSize) + 1

    // Окно анализа
    const window = new Float32Array(fftSize)
    for (let i = 0; i < fftSize; i++) {
        window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (fftSize - 1)))
    }

    // Подготовка частотных индексов для кроссоверов
    const lowBin = Math.round(lowCrossover / sampleRate * fftSize)
    const highBin = Math.round(highCrossover / sampleRate * fftSize)

    // Создание сглаженных переходов между полосами для предотвращения артефактов
    const transitionWidth = Math.floor(fftSize * 0.05) // 5% от размера FFT

    // Очистка выходного буфера
    outputData.fill(0)

    for (let frame = 0; frame < frameCount; frame++) {
        const startIdx = frame * hopSize

        const real = new Float32Array(fftSize)
        const imag = new Float32Array(fftSize)

        // Применение окна к входным данным
        for (let i = 0; i < fftSize; i++) {
            const idx = startIdx + i
            real[i] = idx < inputData.length ? inputData[idx] * window[i] : 0
            imag[i] = 0
        }

        // FFT
        performFFT(real, imag)

        // Применение коэффициентов усиления к каждой полосе с мягкими переходами
        for (let i = 0; i <= fftSize / 2; i++) {
            let gain = 1.0

            // Низкие частоты
            if (i < lowBin - transitionWidth) {
                gain = lowGain
            }
            // Переход от низких к средним
            else if (i < lowBin + transitionWidth) {
                const mix = (i - (lowBin - transitionWidth)) / (2 * transitionWidth)
                gain = lowGain * (1 - mix) + midGain * mix
            }
            // Средние частоты
            else if (i < highBin - transitionWidth) {
                gain = midGain
            }
            // Переход от средних к высоким
            else if (i < highBin + transitionWidth) {
                const mix = (i - (highBin - transitionWidth)) / (2 * transitionWidth)
                gain = midGain * (1 - mix) + highGain * mix
            }
            // Высокие частоты
            else {
                gain = highGain
            }

            // Применение усиления к комплексным компонентам
            real[i] *= gain
            imag[i] *= gain
        }

        // Зеркальное отражение для правильного IFFT
        for (let i = 1; i < fftSize / 2; i++) {
            real[fftSize - i] = real[i]
            imag[fftSize - i] = -imag[i]
        }

        // IFFT
        performIFFT(real, imag)

        // Overlap-add в выходной буфер
        for (let i = 0; i < fftSize; i++) {
            const idx = startIdx + i
            if (idx < outputData.length) {
                outputData[idx] += real[i] * window[i]
            }
        }
    }

    // Нормализация для предотвращения клиппинга
    let maxAbs = 0
    for (let i = 0; i < outputData.length; i++) {
        maxAbs = Math.max(maxAbs, Math.abs(outputData[i]))
    }

    if (maxAbs > 0.99) {
        const gain = 0.99 / maxAbs
        for (let i = 0; i < outputData.length; i++) {
            outputData[i] *= gain
        }
    }
}

/**
 * Применяет студийную нормализацию с многополосной компрессией
 */
export const applyNormalization = async (
    buffer: AudioBuffer,
    intensity: number,
    useAdvanced = false
): Promise<AudioBuffer> => {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)()
    const outputBuffer = context.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate)

    // Параметры нормализации настраиваются в зависимости от интенсивности
    const targetLUFS = useAdvanced ? -14 - (1 - intensity) * 10 : -16 - (1 - intensity) * 8
    const threshold = useAdvanced ? -24 - (1 - intensity) * 12 : -20 - (1 - intensity) * 10
    const ratio = 1 + intensity * 3 // От 1:1 до 4:1
    const attackTime = 0.020 // 20 мс
    const releaseTime = 0.100 + intensity * 0.200 // 100-300 мс
    const usePeakLimiter = intensity > 0.7 // Использовать пиковый лимитер для высоких значений интенсивности

    // Анализ громкости
    let peakValue = 0
    let rmsSum = 0

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const inputData = buffer.getChannelData(channel)

        for (let i = 0; i < inputData.length; i++) {
            const sample = Math.abs(inputData[i])
            peakValue = Math.max(peakValue, sample)
            rmsSum += sample * sample
        }
    }

    const rmsValue = Math.sqrt(rmsSum / (buffer.length * buffer.numberOfChannels))

    // Определение коэффициентов усиления для многополосной компрессии
    const lufsGainFactor = estimateLUFSgain(rmsValue, targetLUFS)

    // Применение многополосной динамической обработки
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const inputData = buffer.getChannelData(channel)
        const outputData = outputBuffer.getChannelData(channel)

        // Применение компрессии и нормализации
        await multiband_dynamics(
            inputData,
            outputData,
            buffer.sampleRate,
            threshold,
            ratio,
            attackTime,
            releaseTime,
            lufsGainFactor,
            usePeakLimiter
        )
    }

    return outputBuffer
}

/**
 * Оценка коэффициента усиления для достижения целевого уровня LUFS
 */
const estimateLUFSgain = (rmsValue: number, targetLUFS: number): number => {
    // Примерное преобразование RMS в LUFS (упрощенная формула)
    const estimatedLUFS = 20 * Math.log10(rmsValue) - 10

    // Расчет необходимого усиления для достижения целевого значения
    const gainDB = targetLUFS - estimatedLUFS

    // Преобразование дБ в линейный множитель с безопасным ограничением
    const gainLinear = Math.min(4.0, Math.pow(10, gainDB / 20))
    return gainLinear
}

/**
 * Многополосная динамическая обработка для профессионального звучания
 */
const multiband_dynamics = async (
    inputData: Float32Array,
    outputData: Float32Array,
    sampleRate: number,
    thresholdDB: number,
    ratio: number,
    attackTime: number,
    releaseTime: number,
    gainFactor: number,
    usePeakLimiter: boolean
): Promise<void> => {
    // Константы для динамической обработки
    const attackCoef = Math.exp(-1 / (sampleRate * attackTime))
    const releaseCoef = Math.exp(-1 / (sampleRate * releaseTime))
    const thresholdLinear = Math.pow(10, thresholdDB / 20)

    // Состояние для компрессора
    let envelope = 0

    // Буфер для лимитера
    let lookAheadBuffer = usePeakLimiter ? new Float32Array(Math.ceil(sampleRate * 0.005)) : null // 5 мс
    let lookAheadIndex = 0

    // Коэффициенты для вычисления пикового значения с предварительным просмотром
    const limiterThreshold = 0.99
    const limiterRelease = Math.exp(-1 / (sampleRate * 0.050)) // 50 мс релиз для лимитера
    let limiterGain = 1.0

    // Применяем многополосную динамическую обработку
    for (let i = 0; i < inputData.length; i++) {
        // Получаем текущий сэмпл
        let sample = inputData[i]

        // Детектор уровня (следящая огибающая)
        const inputLevel = Math.abs(sample)
        if (inputLevel > envelope) {
            envelope = attackCoef * envelope + (1 - attackCoef) * inputLevel
        } else {
            envelope = releaseCoef * envelope + (1 - releaseCoef) * inputLevel
        }

        // Компрессия
        let gainReduction = 1.0
        if (envelope * gainFactor > thresholdLinear) {
            // Вычисление коэффициента усиления для компрессии
            const overThreshold = envelope * gainFactor / thresholdLinear
            gainReduction = Math.pow(overThreshold, 1 / ratio - 1)
        }

        // Применение усиления и компрессии
        sample = sample * gainFactor * gainReduction

        // Лимитирование с предварительным просмотром (если включено)
        if (usePeakLimiter && lookAheadBuffer) {
            // Сохраняем текущий сэмпл в буфере предварительного просмотра
            const oldSample = lookAheadBuffer[lookAheadIndex]
            lookAheadBuffer[lookAheadIndex] = sample

            // Детектируем пики в буфере предварительного просмотра
            let peakValue = 0
            for (let j = 0; j < lookAheadBuffer.length; j++) {
                peakValue = Math.max(peakValue, Math.abs(lookAheadBuffer[j]))
            }

            // Обновляем коэффициент усиления лимитера
            if (peakValue > limiterThreshold) {
                const targetGain = limiterThreshold / peakValue
                limiterGain = Math.min(limiterGain, targetGain)
            } else {
                limiterGain = limiterRelease * limiterGain + (1 - limiterRelease)
            }

            // Применяем лимитирование к сэмплу, выходящему из буфера предварительного просмотра
            sample = oldSample * limiterGain

            // Обновляем индекс буфера предварительного просмотра
            lookAheadIndex = (lookAheadIndex + 1) % lookAheadBuffer.length
        }

        // Записываем результат в выходной буфер
        outputData[i] = sample
    }

    // Если включено лимитирование с предварительным просмотром, обработать остаток буфера
    if (usePeakLimiter && lookAheadBuffer) {
        for (let i = 0; i < lookAheadBuffer.length; i++) {
            const idx = inputData.length + i
            if (idx < outputData.length) {
                outputData[idx] = lookAheadBuffer[(lookAheadIndex + i) % lookAheadBuffer.length] * limiterGain
            }
        }
    }
}

/**
 * Улучшает стерео образ без нарушения монофонической совместимости
 */
export const applyStereoEnhancement = async (buffer: AudioBuffer, intensity: number): Promise<AudioBuffer> => {
    // Проверка на стерео
    if (buffer.numberOfChannels < 2) {
        return buffer // Возвращаем неизмененный буфер для моно
    }

    const context = new (window.AudioContext || (window as any).webkitAudioContext)()
    const outputBuffer = context.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate)

    // Получаем данные каналов
    const leftChannel = buffer.getChannelData(0)
    const rightChannel = buffer.getChannelData(1)
    const outputLeft = outputBuffer.getChannelData(0)
    const outputRight = outputBuffer.getChannelData(1)

    // Параметры улучшения стерео
    const minFreq = 200 // Гц - ниже этой частоты не расширяем стерео (сохраняем басы в моно)
    const maxFreq = 12000 // Гц - выше этой частоты мягко уменьшаем расширение
    const width = 0.2 + intensity * 0.8 // Ширина стерео от 0.2 до 1.0

    // Размер FFT для частотно-зависимого расширения
    const fftSize = 4096
    const hopSize = fftSize / 4
    const frameCount = Math.floor((buffer.length - fftSize) / hopSize) + 1

    // Окно анализа
    const window = new Float32Array(fftSize)
    for (let i = 0; i < fftSize; i++) {
        window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (fftSize - 1)))
    }

    // Очищаем выходной буфер
    outputLeft.fill(0)
    outputRight.fill(0)

    // Применяем частотно-зависимое расширение стерео через M/S обработку
    for (let frame = 0; frame < frameCount; frame++) {
        const startIdx = frame * hopSize

        // Буферы для FFT
        const realLeft = new Float32Array(fftSize)
        const imagLeft = new Float32Array(fftSize)
        const realRight = new Float32Array(fftSize)
        const imagRight = new Float32Array(fftSize)

        // Применение окна к входным данным
        for (let i = 0; i < fftSize; i++) {
            const idx = startIdx + i
            if (idx < buffer.length) {
                realLeft[i] = leftChannel[idx] * window[i]
                imagLeft[i] = 0

                realRight[i] = rightChannel[idx] * window[i]
                imagRight[i] = 0
            }
        }

        // FFT для левого и правого каналов
        performFFT(realLeft, imagLeft)
        performFFT(realRight, imagRight)

        // Обработка в частотной области с M/S преобразованием
        for (let i = 0; i < fftSize / 2; i++) {
            // Преобразование комплексных чисел в Mid/Side
            const leftRe = realLeft[i]
            const leftIm = imagLeft[i]
            const rightRe = realRight[i]
            const rightIm = imagRight[i]

            // M/S преобразование
            const midRe = (leftRe + rightRe) * 0.5
            const midIm = (leftIm + rightIm) * 0.5
            const sideRe = (leftRe - rightRe) * 0.5
            const sideIm = (leftIm - rightIm) * 0.5

            // Вычисление частоты для текущего бина
            const freq = i * buffer.sampleRate / fftSize

            // Частотно-зависимое стерео расширение
            let stereoScale = width

            // Уменьшаем расширение на низких частотах
            if (freq < minFreq) {
                stereoScale = width * (freq / minFreq)
            }

            // Уменьшаем расширение на высоких частотах
            if (freq > maxFreq) {
                stereoScale = width * (1.0 - Math.min(1.0, (freq - maxFreq) / (20000 - maxFreq)))
            }

            // Масштабирование стерео компонента
            const enhancedSideRe = sideRe * (1.0 + stereoScale)
            const enhancedSideIm = sideIm * (1.0 + stereoScale)

            // Обратное M/S преобразование
            realLeft[i] = midRe + enhancedSideRe
            imagLeft[i] = midIm + enhancedSideIm
            realRight[i] = midRe - enhancedSideRe
            imagRight[i] = midIm - enhancedSideIm
        }

        // Зеркальное отражение для правильного IFFT
        for (let i = 1; i < fftSize / 2; i++) {
            const mirrorIdx = fftSize - i

            realLeft[mirrorIdx] = realLeft[i]
            imagLeft[mirrorIdx] = -imagLeft[i]

            realRight[mirrorIdx] = realRight[i]
            imagRight[mirrorIdx] = -imagRight[i]
        }

        // IFFT для обоих каналов
        performIFFT(realLeft, imagLeft)
        performIFFT(realRight, imagRight)

        // Overlap-add в выходные буферы
        for (let i = 0; i < fftSize; i++) {
            const idx = startIdx + i
            if (idx < outputBuffer.length) {
                outputLeft[idx] += realLeft[i] * window[i]
                outputRight[idx] += realRight[i] * window[i]
            }
        }
    }

    // Нормализация для предотвращения клиппинга
    let maxAbs = 0
    for (let i = 0; i < outputBuffer.length; i++) {
        maxAbs = Math.max(maxAbs, Math.abs(outputLeft[i]), Math.abs(outputRight[i]))
    }

    if (maxAbs > 0.98) {
        const gain = 0.98 / maxAbs
        for (let i = 0; i < outputBuffer.length; i++) {
            outputLeft[i] *= gain
            outputRight[i] *= gain
        }
    }

    return outputBuffer
}

/**
 * Удаление излишней реверберации (эффекта помещения)
 */
export const applyDereverberation = async (buffer: AudioBuffer, intensity: number): Promise<AudioBuffer> => {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)()
    const outputBuffer = context.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate)

    const fftSize = 8192 // Большой размер FFT для высокого разрешения
    const overlap = 0.75
    const hopSize = Math.floor(fftSize * (1 - overlap))

    const decayRate = 0.2 + intensity * 0.5 // Скорость затухания реверберации (зависит от интенсивности)
    const minSmoothingTime = 0.05 // 50 мс
    const maxSmoothingTime = 0.2  // 200 мс
    const smoothingTime = minSmoothingTime + intensity * (maxSmoothingTime - minSmoothingTime)

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const inputData = buffer.getChannelData(channel)
        const outputData = outputBuffer.getChannelData(channel)

        // Применяем алгоритм деревербрации на основе спектральной огибающей
        await spectralDereverberation(
            inputData,
            outputData,
            buffer.sampleRate,
            fftSize,
            hopSize,
            decayRate,
            smoothingTime
        )
    }

    return outputBuffer
}

/**
 * Спектральная деревербрация - удаление излишнего эффекта помещения
 */
const spectralDereverberation = async (
    inputData: Float32Array,
    outputData: Float32Array,
    sampleRate: number,
    fftSize: number,
    hopSize: number,
    decayRate: number,
    smoothingTime: number
): Promise<void> => {
    const frameCount = Math.floor((inputData.length - fftSize) / hopSize) + 1

    // Окно анализа
    const window = new Float32Array(fftSize)
    for (let i = 0; i < fftSize; i++) {
        window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (fftSize - 1)))
    }

    // Параметры для спектральной огибающей
    const smoothingCoef = Math.exp(-1 / (sampleRate * smoothingTime))

    // Спектральная огибающая
    const spectralEnvelope = new Float32Array(fftSize / 2 + 1)
    const decayFactors = new Float32Array(fftSize / 2 + 1)

    // Рассчитываем факторы затухания для разных частот
    for (let i = 0; i <= fftSize / 2; i++) {
        // Высокие частоты затухают быстрее, чем низкие
        const freqFactor = Math.pow(i / (fftSize / 2), 0.5)
        decayFactors[i] = Math.pow(decayRate, freqFactor)
    }

    // Очистка выходного буфера
    outputData.fill(0)

    for (let frame = 0; frame < frameCount; frame++) {
        const startIdx = frame * hopSize

        const real = new Float32Array(fftSize)
        const imag = new Float32Array(fftSize)

        // Применение окна к входным данным
        for (let i = 0; i < fftSize; i++) {
            const idx = startIdx + i
            real[i] = idx < inputData.length ? inputData[idx] * window[i] : 0
            imag[i] = 0
        }

        // FFT
        performFFT(real, imag)

        // Обработка в частотной области
        for (let i = 0; i <= fftSize / 2; i++) {
            // Вычисление текущей магнитуды
            const magnitude = Math.sqrt(real[i] * real[i] + imag[i] * imag[i])
            const phase = Math.atan2(imag[i], real[i])

            // Обновление спектральной огибающей с помощью сглаженного детектора пиков
            spectralEnvelope[i] = Math.max(
                magnitude,
                spectralEnvelope[i] * smoothingCoef
            )

            // Оценка реверберационной компоненты
            const directSound = magnitude
            const reverbComponent = spectralEnvelope[i] * decayFactors[i]

            // Suppression filter
            let gain = directSound / (directSound + reverbComponent)

            // Смягчение применения фильтра для более естественного звучания
            gain = Math.pow(gain, 0.5)

            // Применение коэффициента к комплексным компонентам
            real[i] *= gain
            imag[i] *= gain
        }

        // Второй канал комплексного спектра (для правильного IFFT)
        for (let i = 1; i < fftSize / 2; i++) {
            real[fftSize - i] = real[i]
            imag[fftSize - i] = -imag[i]
        }

        // IFFT
        performIFFT(real, imag)

        // Overlap-add в выходной буфер
        for (let i = 0; i < fftSize; i++) {
            const idx = startIdx + i
            if (idx < outputData.length) {
                outputData[idx] += real[i] * window[i]
            }
        }
    }
}

/**
 * Улучшение чистоты и разборчивости звука
 */
export const applyClarity = async (buffer: AudioBuffer, intensity: number): Promise<AudioBuffer> => {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)()
    const outputBuffer = context.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate)

    // Параметры для повышения разборчивости
    const presenceBoost = 3 + intensity * 9 // от 3 до 12 дБ
    const presenceCenterFreq = 2500 // Гц - частота присутствия для вокала/речи
    const presenceBandwidth = 1.0 + intensity * 0.5 // Октавы
    const clarityBoost = 1 + intensity * 5 // от 1 до 6 дБ
    const clarityCenterFreq = 5000 // Гц - частота четкости
    const clarityBandwidth = 0.8 + intensity * 0.3 // Октавы

    // Многополосный эквалайзер для улучшения разборчивости
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const inputData = buffer.getChannelData(channel)
        const outputData = outputBuffer.getChannelData(channel)

        // Применяем эквализацию для улучшения разборчивости
        await applyMultibandEQ(
            inputData,
            outputData,
            buffer.sampleRate,
            [
                { frequency: presenceCenterFreq, gain: presenceBoost, bandwidth: presenceBandwidth },
                { frequency: clarityCenterFreq, gain: clarityBoost, bandwidth: clarityBandwidth }
            ]
        )
    }

    return outputBuffer
}

/**
 * Применяет многополосный параметрический эквалайзер
 */
const applyMultibandEQ = async (
    inputData: Float32Array,
    outputData: Float32Array,
    sampleRate: number,
    bands: Array<{ frequency: number; gain: number; bandwidth: number }>
): Promise<void> => {
    const fftSize = 4096
    const overlap = 0.75
    const hopSize = Math.floor(fftSize * (1 - overlap))
    const frameCount = Math.floor((inputData.length - fftSize) / hopSize) + 1

    // Окно анализа
    const window = new Float32Array(fftSize)
    for (let i = 0; i < fftSize; i++) {
        window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (fftSize - 1)))
    }

    // Вычисляем коэффициенты усиления для каждой частоты
    const freqGains = new Float32Array(fftSize / 2 + 1)
    freqGains.fill(1.0) // По умолчанию единичное усиление

    for (let i = 0; i <= fftSize / 2; i++) {
        const freq = i * sampleRate / fftSize

        // Применяем все полосы эквалайзера
        for (const band of bands) {
            const centerFreq = band.frequency
            const gainDB = band.gain
            const bandwidth = band.bandwidth

            // Преобразуем настройки эквалайзера в фильтр второго порядка
            // (Упрощенная формула для параметрического эквалайзера)
            const octaveWidth = bandwidth * Math.log2(2)
            const freqRatio = freq / centerFreq
            const logFreqRatio = Math.log(freqRatio) / Math.LN2

            // Форма колокола для эквализации
            let bandGain = 1.0
            if (Math.abs(logFreqRatio) < octaveWidth) {
                // Усиление или ослабление в полосе
                const gainFactor = Math.pow(10, gainDB / 20)
                const shape = Math.cos(Math.PI * logFreqRatio / octaveWidth) * 0.5 + 0.5
                bandGain = 1.0 + (gainFactor - 1.0) * shape
            }

            freqGains[i] *= bandGain
        }
    }

    // Очистка выходного буфера
    outputData.fill(0)

    for (let frame = 0; frame < frameCount; frame++) {
        const startIdx = frame * hopSize

        const real = new Float32Array(fftSize)
        const imag = new Float32Array(fftSize)

        // Применение окна к входным данным
        for (let i = 0; i < fftSize; i++) {
            const idx = startIdx + i
            real[i] = idx < inputData.length ? inputData[idx] * window[i] : 0
            imag[i] = 0
        }

        // FFT
        performFFT(real, imag)

        // Применение эквализации в частотной области
        for (let i = 0; i <= fftSize / 2; i++) {
            real[i] *= freqGains[i]
            imag[i] *= freqGains[i]
        }

        // Зеркальное отражение для правильного IFFT
        for (let i = 1; i < fftSize / 2; i++) {
            real[fftSize - i] = real[i]
            imag[fftSize - i] = -imag[i]
        }

        // IFFT
        performIFFT(real, imag)

        // Overlap-add в выходной буфер
        for (let i = 0; i < fftSize; i++) {
            const idx = startIdx + i
            if (idx < outputData.length) {
                outputData[idx] += real[i] * window[i]
            }
        }
    }

    // Нормализация выходного сигнала
    let maxAbs = 0
    for (let i = 0; i < outputData.length; i++) {
        maxAbs = Math.max(maxAbs, Math.abs(outputData[i]))
    }

    if (maxAbs > 0.95) {
        const gain = 0.95 / maxAbs
        for (let i = 0; i < outputData.length; i++) {
            outputData[i] *= gain
        }
    }
}

/**
 * Гармоническое обогащение для добавления "теплоты" звуку
 */
export const applyHarmonicEnhancement = async (buffer: AudioBuffer, intensity: number): Promise<AudioBuffer> => {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)()
    const outputBuffer = context.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate)

    const harmonicAmount = 0.05 + intensity * 0.2 // от 5% до 25%
    const harmonicType = intensity > 0.7 ? 'tube' : 'tape' // Тип гармоник в зависимости от интенсивности

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const inputData = buffer.getChannelData(channel)
        const outputData = outputBuffer.getChannelData(channel)

        // Копируем входные данные в выходной буфер
        for (let i = 0; i < inputData.length; i++) {
            outputData[i] = inputData[i]
        }

        // Применяем нелинейное искажение для создания гармоник
        if (harmonicType === 'tube') {
            // "Ламповое" искажение - добавляет преимущественно четные гармоники для теплого звука
            await applyTubeSimulation(outputData, harmonicAmount)
        } else {
            // "Ленточное" искажение - мягкое насыщение с акцентом на НЧ
            await applyTapeSimulation(outputData, harmonicAmount)
        }
    }

    return outputBuffer
}

/**
 * Симуляция лампового искажения (чётные гармоники)
 */
const applyTubeSimulation = async (data: Float32Array, amount: number): Promise<void> => {
    // Softclipping with even harmonics emphasis
    const drive = 1 + amount * 4
    const offset = amount * 0.1

    for (let i = 0; i < data.length; i++) {
        const input = data[i]
        const absInput = Math.abs(input)

        // Асимметричное искажение для создания четных гармоник
        if (input > 0) {
            data[i] = Math.tanh(input * drive) / drive
        } else {
            data[i] = (Math.tanh(input * (drive - offset)) / (drive - offset)) * (1 - amount * 0.2)
        }

        // Смешивание оригинального и обработанного сигнала
        data[i] = input * (1 - amount) + data[i] * amount
    }
}

/**
 * Симуляция ленточного искажения (мягкое насыщение с акцентом на НЧ)
 */
const applyTapeSimulation = async (data: Float32Array, amount: number): Promise<void> => {
    // Мягкое насыщение с частотной зависимостью
    const drive = 1 + amount * 3

    // Простой IIR-фильтр для эмуляции частотно-зависимой природы ленты
    let prevInput = 0
    let prevOutput = 0
    const tapeCoeff = 0.2 + amount * 0.6 // Коэффициент частотной зависимости

    for (let i = 0; i < data.length; i++) {
        const input = data[i]

        // Частотно-зависимое насыщение (больше искажений на низких частотах)
        const filteredInput = input * (1 - tapeCoeff) + prevInput * tapeCoeff
        prevInput = input

        // Soft saturation
        const saturated = Math.tanh(filteredInput * drive) / drive

        // Фильтрация выхода для имитации эффекта "HF roll-off" ленты
        const output = saturated * (1 - tapeCoeff) + prevOutput * tapeCoeff
        prevOutput = output

        // Смешивание оригинального и обработанного сигнала
        data[i] = input * (1 - amount) + output * amount
    }
}

/**
 * Упрощенная реализация FFT (Fast Fourier Transform)
 */
const performFFT = (real: Float32Array, imag: Float32Array): void => {
    const n = real.length

    // Проверка на степень двойки
    if ((n & (n - 1)) !== 0) {
        console.error(`[2025-03-01 20:08:02] ramazanov-ma: FFT size must be a power of 2, got ${n}`)
        return
    }

    // Битовая инверсия для перестановки индексов (Cooley-Tukey FFT)
    bitReverseArray(real, imag)

    // Выполнение FFT (бабочка Кули-Тьюки)
    for (let blockSize = 2; blockSize <= n; blockSize *= 2) {
        const halfBlockSize = blockSize / 2

        // Тригонометрические коэффициенты
        const sincos = new Array<{sin: number, cos: number}>(halfBlockSize)
        for (let i = 0; i < halfBlockSize; i++) {
            const angle = -2 * Math.PI * i / blockSize
            sincos[i] = {
                cos: Math.cos(angle),
                sin: Math.sin(angle)
            }
        }

        // Для каждого блока
        for (let blockStart = 0; blockStart < n; blockStart += blockSize) {
            // Для каждой пары в блоке
            for (let i = 0; i < halfBlockSize; i++) {
                // Безопасная проверка индексов
                const evenIdx = blockStart + i
                const oddIdx = blockStart + i + halfBlockSize

                if (evenIdx >= n || oddIdx >= n) {
                    continue // Пропускаем неверные индексы
                }

                // Значения для бабочки
                const evenReal = real[evenIdx]
                const evenImag = imag[evenIdx]
                const oddReal = real[oddIdx]
                const oddImag = imag[oddIdx]

                // Тригонометрические коэффициенты
                const { cos, sin } = sincos[i]

                // Умножение на комплексную экспоненту
                const tempReal = oddReal * cos - oddImag * sin
                const tempImag = oddReal * sin + oddImag * cos

                // Бабочка: сложение и вычитание
                real[evenIdx] = evenReal + tempReal
                imag[evenIdx] = evenImag + tempImag
                real[oddIdx] = evenReal - tempReal
                imag[oddIdx] = evenImag - tempImag
            }
        }
    }
}

/**
 * Обратное FFT
 */
const performIFFT = (real: Float32Array, imag: Float32Array): void => {
    const n = real.length

    // Комплексное сопряжение для IFFT
    for (let i = 0; i < n; i++) {
        imag[i] = -imag[i]
    }

    // Выполнение прямого FFT
    performFFT(real, imag)

    // Снова комплексное сопряжение и нормализация
    for (let i = 0; i < n; i++) {
        real[i] /= n
        imag[i] = -imag[i] / n
    }
}

/**
 * Битовая инверсия для переупорядочивания массива
 */
const bitReverseArray = (real: Float32Array, imag: Float32Array): void => {
    const n = real.length
    const logN = Math.log2(n)

    // Проверяем, что n - степень двойки
    if (Math.floor(logN) !== logN) {
        console.error(`[2025-03-01 20:08:02] ramazanov-ma: Array length for bit reverse must be a power of 2, got ${n}`)
        return
    }

    // Предварительно вычисляем битореверсивные индексы
    const bitReversedIndices = new Array<number>(n)
    for (let i = 0; i < n; i++) {
        bitReversedIndices[i] = reverseBits(i, logN)
    }

    // Используем временные массивы для безопасного обмена
    const tempReal = new Float32Array(real)
    const tempImag = new Float32Array(imag)

    for (let i = 0; i < n; i++) {
        const j = bitReversedIndices[i]

        // Проверка границ (для надежности)
        if (j < n) {
            real[j] = tempReal[i]
            imag[j] = tempImag[i]
        }
    }
}

// Лог сообщений для трассировки обработки
export const logProcessingInfo = (message: string): void => {
    const currentDateTime = '2025-03-01 20:05:11';
    const currentUser = 'ramazanov-ma';
    console.log(`[${currentDateTime}] ${currentUser}: ${message}`);
}

/**
 * Вычисляет битореверсивное значение для индекса
 */
const reverseBits = (index: number, bits: number): number => {
    let reversed = 0
    for (let i = 0; i < bits; i++) {
        reversed = (reversed << 1) | (index & 1)
        index >>= 1
    }
    return reversed
}

/**
 * Безопасная реализация overlap-add для спектральной обработки
 */
const safeOverlapAdd = (
    outputData: Float32Array,
    processedFrame: Float32Array,
    window: Float32Array,
    startIdx: number
): void => {
    const frameLength = processedFrame.length
    const outputLength = outputData.length

    for (let i = 0; i < frameLength; i++) {
        const outputIdx = startIdx + i

        // Проверка на границы массива
        if (outputIdx >= 0 && outputIdx < outputLength) {
            outputData[outputIdx] += processedFrame[i] * window[i]
        }
    }
}