import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import {
    startTranscribe,
    TranscribeError,
    type TranscribeEndpoint,
    type TranscribeErrorCode,
    type TranscribeSession,
    type TranscribeState,
} from '../../../../client/index';

interface UseMicSessionParams {
    config: TranscribeEndpoint | undefined;
    textareaRef: RefObject<HTMLTextAreaElement | null>;
    inputValue: string;
    setInputValue: (value: string) => void;
}

export interface MicError {
    code: TranscribeErrorCode;
    message: string;
}

export interface MicSession {
    available: boolean;
    recording: boolean;
    state: TranscribeState;
    error: MicError | null;
    toggle: () => Promise<void>;
    stop: () => Promise<void>;
    clearBuffer: () => void;
    dismissError: () => void;
    subscribeRms: (listener: () => void) => () => void;
    getRms: () => number;
}

function appendWithSpace(current: string, text: string): string {
    if (!current) return text;
    return /\s$/.test(current) ? `${current}${text}` : `${current} ${text}`;
}

const FRIENDLY_MESSAGES: Record<TranscribeErrorCode, string> = {
    'permission-denied': 'Microphone access was denied. Allow it in your browser settings to use voice input.',
    'no-device': 'No microphone was found on this device.',
    'not-supported': 'Voice input is not supported in this browser.',
    'request-timeout': 'Transcription timed out. Check your connection and try again.',
    'transcribe-failed': 'Transcription failed. Try again.',
    'unknown': 'Voice input failed unexpectedly.',
};

export function useMicSession({
    config,
    textareaRef,
    inputValue,
    setInputValue,
}: UseMicSessionParams): MicSession {
    const [recording, setRecording] = useState(false);
    const [state, setState] = useState<TranscribeState>('idle');
    const [error, setError] = useState<MicError | null>(null);
    const [busy, setBusy] = useState(false);

    const sessionRef = useRef<TranscribeSession | null>(null);
    const cleanedUpRef = useRef(false);
    const configRef = useRef(config);
    const inputValueRef = useRef(inputValue);

    useEffect(() => { configRef.current = config; }, [config]);
    useEffect(() => { inputValueRef.current = inputValue; }, [inputValue]);

    // External store for RMS so only subscribers re-render on each tick.
    const rmsRef = useRef(0);
    const rmsListenersRef = useRef<Set<() => void>>(new Set());
    const getRms = useCallback(() => rmsRef.current, []);
    const subscribeRms = useCallback((listener: () => void) => {
        rmsListenersRef.current.add(listener);
        return () => { rmsListenersRef.current.delete(listener); };
    }, []);
    const publishRms = useCallback((value: number) => {
        rmsRef.current = value;
        rmsListenersRef.current.forEach((l) => l());
    }, []);

    const insertSegment = useCallback((text: string) => {
        const ta = textareaRef.current;
        const current = inputValueRef.current;

        if (!ta) {
            const next = appendWithSpace(current, text);
            inputValueRef.current = next;
            setInputValue(next);
            return;
        }

        const start = ta.selectionStart ?? current.length;
        const end = ta.selectionEnd ?? current.length;

        let next: string;
        let cursorPos: number;
        if (start !== end) {
            next = current.slice(0, start) + text + current.slice(end);
            cursorPos = start + text.length;
        } else if (start < current.length) {
            next = current.slice(0, start) + text + current.slice(start);
            cursorPos = start + text.length;
        } else {
            next = appendWithSpace(current, text);
            cursorPos = next.length;
        }

        inputValueRef.current = next;
        setInputValue(next);

        queueMicrotask(() => {
            const node = textareaRef.current;
            if (!node) return;
            try {
                node.selectionStart = cursorPos;
                node.selectionEnd = cursorPos;
            } catch {
                /* ignore */
            }
        });
    }, [setInputValue, textareaRef]);

    // Sync the ref immediately so in-flight onSegment callbacks after submit see ''
    const clearBuffer = useCallback(() => {
        inputValueRef.current = '';
    }, []);

    const reportError = useCallback((e: TranscribeError) => {
        setError({ code: e.code, message: FRIENDLY_MESSAGES[e.code] ?? e.message });
    }, []);

    const stop = useCallback(async () => {
        const session = sessionRef.current;
        sessionRef.current = null;
        setRecording(false);
        setState('idle');
        publishRms(0);
        if (session) await session.stop();
    }, [publishRms]);

    const toggle = useCallback(async () => {
        if (busy) return;
        setBusy(true);
        setError(null);
        try {
            if (sessionRef.current) {
                await stop();
                return;
            }
            const cfg = configRef.current;
            if (!cfg) return;

            const session = await startTranscribe({
                endpoint: cfg.endpoint,
                headers: cfg.headers,
                model: cfg.model,
                language: cfg.language,
                prompt: cfg.prompt,
                responseFormat: cfg.responseFormat,
                silenceThreshold: cfg.silenceThreshold,
                silenceAutoFlushMs: cfg.silenceAutoFlushMs,
                minUtteranceMs: cfg.minUtteranceMs,
                requestTimeoutMs: cfg.requestTimeoutMs,
                request: cfg.request,
                onSegment: insertSegment,
                onState: setState,
                onRms: publishRms,
                onError: reportError,
            });

            // Component may have unmounted while getUserMedia permission dialog was open
            if (cleanedUpRef.current) {
                void session.stop();
                return;
            }

            sessionRef.current = session;
            setRecording(true);
        } catch (e) {
            const err = e instanceof TranscribeError
                ? e
                : new TranscribeError('unknown', e instanceof Error ? e.message : String(e));
            reportError(err);
            setRecording(false);
            setState('idle');
        } finally {
            setBusy(false);
        }
    }, [busy, insertSegment, publishRms, reportError, stop]);

    const dismissError = useCallback(() => setError(null), []);

    useEffect(() => {
        // Reset on (re-)mount — React Strict Mode runs mount→cleanup→mount in dev,
        // which would otherwise leave this ref permanently true and break toggle()
        cleanedUpRef.current = false;
        return () => {
            cleanedUpRef.current = true;
            const session = sessionRef.current;
            sessionRef.current = null;
            if (session) void session.stop();
        };
    }, []);

    return {
        available: !!config,
        recording,
        state,
        error,
        toggle,
        stop,
        clearBuffer,
        dismissError,
        subscribeRms,
        getRms,
    };
}
