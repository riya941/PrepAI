import { useRef, useState } from "react";

function MicRecorder({ onStop }) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef("");
  const startedAtRef = useRef(null);

  const startRecording = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition is not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    finalTranscriptRef.current = "";
    startedAtRef.current = Date.now();

    recognition.onstart = () => {
      setRecording(true);
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let final = finalTranscriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const resultTranscript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          final += `${resultTranscript} `;
        } else {
          interimTranscript += resultTranscript;
        }
      }

      finalTranscriptRef.current = final;
      setTranscript(final + interimTranscript);
    };

    recognition.onend = () => {
      setRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();

    const finalAnswer = finalTranscriptRef.current.trim();
    const durationSeconds = startedAtRef.current
      ? (Date.now() - startedAtRef.current) / 1000
      : 0;

    if (!finalAnswer) {
      alert("Please speak something");
      return;
    }

    onStop({
      answer: finalAnswer,
      durationSeconds,
    });

    finalTranscriptRef.current = "";
    startedAtRef.current = null;
    setTranscript("");
  };

  return (
    <div className="mt-4 text-center">
      {transcript && (
        <p className="mb-2 max-h-24 overflow-y-auto text-sm text-gray-300">
          <b>You said:</b> {transcript}
        </p>
      )}

      {!recording ? (
        <button
          onClick={startRecording}
          className="rounded-full bg-green-600 px-6 py-3 text-white hover:bg-green-700"
        >
          Start Speaking
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="rounded-full bg-red-600 px-6 py-3 text-white hover:bg-red-700"
        >
          Stop
        </button>
      )}
    </div>
  );
}

export default MicRecorder;
