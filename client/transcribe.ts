export type TranscribeState =
    | 'idle'
    | 'starting'
    | 'listening'
    | 'speaking'
    | 'processing'
    | 'stopped';

export interface TranscribeRequestExtras {
    formFields?: Record<string, string>;
    fileFieldName?: string;
}

export type TranscribeErrorCode =
    | 'permission-denied'
    | 'no-device'
    | 'not-supported'
    | 'request-timeout'
    | 'transcribe-failed'
    | 'unknown';

export class TranscribeError extends Error {
    readonly code: TranscribeErrorCode;
    constructor(code: TranscribeErrorCode, message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = 'TranscribeError';
        this.code = code;
    }
}

export interface TranscribeConfig {
    endpoint: string;
    headers?: Record<string, string>;
    model?: string;
    language?: string;
    prompt?: string;
    responseFormat?: 'json' | 'verbose_json' | 'text';
    silenceThreshold?: number;
    silenceAutoFlushMs?: number;
    minUtteranceMs?: number;
    requestTimeoutMs?: number;
    request?: TranscribeRequestExtras;
    onSegment: (text: string) => void;
    onState?: (state: TranscribeState) => void;
    onRms?: (rms: number) => void;
    onError?: (err: TranscribeError) => void;
}

export interface TranscribeSession {
    stop: () => Promise<void>;
}

const DEFAULTS = {
    silenceThreshold: 0.04,
    silenceAutoFlushMs: 900,
    minUtteranceMs: 350,
    model: 'whisper-1',
    responseFormat: 'json' as const,
    fileFieldName: 'file',
    recorderTimesliceMs: 250,
    vadPollIntervalMs: 60,
    fftSize: 1024,
    enterSpeechHoldPolls: 2,
    requestTimeoutMs: 30000,
} as const;

const PREFERRED_MIME_TYPES = [
    ['audio/webm;codecs=opus', 'webm'],
    ['audio/webm', 'webm'],
    ['audio/ogg;codecs=opus', 'ogg'],
    ['audio/mp4', 'mp4'],
] as const;

const WHISPER_NOISE_TAGS_RE =
    /\[(?:BLANK_AUDIO|MUSIC|SILENCE|INAUDIBLE|NOISE|APPLAUSE|LAUGHTER|SOUND|BACKGROUND)\]/gi;

function pickAudioFormat(): { mimeType?: string; ext: string } {
    if (typeof MediaRecorder !== 'undefined') {
        for (const [mime, ext] of PREFERRED_MIME_TYPES) {
            if (MediaRecorder.isTypeSupported(mime)) return { mimeType: mime, ext };
        }
    }
    return { ext: 'webm' };
}

function sanitizeWhisperText(raw: string): string {
    return raw
        .replace(/<\|[^|>]*\|>/g, '')
        .replace(WHISPER_NOISE_TAGS_RE, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function toTranscribeError(e: unknown, fallbackCode: TranscribeErrorCode): TranscribeError {
    if (e instanceof TranscribeError) return e;
    if (e instanceof DOMException) {
        if (e.name === 'NotAllowedError' || e.name === 'SecurityError') {
            return new TranscribeError('permission-denied', 'Microphone access denied.', { cause: e });
        }
        if (e.name === 'NotFoundError' || e.name === 'OverconstrainedError') {
            return new TranscribeError('no-device', 'No microphone available.', { cause: e });
        }
        if (e.name === 'NotSupportedError') {
            return new TranscribeError('not-supported', 'Audio capture is not supported in this browser.', { cause: e });
        }
        // AbortSignal.timeout() raises TimeoutError; a manually aborted controller raises AbortError
        if (e.name === 'TimeoutError' || e.name === 'AbortError') {
            return new TranscribeError('request-timeout', 'Transcription request timed out.', { cause: e });
        }
    }
    const message = e instanceof Error ? e.message : String(e);
    return new TranscribeError(fallbackCode, message, { cause: e instanceof Error ? e : undefined });
}

function computeRms(timeBuf: Uint8Array<ArrayBuffer>): number {
    let sumSq = 0;
    for (let i = 0; i < timeBuf.length; i++) {
        const v = (timeBuf[i] - 128) / 128;
        sumSq += v * v;
    }
    return Math.sqrt(sumSq / timeBuf.length);
}

export async function startTranscribe(cfg: TranscribeConfig): Promise<TranscribeSession> {
    const silenceAutoFlushMs = cfg.silenceAutoFlushMs ?? DEFAULTS.silenceAutoFlushMs;
    const minUtteranceMs = cfg.minUtteranceMs ?? DEFAULTS.minUtteranceMs;
    const model = cfg.model ?? DEFAULTS.model;
    const responseFormat = cfg.responseFormat ?? DEFAULTS.responseFormat;
    const fileFieldName = cfg.request?.fileFieldName ?? DEFAULTS.fileFieldName;
    const enterRms = cfg.silenceThreshold ?? DEFAULTS.silenceThreshold;
    const exitRms = enterRms * 0.6;

    const emitState = (state: TranscribeState) => cfg.onState?.(state);
    const emitError = (e: unknown, fallbackCode: TranscribeErrorCode = 'unknown') => {
        const err = toTranscribeError(e, fallbackCode);
        cfg.onError?.(err);
    };

    emitState('starting');

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw new TranscribeError('not-supported', 'Audio capture is not supported in this environment.');
    }
    if (typeof MediaRecorder === 'undefined') {
        throw new TranscribeError('not-supported', 'MediaRecorder is not supported in this environment.');
    }

    let stream: MediaStream;
    try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
        throw toTranscribeError(e, 'unknown');
    }
    const { mimeType, ext } = pickAudioFormat();
    const recorderOpts: MediaRecorderOptions = mimeType ? { mimeType } : {};

    let audioCtx: AudioContext;
    let analyser: AnalyserNode;
    let timeBuf: Uint8Array<ArrayBuffer>;
    let recorder: MediaRecorder;

    try {
        audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = DEFAULTS.fftSize;
        analyser.smoothingTimeConstant = 0.5;
        source.connect(analyser);
        timeBuf = new Uint8Array(new ArrayBuffer(analyser.fftSize));
    } catch (e) {
        stream.getTracks().forEach((t) => t.stop());
        throw e;
    }

    let chunks: Blob[] = [];
    let utteranceStartMs = 0;
    let speaking = false;
    let consecutiveSpeechPolls = 0;
    let silenceSinceMs: number | null = null;
    let stopped = false;
    let processing = false;

    function attachRecorderHandlers(r: MediaRecorder) {
        r.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) chunks.push(event.data);
        };
        r.onerror = (event) => {
            const err = (event as unknown as { error?: Error }).error;
            emitError(err ?? new Error('MediaRecorder error'));
        };
    }

    function startRecorder(): void {
        recorder = new MediaRecorder(stream, recorderOpts);
        attachRecorderHandlers(recorder);
        chunks = [];
        utteranceStartMs = performance.now();
        recorder.start(DEFAULTS.recorderTimesliceMs);
    }

    function stopRecorder(): Promise<Blob[]> {
        if (recorder.state === 'inactive') return Promise.resolve(chunks);
        return new Promise((resolve) => {
            recorder.addEventListener('stop', () => resolve(chunks), { once: true });
            try { recorder.stop(); } catch { resolve(chunks); }
        });
    }

    try {
        startRecorder();
    } catch (e) {
        stream.getTracks().forEach((t) => t.stop());
        try { await audioCtx.close(); } catch { /* ignore */ }
        throw e;
    }
    emitState('listening');

    async function postTranscription(blob: Blob): Promise<void> {
        const form = new FormData();
        form.append(fileFieldName, blob, `utterance.${ext}`);
        form.append('model', model);
        form.append('response_format', responseFormat);
        if (cfg.language) form.append('language', cfg.language);
        if (cfg.prompt) form.append('prompt', cfg.prompt);
        if (cfg.request?.formFields) {
            for (const [k, v] of Object.entries(cfg.request.formFields)) form.append(k, v);
        }

        const timeoutMs = cfg.requestTimeoutMs ?? DEFAULTS.requestTimeoutMs;
        const canUseAbortSignalTimeout =
            typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function';
        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        let controller: AbortController | undefined;
        const signal = canUseAbortSignalTimeout
            ? AbortSignal.timeout(timeoutMs)
            : (() => {
                  controller = new AbortController();
                  timeoutId = setTimeout(() => controller?.abort(), timeoutMs);
                  return controller.signal;
              })();

        let res: Response;
        try {
            res = await fetch(cfg.endpoint, {
                method: 'POST',
                headers: cfg.headers,
                body: form,
                signal,
            });
        } finally {
            if (timeoutId !== undefined) clearTimeout(timeoutId);
        }
        if (!res.ok) {
            const body = await res.text().catch(() => '');
            throw new TranscribeError(
                'transcribe-failed',
                `Transcribe ${res.status}: ${body}`.slice(0, 500),
            );
        }

        const payload =
            responseFormat === 'text'
                ? await res.text()
                : ((await res.json().catch(() => null)) as { text?: unknown } | null);

        const raw =
            typeof payload === 'string'
                ? payload
                : typeof payload?.text === 'string' ? payload.text : '';

        const text = sanitizeWhisperText(raw);
        if (text) cfg.onSegment(text);
    }

    async function flushUtterance(): Promise<void> {
        if (processing || stopped) return;
        processing = true;
        emitState('processing');

        try {
            const finalChunks = await stopRecorder();
            const tooShort = performance.now() - utteranceStartMs < minUtteranceMs;
            if (finalChunks.length > 0 && !tooShort && !stopped) {
                const blob = new Blob(finalChunks, { type: mimeType ?? 'audio/webm' });
                try { await postTranscription(blob); } catch (e) { if (!stopped) emitError(e, 'transcribe-failed'); }
            }
        } finally {
            processing = false;
            speaking = false;
            consecutiveSpeechPolls = 0;
            silenceSinceMs = null;
            if (!stopped) {
                try {
                    startRecorder();
                    emitState('listening');
                } catch (e) {
                    emitError(e);
                }
            }
        }
    }

    const vadInterval = window.setInterval(() => {
        if (stopped || processing) return;

        analyser.getByteTimeDomainData(timeBuf);
        const rms = computeRms(timeBuf);
        cfg.onRms?.(rms);

        if (speaking) {
            if (rms < exitRms) {
                if (silenceSinceMs === null) silenceSinceMs = performance.now();
                if (performance.now() - silenceSinceMs > silenceAutoFlushMs) {
                    speaking = false;
                    consecutiveSpeechPolls = 0;
                    void flushUtterance();
                }
            } else {
                silenceSinceMs = null;
            }
        } else if (rms > enterRms) {
            consecutiveSpeechPolls++;
            if (consecutiveSpeechPolls >= DEFAULTS.enterSpeechHoldPolls) {
                speaking = true;
                silenceSinceMs = null;
                emitState('speaking');
            }
        } else {
            consecutiveSpeechPolls = 0;
        }
    }, DEFAULTS.vadPollIntervalMs);

    async function stop(): Promise<void> {
        if (stopped) return;
        stopped = true;
        window.clearInterval(vadInterval);

        await stopRecorder();
        stream.getTracks().forEach((t) => t.stop());
        try { await audioCtx.close(); } catch { /* ignore */ }
        emitState('stopped');
    }

    return { stop };
}
