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

    const MODEL_ENDPOINTS = {
      "kling-3-motion-control-std": {
        name: "Kling 3 Motion Control Standard",
        endpoint: "https://api.freepik.com/v1/ai/video/kling-v3-motion-control-std",
        maxDuration: 30
      },
      "kling-3-1-motion-control": {
        name: "Kling 3.1 Motion Control",
        endpoint: "https://api.freepik.com/v1/ai/video/kling-v3-motion-control-std",
        maxDuration: 30
      },
      "kling-3-1-omni": {
        name: "Kling 3.1 Omni",
        endpoint: "https://api.freepik.com/v1/ai/reference-to-video/kling-v3-omni-std",
        maxDuration: 15
      }
    };

    const selectedModel =
      MODEL_ENDPOINTS[modelId] || MODEL_ENDPOINTS["kling-3-motion-control-std"];

    const requestedDuration = Number(duration || 5);

    if (requestedDuration > selectedModel.maxDuration) {
      return res.status(400).json({
        success: false,
        error: `Durasi maksimal untuk ${selectedModel.name} adalah ${selectedModel.maxDuration} detik.`
      });
    }

    const finalPrompt = `
Transfer the motion, body movement, dance rhythm, timing, gesture, and facial expression from the reference video to the uploaded character image.
Keep the model identity, face structure, hair, skin tone, outfit, and body proportion consistent.
Make the result realistic, cinematic, smooth, full-body, stable, natural, high quality, and social-media ready.
Avoid distorted face, extra limbs, broken hands, body glitch, flicker, blur, watermark, text, and unnatural motion.

User optional prompt:
${prompt || "Realistic full body dance video, smooth motion, stable camera, natural lighting."}
`;

    let requestBody = {};

    if (
      modelId === "kling-3-motion-control-std" ||
      modelId === "kling-3-1-motion-control"
    ) {
      requestBody = {
        image_url: imageUrl,
        video_url: videoUrl,
        prompt: finalPrompt,
        character_orientation: "video",
        cfg_scale: 0.5
      };
    } else {
      requestBody = {
        image_url: imageUrl,
        video_url: videoUrl,
        prompt: finalPrompt,
        duration: String(Math.min(requestedDuration, 15)),
        aspect_ratio: aspectRatio || "9:16",
        cfg_scale: 0.5,
        negative_prompt:
          "blur, low quality, distorted face, deformed body, extra limbs, duplicate person, broken hands, bad anatomy, flicker, watermark, text, logo, unnatural movement"
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
        model: selectedModel.name,
        detail: data
      });
    }

    return res.status(200).json({
      success: true,
      message: "Request video berhasil dikirim ke Freepik.",
      model: selectedModel.name,
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
