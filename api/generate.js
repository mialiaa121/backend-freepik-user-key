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
    const { freepikApiKey, prompt } = req.body;

    if (!freepikApiKey) {
      return res.status(400).json({
        success: false,
        error: "API key Freepik wajib diisi."
      });
    }

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: "Prompt wajib diisi."
      });
    }

    const FREEPIK_ENDPOINT = "https://api.freepik.com/v1/ai/text-to-image";

    const freepikResponse = await fetch(FREEPIK_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-freepik-api-key": freepikApiKey
      },
      body: JSON.stringify({
        prompt: prompt
      })
    });

    const data = await freepikResponse.json();

    if (!freepikResponse.ok) {
      return res.status(freepikResponse.status).json({
        success: false,
        error: "Request ke Freepik gagal.",
        detail: data
      });
    }

    return res.status(200).json({
      success: true,
      message: "Berhasil request ke Freepik.",
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
