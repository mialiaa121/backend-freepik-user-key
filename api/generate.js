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
        error: "Pilih model AI dulu."
      });
    }

    const MODEL_ENDPOINTS = {
      "kling-3-omni-std": {
        name: "Kling 3.1 Omni",
        endpoint: "https://api.freepik.com/v1/ai/reference-to-video/kling-v3-omni-std",
        maxDuration: 15
      }
    };

    const selectedModel = MODEL_ENDPOINTS[modelId];

    if (!selectedModel) {
      return res.status(400).json({
        success: false,
        error: "Model ini belum disambungkan ke endpoint Freepik.",
        note: "Saat ini backend baru aktif untuk Kling 3.1 Omni. Model lain harus ditambahkan endpoint resminya dulu."
      });
    }

    const requestedDuration = Number(duration || 5);

    if (requestedDuration > selectedModel.maxDuration) {
      return res.status(400).json({
        success: false,
        error: `Durasi maksimal untuk model ini adalah ${selectedModel.maxDuration} detik.`
      });
    }

    const finalPrompt = `
Use @Video1 as the main motion reference.
Create a realistic AI video where the person from the uploaded image follows the dance movement from @Video1.
Keep the face identity, body proportions, outfit details, and character consistency from the uploaded image.
Use full body framing, stable camera, realistic lighting, smooth human motion, natural dance rhythm.
Avoid face distortion, extra limbs, duplicate body, broken hands, flickering, warped anatomy, text, watermark, and blur.

User optional prompt:
${prompt || "Make it realistic, clean, social-media ready, cinematic, and natural."}
`;

    const requestBody = {
      video_url: videoUrl,
      image_url: imageUrl,
      prompt: finalPrompt,
      duration: String(requestedDuration),
      aspect_ratio: aspectRatio || "9:16",
      cfg_scale: 0.5,
      negative_prompt:
        "blur, low quality, distorted face, deformed body, extra limbs, duplicate person, broken hands, bad anatomy, flicker, watermark, text, logo, unnatural movement"
    };

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
