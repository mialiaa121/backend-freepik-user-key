const FREEPIK_BASE_URL = "https://api.freepik.com";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function getStatusEndpoint(modelId, videoMode) {
  if (videoMode === "affiliate" && modelId === "veed-fabric-1-0-fast") {
    return "/v1/ai/lip-sync/veed-fabric-1-0-fast";
  }

  if (videoMode === "affiliate" && modelId === "veed-fabric-1-0") {
    return "/v1/ai/lip-sync/veed-fabric-1-0";
  }

  if (modelId === "kling-3-1-motion-control" || modelId === "kling-3-0-motion-control") {
    return "/v1/ai/video/kling-v3-motion-control-pro";
  }

  if (modelId === "kling-2-6-motion-control") {
    return "/v1/ai/image-to-video/kling-v2-6";
  }

  if (modelId === "kling-3-1-omni") {
    return "/v1/ai/video/kling-v3-omni";
  }

  if (modelId === "kling-3-0") {
    return "/v1/ai/video/kling-v3";
  }

  if (modelId === "kling-2-6") {
    return "/v1/ai/image-to-video/kling-v2-6";
  }

  if (modelId === "seedance-1-5-pro") {
    return "/v1/ai/video/seedance-1-5-pro-480p";
  }

  if (modelId === "seedance-1-0-pro") {
    return "/v1/ai/video/seedance-1-0-pro";
  }

  if (modelId === "seedance-1-0-fast") {
    return "/v1/ai/video/seedance-1-0-fast";
  }

  if (modelId === "seedance-1-0-lite") {
    return "/v1/ai/video/seedance-1-0-lite";
  }

  if (modelId === "wan-2-6") {
    return "/v1/ai/text-to-video/wan-v2-6-720p";
  }

  if (modelId === "wan-2-2") {
    return "/v1/ai/video/wan-v2-2";
  }

  if (videoMode === "cloning") {
    return "/v1/ai/video/kling-v3-motion-control-pro";
  }

  return "/v1/ai/video/kling-v3";
}

function getVideoUrl(data) {
  return (
    data?.data?.video_url ||
    data?.data?.url ||
    data?.data?.generated?.[0]?.url ||
    data?.data?.generated?.[0] ||
    data?.data?.output?.url ||
    data?.data?.output ||
    data?.video_url ||
    data?.url ||
    data?.generated?.[0]?.url ||
    data?.generated?.[0] ||
    data?.output?.url ||
    data?.output ||
    null
  );
}

function getStatus(data) {
  return (
    data?.data?.status ||
    data?.status ||
    data?.result?.status ||
    "UNKNOWN"
  );
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed. Gunakan POST."
    });
  }

  try {
    const {
      freepikApiKey,
      taskId,
      modelId,
      videoMode,
      statusEndpoint
    } = req.body || {};

    if (!freepikApiKey) {
      return res.status(400).json({
        error: "Freepik API key kosong."
      });
    }

    if (!taskId) {
      return res.status(400).json({
        error: "Task ID kosong."
      });
    }

    const endpoint = statusEndpoint || getStatusEndpoint(modelId, videoMode);

    const response = await fetch(`${FREEPIK_BASE_URL}${endpoint}/${taskId}`, {
      method: "GET",
      headers: {
        "x-freepik-api-key": freepikApiKey
      }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.message ||
          data?.error ||
          data?.detail ||
          "Gagal cek status Freepik.",
        endpoint,
        raw: data
      });
    }

    const videoUrl = getVideoUrl(data);
    const status = getStatus(data);

    return res.status(200).json({
      ok: true,
      status,
      videoUrl,
      endpoint,
      raw: data
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Terjadi error di backend status."
    });
  }
}
