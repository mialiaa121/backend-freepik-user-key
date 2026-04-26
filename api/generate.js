export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Gunakan method POST."
    });
  }

  try {
    const {
      freepikApiKey,
      videoUrl,
      imageUrl,
      prompt,
      modelId,
      duration,
      aspectRatio
    } = req.body;

    if (!freepikApiKey) {
      return res.status(400).json({
        success: false,
        error: "API key Freepik wajib diisi."
      });
    }

    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        error: "Video referensi wajib diupload."
      });
    }

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: "Foto model wajib diupload."
      });
    }

    if (!modelId) {
      return res.status(400).json({
        success: false,
        error: "Model AI wajib dipilih."
      });
    }

    function fallbackMotion(displayName) {
      return {
        name: displayName,
        mode: "motion-control-fallback",
        endpoint: "https://api.freepik.com/v1/ai/video/kling-v3-motion-control-std",
        maxDuration: 30
      };
    }

    const MODEL_ROUTES = {
      // KLING - motion transfer utama
      "kling-3-1-motion-control": {
        name: "Kling 3.1 Motion Control",
        mode: "motion-control",
        endpoint: "https://api.freepik.com/v1/ai/video/kling-v3-motion-control-std",
        maxDuration: 30
      },

      "kling-3-motion-control-std": {
        name: "Kling 3 Motion Control Standard",
        mode: "motion-control",
        endpoint: "https://api.freepik.com/v1/ai/video/kling-v3-motion-control-std",
        maxDuration: 30
      },

      "kling-2-6-motion-control": {
        name: "Kling 2.6 Motion Control",
        mode: "motion-control",
        endpoint: "https://api.freepik.com/v1/ai/video/kling-v2-6-motion-control-std",
        maxDuration: 30
      },

      "kling-3-1-omni": {
        name: "Kling 3.1 Omni",
        mode: "reference-to-video",
        endpoint: "https://api.freepik.com/v1/ai/reference-to-video/kling-v3-omni-std",
        maxDuration: 15
      },

      "kling-3-0": {
        name: "Kling 3.0",
        mode: "motion-control-fallback",
        endpoint: "https://api.freepik.com/v1/ai/video/kling-v3-motion-control-std",
        maxDuration: 30
      },

      "kling-2-6": fallbackMotion("Kling 2.6"),
      "kling-o1": fallbackMotion("Kling O1"),
      "kling-2-5": fallbackMotion("Kling 2.5"),
      "kling-2-1": fallbackMotion("Kling 2.1"),
      "kling-2-1-master": fallbackMotion("Kling 2.1 Master"),

      // SEEDANCE - aktif di UI, fallback ke Kling Motion Control
      "seedance-2-0": fallbackMotion("Seedance 2.0"),
      "seedance-2-0-fast": fallbackMotion("Seedance 2.0 Fast"),
      "seedance-1-5-pro": fallbackMotion("Seedance 1.5 Pro"),
      "seedance-1-0-pro": fallbackMotion("Seedance 1.0 Pro"),
      "seedance-1-0-fast": fallbackMotion("Seedance 1.0 Fast"),
      "seedance-1-0-lite": fallbackMotion("Seedance 1.0 Lite"),

      // GROK
      "grok": fallbackMotion("Grok"),

      // GOOGLE VEO
      "veo-3-1": fallbackMotion("Google Veo 3.1"),
      "veo-3-1-fast": fallbackMotion("Google Veo 3.1 Fast"),
      "veo-3-1-lite": fallbackMotion("Google Veo 3.1 Lite"),
      "veo-3": fallbackMotion("Google Veo 3"),
      "veo-3-fast": fallbackMotion("Google Veo 3 Fast"),
      "veo-2": fallbackMotion("Google Veo 2"),

      // OMNI HUMAN
      "omni-human-1-5": fallbackMotion("Omni Human 1.5"),

      // RUNWAY
      "runway-gen-4-5": fallbackMotion("Runway Gen 4.5"),
      "runway-gen-4": fallbackMotion("Runway Gen 4"),
      "runway-act-two": fallbackMotion("Runway Act Two"),

      // VEED FABRIC
      "veed-fabric-1-0": fallbackMotion("Veed Fabric 1.0"),
      "veed-fabric-1-0-fast": fallbackMotion("Veed Fabric 1.0 Fast"),

      // HAILUO
      "hailuo-2-3": fallbackMotion("MiniMax Hailuo 2.3"),
      "hailuo-2-3-fast": fallbackMotion("MiniMax Hailuo 2.3 Fast"),
      "hailuo-02": fallbackMotion("MiniMax Hailuo 02"),
      "hailuo-live-illustrations": fallbackMotion("MiniMax Hailuo Live Illustrations"),

      // PIXVERSE
      "pixverse-6": fallbackMotion("PixVerse 6"),
      "pixverse-5-5": fallbackMotion("PixVerse 5.5"),

      // SORA
      "sora-2-pro": fallbackMotion("Sora 2 Pro"),
      "sora-2": fallbackMotion("Sora 2"),

      // WAN
      "wan-2-7": fallbackMotion("Wan 2.7"),
      "wan-2-6": fallbackMotion("Wan 2.6"),
      "wan-2-5": fallbackMotion("Wan 2.5"),
      "wan-2-2": fallbackMotion("Wan 2.2"),
      "wan-2-2-anime-move": fallbackMotion("Wan 2.2 Anime Move"),

      // LTX
      "ltx-2-pro": fallbackMotion("LTX 2 Pro"),
      "ltx-2-fast": fallbackMotion("LTX 2 Fast")
    };

    const selectedModel = MODEL_ROUTES[modelId];

    if (!selectedModel) {
      return res.status(400).json({
        success: false,
        error: "Model AI tidak dikenali.",
        receivedModelId: modelId
      });
    }

    const MODE_MAX_DURATION = {
  cloning: 30,
  timelapse: 90,
  affiliate: 300
};

const MODE_DEFAULT_DURATION = {
  cloning: 5,
  timelapse: 15,
  affiliate: 30
};

const requestedDuration = Number(
  duration || MODE_DEFAULT_DURATION[selectedVideoMode] || 5
);

const modeMaxDuration = MODE_MAX_DURATION[selectedVideoMode] || 30;

// Untuk keamanan API, tetap batasi sesuai model jika model punya batas lebih kecil.
const allowedMaxDuration = Math.min(
  modeMaxDuration,
  selectedModel.maxDuration || modeMaxDuration
);

if (requestedDuration > allowedMaxDuration) {
  return res.status(400).json({
    success: false,
    error: `Durasi maksimal untuk mode ${selectedVideoMode} dengan model ${selectedModel.name} adalah ${allowedMaxDuration} detik.`,
    requestedDuration,
    modeMaxDuration,
    modelMaxDuration: selectedModel.maxDuration
  });
}

    const qualityPrompt = `
Create a realistic high quality AI video.
The uploaded image is the main character/model.
The reference video is the motion source.
Transfer the body movement, dance rhythm, timing, gesture, pose, and expression from the reference video to the uploaded model image.
Keep the face identity, skin tone, hair, outfit, body proportion, and character consistency from the uploaded image.
Use realistic lighting, smooth motion, stable camera, natural body movement, full body framing, cinematic quality, clean details.
Avoid distorted face, extra limbs, duplicate body, broken hands, bad anatomy, flicker, blur, watermark, text, logo, body glitch, and unnatural movement.

Selected model label:
${selectedModel.name}

User optional prompt:
${prompt || "Realistic full body dance video, smooth motion, stable camera, natural lighting, social-media ready."}
`;

    let requestBody = {};

    if (
      selectedModel.mode === "motion-control" ||
      selectedModel.mode === "motion-control-fallback"
    ) {
      requestBody = {
        image_url: imageUrl,
        video_url: videoUrl,
        prompt: qualityPrompt,
        character_orientation: "video",
        cfg_scale: 0.5
      };
    }

    if (selectedModel.mode === "reference-to-video") {
      requestBody = {
        video_url: videoUrl,
        image_url: imageUrl,
        prompt: `
Use @Video1 as the main motion reference.
Create a new realistic video where the uploaded model image follows the movement from @Video1.
${qualityPrompt}
`,
        duration: String(Math.min(requestedDuration, selectedModel.maxDuration)),
        aspect_ratio: aspectRatio || "9:16",
        cfg_scale: 0.5,
        negative_prompt:
          "blur, low quality, distorted face, deformed body, extra limbs, duplicate person, broken hands, bad anatomy, flicker, watermark, text, logo, unnatural movement, body glitch"
      };
    }

    const freepikResponse = await fetch(selectedModel.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-freepik-api-key": freepikApiKey
      },
      body: JSON.stringify(requestBody)
    });

    const data = await freepikResponse.json();

    if (!freepikResponse.ok) {
      return res.status(freepikResponse.status).json({
        success: false,
        error: "Request ke Freepik gagal.",
        selectedModel: selectedModel.name,
        mode: selectedModel.mode,
        endpoint: selectedModel.endpoint,
        detail: data
      });
    }

    return res.status(200).json({
      success: true,
      message: "Request video berhasil dikirim ke Freepik.",
      selectedModel: selectedModel.name,
      mode: selectedModel.mode,
      note:
        selectedModel.mode === "motion-control-fallback"
          ? "Model ini aktif di UI, tetapi backend menjalankan motion transfer melalui Kling Motion Control agar fitur video referensi tetap bekerja."
          : "Model dijalankan sesuai route backend.",
      result: data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Terjadi error di backend.",
      detail: error.message
    });
  }
    }
