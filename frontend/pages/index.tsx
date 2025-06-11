import { useState } from 'react';

export default function Home() {
  const [language, setLanguage] = useState('ta');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [chunks, setChunks] = useState<Blob[]>([]);
  const [loading, setLoading] = useState(false);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);

    recorder.ondataavailable = (e) => setChunks((prev) => [...prev, e.data]);

    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', blob);
      formData.append('lang', language);

      setLoading(true);

      const res = await fetch('http://localhost:8000/api/translate', {
        method: 'POST',
        body: formData,
      });

      const data = await res.blob();
      const url = URL.createObjectURL(data);
      setAudioUrl(url);
      setChunks([]);
      setLoading(false);
    };

    recorder.start();
    setRecording(true);
    setMediaRecorder(recorder);
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setRecording(false);
  };

  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold mb-4">🎙️ Speech-to-Speech Translator</h1>

      <label>Select Language:</label>
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        <option value="ta">Tamil</option>
        <option value="hi">Hindi</option>
        <option value="te">Telugu</option>
      </select>

      <div className="my-4">
        <button onClick={recording ? stopRecording : startRecording}>
          {recording ? '⏹ Stop Recording' : '🎤 Start Recording'}
        </button>
      </div>

      {loading && <p>⏳ Translating...</p>}

      {audioUrl && (
        <div>
          <h3 className="mt-4">🔊 Translated Output:</h3>
          <audio controls src={audioUrl} />
        </div>
      )}
    </div>
  );
}
