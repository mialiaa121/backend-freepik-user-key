const FREEPIK_BASE_URL = "https://api.freepik.com";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function getImageUrl(data) {
  return (
    data?.data?.generated?.[0]?.url ||
    data?.data?.generated?.[0] ||
    data?.data?.url ||
    data?.generated?.[0]?.url ||
    data?.generated?.[0] ||
    data?.url ||
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
      imageUrl,
      productImageUrl,
      productName,
      productBenefits,
      affiliateStyle,
      prompt,
      aspectRatio
    } = req.body || {};

    if (!freepikApiKey) {
      return res.status(400).json({
        error: "Freepik API key kosong."
      });
    }

    if (!imageUrl) {
      return res.status(400).json({
        error: "Foto model kosong."
      });
    }

    if (!productImageUrl) {
      return res.status(400).json({
        error: "Foto produk wajib untuk compose affiliate image."
      });
    }

    const finalPrompt =
      prompt?.trim() ||
      `Buat gambar UGC affiliate realistis untuk TikTok/Reels.
Gunakan wajah, rambut, outfit, dan identitas model dari foto referensi pertama.
Gunakan produk dari foto referensi kedua.
Model sedang memegang produk di dekat wajah dan menunjukkannya ke kamera.
Produk harus sama persis dengan foto produk referensi: bentuk, warna, label, tutup, dan kemasan jangan berubah.
Nama produk: ${productName || "produk pada foto referensi"}.
Manfaat produk: ${productBenefits || "produk terlihat premium dan menarik"}.
Gaya: ${affiliateStyle || "UGC Review Natural"}.
Ekspresi model ramah, percaya diri, natural seperti kreator Indonesia.
Background indoor bersih, lighting soft natural, close-up portrait vertical.
Jangan ada teks tambahan, jangan ada watermark, jangan membuat produk baru, jangan mengganti label produk, jangan menambah tangan ekstra, jangan wajah berubah.`;

    const payload = {
      prompt: finalPrompt,
      aspect_ratio: aspectRatio === "16:9" ? "widescreen_16_9" : aspectRatio === "1:1" ? "square_1_1" : "social_story_9_16",
      resolution: "1k",
      output_format: "jpeg",
      reference_images: [
        {
          url: imageUrl,
          type: "subject"
        },
        {
          url: productImageUrl,
          type: "subject"
        }
      ],
      safety_tolerance: 2
    };

    const response = await fetch(
      `${FREEPIK_BASE_URL}/v1/ai/text-to-image/flux-2-klein`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-freepik-api-key": freepikApiKey
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.message ||
          data?.error ||
          data?.detail ||
          "Gagal compose affiliate image.",
        raw: data,
        sentPayload: payload
      });
    }

    const composedImageUrl = getImageUrl(data);

    return res.status(200).json({
      ok: true,
      imageUrl: composedImageUrl,
      raw: data
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Terjadi error compose affiliate image."
    });
  }
        }
