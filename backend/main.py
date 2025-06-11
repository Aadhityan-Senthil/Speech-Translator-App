from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import tempfile, os
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import whisper
from gtts import gTTS

app = FastAPI()

# Allow CORS (Frontend to call backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# Load models
whisper_model = whisper.load_model("base")
tokenizer = AutoTokenizer.from_pretrained("ai4bharat/indictrans2-en-indic-1B", use_fast=False)
translator = AutoModelForSeq2SeqLM.from_pretrained("ai4bharat/indictrans2-en-indic-1B")

@app.post("/api/translate")
async def translate(audio: UploadFile = File(...), lang: str = Form(...)):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp_audio:
        tmp_audio.write(await audio.read())
        tmp_audio_path = tmp_audio.name

    result = whisper_model.transcribe(tmp_audio_path)
    english_text = result["text"]

    # Translate
    input_text = f"__indic__{lang} {english_text}"
    inputs = tokenizer(input_text, return_tensors="pt")
    translated = translator.generate(**inputs)
    translated_text = tokenizer.decode(translated[0], skip_special_tokens=True)

    # TTS
    tts = gTTS(translated_text, lang=lang)
    output_path = "output.mp3"
    tts.save(output_path)

    os.remove(tmp_audio_path)
    return FileResponse(output_path, media_type="audio/mpeg", filename="translated.mp3")
