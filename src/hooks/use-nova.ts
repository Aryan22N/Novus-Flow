"use client";

import { useState, useRef, useCallback } from "react";
import { speak }                         from "~/lib/nova-speak";

export type NovaState = "idle" | "recording" | "transcribing" | "thinking" | "speaking" | "confirming";

export interface PendingAction {
  tool:  string;
  args:  Record<string, unknown>;
  draft: string;
}

export function useNova() {
  const [state,         setState]         = useState<NovaState>("idle");
  const [transcript,    setTranscript]    = useState("");
  const [responseText,  setResponseText]  = useState("");
  const [pendingAction, setPendingAction] = useState<any | null>(null);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks        = useRef<Blob[]>([]);
  const recognition   = useRef<any>(null);

  const startRecording = useCallback(async () => {
    setTranscript("");
    
    // Live transcription fallback
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const r = new SpeechRecognition();
        r.continuous = true;
        r.interimResults = true;
        r.onresult = (e: any) => {
          let text = "";
          for (let i = 0; i < e.results.length; i++) {
            text += e.results[i][0].transcript;
          }
          setTranscript(text);
        };
        recognition.current = r;
        try { r.start(); } catch (err) {}
      }
    }

    const stream   = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
    chunks.current = [];
    recorder.ondataavailable = (e) => chunks.current.push(e.data);
    recorder.onstop          = handleRecordingStop;
    mediaRecorder.current    = recorder;
    recorder.start();
    setState("recording");
  }, []);

  const stopRecording = useCallback(() => {
    if (recognition.current) {
      recognition.current.stop();
      recognition.current = null;
    }
    mediaRecorder.current?.stop();
    mediaRecorder.current?.stream.getTracks().forEach((t) => t.stop());
  }, []);

  const handleRecordingStop = useCallback(async () => {
    setState("transcribing");
    let text = transcript;
    
    if (chunks.current.length > 0) {
      const formData = new FormData();
      formData.append("audio", new Blob(chunks.current, { type: "audio/webm" }));
      try {
        const res = await fetch("/api/nova/transcribe", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          if (data.transcript) text = data.transcript;
        }
      } catch (err) {
        console.error("Transcription error:", err);
      }
    }

    setTranscript(text);
    if (!text.trim()) {
      setState("idle");
      return;
    }

    setState("thinking");
    await runAgent(text);
  }, [transcript]);

  const runAgent = async (transcript: string, confirmed?: boolean) => {
    const body: Record<string, unknown> = { transcript };
    if (confirmed !== undefined) body.confirmed = confirmed;

    try {
      const res = await fetch("/api/nova", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });

      if (!res.ok && res.headers.get("content-type")?.includes("text/html")) {
        throw new Error("Server returned HTML instead of JSON");
      }

      const data = await res.json() as {
        response:            string;
        confirmationPending?: boolean;
        pendingAction?:       PendingAction;
        pendingActions?:      any[];
      };

      setResponseText(data.response || "Something went wrong.");

      if (data.confirmationPending && (data.pendingAction || data.pendingActions)) {
        setPendingAction(data.pendingActions || (data.pendingAction ? [data.pendingAction] : null));
        setState("confirming");
        await speak(data.response);
        return;
      }

      setState("speaking");
      await speak(data.response || "I encountered an error.");
      setState("idle");
    } catch (err) {
      console.error("Agent error:", err);
      setResponseText("I'm sorry, I couldn't reach the server.");
      setState("speaking");
      await speak("I'm sorry, I couldn't reach the server.");
      setState("idle");
    }
  };

  const confirm = async (yes: boolean, modifiedActions?: any[]) => {
    setPendingAction(null);
    setState("thinking");

    try {
      const res = await fetch("/api/nova", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ transcript: "", confirmed: yes, modifiedActions }),
      });
      const data = await res.json();
      setResponseText(data.response || "");
      setState("speaking");
      await speak(data.response || "");
      setState("idle");
    } catch (err) {
      console.error(err);
      setState("idle");
    }
  };

  return {
    state,
    transcript,
    responseText,
    pendingAction,
    setPendingAction,
    startRecording,
    stopRecording,
    confirm,
    setState
  };
}
