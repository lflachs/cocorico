import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

/**
 * POST /api/voice/transcribe
 * Transcribe audio using OpenAI Whisper API
 */
export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    const language = (formData.get("language") as string) || "en";

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    console.log("[Voice] Transcribing audio:", audioFile.name, audioFile.type, audioFile.size, "bytes", "language:", language);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Map language codes to Whisper language codes
    const whisperLang = language === "fr" ? "fr" : "en";

    // Convert the File to a proper format for OpenAI
    // OpenAI requires the file to have the correct extension
    const buffer = await audioFile.arrayBuffer();
    const blob = new Blob([buffer], { type: audioFile.type });

    // Determine the correct extension based on MIME type
    let extension = "webm";
    if (audioFile.type.includes("mp4")) extension = "mp4";
    else if (audioFile.type.includes("mpeg")) extension = "mp3";
    else if (audioFile.type.includes("wav")) extension = "wav";
    else if (audioFile.type.includes("ogg")) extension = "ogg";
    else if (audioFile.type.includes("m4a")) extension = "m4a";

    // Create a new File object with the correct extension
    const properFile = new File([blob], `audio.${extension}`, { type: audioFile.type });

    console.log("[Voice] Converted file:", properFile.name, properFile.type, properFile.size, "bytes");

    // Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: properFile,
      model: "whisper-1",
      language: whisperLang,
      response_format: "json",
    });

    console.log("[Voice] Transcription:", transcription.text);

    return NextResponse.json({
      text: transcription.text,
      success: true,
    });
  } catch (error) {
    console.error("[Voice] Transcription error:", error);
    return NextResponse.json(
      {
        error: "Failed to transcribe audio",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
