const FREEPIK_BASE_URL = "https://api.freepik.com";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function cleanDuration(duration, fallback = 5) {
  const number = Number(duration);
  if (!Number.isFinite(number)) return fallback;
  return number;
}

function normalizeAspectRatio(aspectRatio) {
  if (!aspectRatio) return "9:16";
  return aspectRatio;
}

function getVideoEndpoint({ videoMode, modelId, hasVideoReference }) {
  if (videoMode === "affiliate" && modelId === "veed-fabric-1-0-fast") {
    return {
      type: "lip-sync",
      createEndpoint: "/v1/ai/lip-sync/veed-fabric-1-0-fast",
      statusEndpoint: "/v1/ai/lip-sync/veed-fabric-1-0-fast"
    };
  }

  if (videoMode === "affiliate" && modelId === "veed-fabric-1-0") {
    return {
      type: "lip-sync",
      createEndpoint: "/v1/ai/lip-sync/veed-fabric-1-0",
      statusEndpoint: "/v1/ai/lip-sync/veed-fabric-1-0"
    };
  }

  if (modelId === "kling-3-1-motion-control" || modelId === "kling-3-0-motion-control") {
    return {
      type: "motion-control",
      createEndpoint: "/v1/ai/video/kling-v3-motion-control-pro",
      statusEndpoint: "/v1/ai/video/kling-v3-motion-control-pro"
    };
  }

  if (modelId === "kling-2-6-motion-control") {
    return {
      type: "motion-control",
      createEndpoint: "/v1/ai/video/kling-v2-6-motion-control-pro",
      statusEndpoint: "/v1/ai/image-to-video/kling-v2-6"
    };
  }

  if (modelId === "kling-3-1-omni") {
    if (hasVideoReference) {
      return {
        type: "reference-to-video",
        createEndpoint: "/v1/ai/reference-to-video/kling-v3-omni-pro",
        statusEndpoint: "/v1/ai/reference-to-video/kling-v3-omni"
      };
    }

    return {
      type: "image-to-video",
      createEndpoint: "/v1/ai/video/kling-v3-omni-pro",
      statusEndpoint: "/v1/ai/video/kling-v3-omni"
    };
  }

  if (modelId === "kling-3-0") {
    return {
      type: "image-to-video",
      createEndpoint: "/v1/ai/video/kling-v3-pro",
      statusEndpoint: "/v1/ai/video/kling-v3"
    };
  }

  if (modelId === "kling-2-6") {
    return {
      type: "image-to-video",
      createEndpoint: "/v1/ai/image-to-video/kling-v2-6-pro",
      statusEndpoint: "/v1/ai/image-to-video/kling-v2-6"
    };
  }

  if (modelId === "seedance-1-5-pro") {
    return {
      type: "image-to-video",
      createEndpoint: "/v1/ai/video/seedance-1-5-pro-480p",
      statusEndpoint: "/v1/ai/video/seedance-1-5-pro-480p"
    };
  }

  if (modelId === "seedance-1-0-pro") {
    return {
      type: "image-to-video",
      createEndpoint: "/v1/ai/video/seedance-1-0-pro",
      statusEndpoint: "/v1/ai/video/seedance-1-0-pro"
    };
  }

  if (modelId === "seedance-1-0-fast") {
    return {
      type: "image-to-video",
      createEndpoint: "/v1/ai/video/seedance-1-0-fast",
      statusEndpoint: "/v1/ai/video/seedance-1-0-fast"
    };
  }

  if (modelId === "seedance-1-0-lite") {
    return {
      type: "image-to-video",
      createEndpoint: "/v1/ai/video/seedance-1-0-lite",
      statusEndpoint: "/v1/ai/video/seedance-1-0-lite"
    };
  }

  if (modelId === "wan-2-6") {
    return {
      type: "text-to-video",
      createEndpoint: "/v1/ai/text-to-video/wan-v2-6-720p",
      statusEndpoint: "/v1/ai/text-to-video/wan-v2-6-720p"
    };
  }

  if (modelId === "wan-2-2") {
    return {
      type: "image-to-video",
      createEndpoint: "/v1/ai/video/wan-v2-2",
      statusEndpoint: "/v1/ai/video/wan-v2-2"
    };
  }

  return {
    type: hasVideoReference ? "motion-control" : "image-to-video",
    createEndpoint: hasVideoReference
      ? "/v1/ai/video/kling-v3-motion-control-pro"
      : "/v1/ai/video/kling-v3-pro",
    statusEndpoint: hasVideoReference
      ? "/v1/ai/video/kling-v3-motion-control-pro"
      : "/v1/ai/video/kling-v3"
  };
}

function buildPrompt({
  videoMode,
  prompt,
  productName,
  productBenefits,
  ctaText,
  affiliateStyle
}) {
  if (prompt && prompt.trim()) return prompt.trim();

  if (videoMode === "cloning") {
    return "Transfer the motion from the reference video to the character image. Preserve the person's face, identity, outfit, body proportions, and realistic movement. Avoid extra phones, extra hands, duplicated objects, distorted fingers, blur, or changing the original character.";
  }

  if (videoMode === "timelapse") {
    return "Create a realistic cinematic timelapse transformation video. Show the object gradually changing step by step with smooth progression, realistic lighting, detailed construction process, workers, tools, dust, materials, and professional camera movement.";
  }

  if (videoMode === "affiliate") {
    return `Create a realistic affiliate UGC video in the style: ${affiliateStyle || "UGC Review Natural"}.
Product: ${productName || "the product"}.
Main benefits: ${productBenefits || "show the product benefits naturally"}.
CTA: ${ctaText || "try it now"}.
Make it natural, realistic, persuasive, social-media ready, with clear product focus, authentic expression, clean lighting, and premium UGC look.`;
  }

  return "Create a realistic high quality AI video.";
}

function getTaskId(data) {
  return (
    data?.data?.task_id ||
    data?.task_id ||
    data?.result?.task_id ||
    data?.result?.data?.task_id ||
    data?.id ||
    data?.data?.id ||
    null
  );
}

function getDirectVideoUrl(data) {
  return (
    data?.data?.video_url ||
    data?.data?.url ||
    data?.data?.generated?.[0]?.url ||
    data?.data?.generated?.[0] ||
    data?.video_url ||
    data?.url ||
    data?.generated?.[0]?.url ||
    data?.generated?.[0] ||
    null
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
      videoUrl,
      imageUrl,
      productImageUrl,
      audioUrl,
      prompt,
      productName,
      productBenefits,
      ctaText,
      affiliateStyle,
      videoMode,
      modelId,
      duration,
      aspectRatio,
      resolution
    } = req.body || {};

    if (!freepikApiKey) {
      return res.status(400).json({
        error: "Freepik API key kosong."
      });
    }

    if (!imageUrl && videoMode !== "timelapse") {
      return res.status(400).json({
        error: "Foto model / objek kosong."
      });
    }

    if (videoMode === "cloning" && !videoUrl) {
      return res.status(400).json({
        error: "Video referensi wajib untuk mode cloning."
      });
    }

    if (videoMode === "affiliate" && modelId?.includes("veed-fabric") && !audioUrl) {
      return res.status(400).json({
        error: "Veed Fabric wajib memakai audio voice over."
      });
    }

    const selectedModel = getVideoEndpoint({
      videoMode,
      modelId,
      hasVideoReference: Boolean(videoUrl)
    });

    const finalPrompt = buildPrompt({
      videoMode,
      prompt,
      productName,
      productBenefits,
      ctaText,
      affiliateStyle
    });

    let payload = {};

    if (selectedModel.type === "motion-control") {
      payload = {
        video_url: videoUrl,
        image_url: imageUrl,
        prompt: finalPrompt,
        duration: String(cleanDuration(duration, 5)),
        aspect_ratio: normalizeAspectRatio(aspectRatio),
        cfg_scale: 0.5,
        negative_prompt:
          "extra phone, extra hands, duplicate object, distorted fingers, blur, low quality, watermark, text artifacts, face distortion"
      };
    }

    if (selectedModel.type === "reference-to-video") {
      payload = {
        video_url: videoUrl,
        image_url: imageUrl,
        prompt: `${finalPrompt} Use @Video1 as the motion and style reference.`,
        duration: String(cleanDuration(duration, 5)),
        aspect_ratio: normalizeAspectRatio(aspectRatio),
        cfg_scale: 0.5,
        negative_prompt:
          "extra objects, duplicate phone, distorted hands, blur, low quality, watermark"
      };
    }

    if (selectedModel.type === "image-to-video") {
      payload = {
        image_url: imageUrl || productImageUrl,
        prompt: finalPrompt,
        duration: String(cleanDuration(duration, 5)),
        aspect_ratio: normalizeAspectRatio(aspectRatio),
        cfg_scale: 0.5,
        negative_prompt:
          "blur, low quality, watermark, text artifacts, distorted face, extra hands, duplicate objects"
      };
    }

    if (selectedModel.type === "text-to-video") {
      payload = {
        prompt: finalPrompt,
        duration: String(cleanDuration(duration, 5)),
        aspect_ratio: normalizeAspectRatio(aspectRatio),
        cfg_scale: 0.5,
        negative_prompt:
          "blur, low quality, watermark, text artifacts, distorted face, extra hands, duplicate objects"
      };
    }

    if (selectedModel.type === "lip-sync") {
      payload = {
        image_url: imageUrl,
        audio_url: audioUrl,
        resolution: resolution || "720p"
      };
    }

    const response = await fetch(`${FREEPIK_BASE_URL}${selectedModel.createEndpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-freepik-api-key": freepikApiKey
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.message ||
          data?.error ||
          data?.detail ||
          "Freepik generate gagal.",
        endpoint: selectedModel.createEndpoint,
        modelId,
        videoMode,
        raw: data,
        sentPayload: payload
      });
    }

    const taskId = getTaskId(data);
    const directVideoUrl = getDirectVideoUrl(data);

    return res.status(200).json({
      ok: true,
      task_id: taskId,
      videoUrl: directVideoUrl,
      endpoint: selectedModel.createEndpoint,
      statusEndpoint: selectedModel.statusEndpoint,
      modelType: selectedModel.type,
      modelId,
      videoMode,
      raw: data
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Terjadi error di backend generate."
    });
  }
                                      }
