"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface RecordedAudio {
  blob: Blob;
  dataUrl: string;
  mediaType: string;
  filename: string;
  durationSeconds: number;
}

export function formatRecordingTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch {
        // ignore
      }
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingSeconds(0);
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
        throw new Error("Gravação de áudio não suportada neste dispositivo.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let mimeType = "audio/webm;codecs=opus";
      if (typeof MediaRecorder !== "undefined") {
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          if (MediaRecorder.isTypeSupported("audio/webm")) {
            mimeType = "audio/webm";
          } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
            mimeType = "audio/mp4";
          } else {
            mimeType = "";
          }
        }
      }

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      const msg =
        (err as Error)?.message ||
        "Não foi possível acessar o microfone. Verifique as permissões.";
      setError(msg);
      cleanup();
      throw err;
    }
  }, [cleanup]);

  const stopRecording = useCallback(async (): Promise<RecordedAudio | null> => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      cleanup();
      return null;
    }

    const duration = recordingSeconds;

    return new Promise((resolve) => {
      recorder.onstop = async () => {
        try {
          const mimeType = recorder.mimeType || "audio/webm";
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result as string;
            const extension = mimeType.includes("mp4") ? "mp4" : "webm";
            const filename = `voz-${Date.now()}.${extension}`;

            cleanup();
            resolve({
              blob: audioBlob,
              dataUrl,
              mediaType: mimeType.split(";")[0],
              filename,
              durationSeconds: duration,
            });
          };
          reader.readAsDataURL(audioBlob);
        } catch {
          cleanup();
          resolve(null);
        }
      };

      recorder.stop();
    });
  }, [cleanup, recordingSeconds]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    cleanup();
  }, [cleanup]);

  return {
    isRecording,
    recordingSeconds,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
