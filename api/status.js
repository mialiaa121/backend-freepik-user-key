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
    const { freepikApiKey, taskId, modelId } = req.body;

    if (!freepikApiKey) {
      return res.status(400).json({
        success: false,
        error: "API key Freepik wajib diisi."
      });
    }

    if (!taskId) {
      return res.status(400).json({
        success: false,
        error: "taskId wajib diisi."
      });
    }

    const STATUS_ROUTES = {
      "kling-3-1-motion-control": "https://api.freepik.com/v1/ai/video/kling-v3-motion-control-std/{taskId}",
      "kling-3-motion-control-std": "https://api.freepik.com/v1/ai/video/kling-v3-motion-control-std/{taskId}",
      "kling-2-6-motion-control": "https://api.freepik.com/v1/ai/video/kling-v2-6-motion-control-std/{taskId}",
      "kling-3-1-omni": "https://api.freepik.com/v1/ai/reference-to-video/kling-v3-omni-std/{taskId}"
    };

    const template =
      STATUS_ROUTES[modelId] ||
      "https://api.freepik.com/v1/ai/video/kling-v3-motion-control-std/{taskId}";

    const statusUrl = template.replace("{taskId}", taskId);

    const freepikResponse = await fetch(statusUrl, {
      method: "GET",
      headers: {
        "x-freepik-api-key": freepikApiKey
      }
    });

    const data = await freepikResponse.json();

    if (!freepikResponse.ok) {
      return res.status(freepikResponse.status).json({
        success: false,
        error: "Gagal cek status Freepik.",
        statusUrl,
        detail: data
      });
    }

    const status =
      data?.data?.status ||
      data?.status ||
      data?.result?.status ||
      "UNKNOWN";

    const generated =
      data?.data?.generated ||
      data?.generated ||
      data?.result?.data?.generated ||
      data?.result?.generated ||
      [];

    const videoUrl =
      data?.data?.generated?.[0]?.url ||
      data?.data?.generated?.[0] ||
      data?.generated?.[0]?.url ||
      data?.generated?.[0] ||
      data?.result?.data?.generated?.[0]?.url ||
      data?.result?.data?.generated?.[0] ||
      data?.result?.generated?.[0]?.url ||
      data?.result?.generated?.[0] ||
      data?.data?.video_url ||
      data?.video_url ||
      data?.url ||
      null;

    return res.status(200).json({
      success: true,
      status,
      generated,
      videoUrl,
      taskId,
      raw: data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Terjadi error saat cek status.",
      detail: error.message
    });
  }
}
