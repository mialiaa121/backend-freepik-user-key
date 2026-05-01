import { createClient } from "@supabase/supabase-js";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function safeJsonParse(value) {
  if (typeof value !== "string") return value || {};

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      message: "Webhook aktif.",
      hasSupabaseUrl: Boolean(process.env.SUPABASE_URL),
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      supabaseUrl: process.env.SUPABASE_URL || null
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      return res.status(500).json({
        error: "SUPABASE_URL belum diisi di Vercel."
      });
    }

    if (!serviceRoleKey) {
      return res.status(500).json({
        error: "SUPABASE_SERVICE_ROLE_KEY belum diisi di Vercel."
      });
    }

    const body = safeJsonParse(req.body);

    const messageData = body?.data?.message_data || {};
    const customer = messageData?.customer || {};
    const firstItem = Array.isArray(messageData?.items)
      ? messageData.items[0]
      : null;

    const email = normalizeEmail(customer?.email);
    const name = customer?.name || null;
    const phone = customer?.phone || null;
    const productName = firstItem?.title || null;

    if (!email) {
      return res.status(400).json({
        error: "Email pembeli tidak ditemukan.",
        received: body
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabaseAdmin
      .from("buyers")
      .upsert(
        {
          email,
          name,
          phone,
          product_name: productName,
          status: "paid",
          raw_data: body
        },
        {
          onConflict: "email"
        }
      )
      .select();

    if (error) {
      return res.status(500).json({
        error: "Gagal menyimpan ke Supabase.",
        supabaseError: error.message,
        details: error
      });
    }

    return res.status(200).json({
      ok: true,
      saved: true,
      email,
      name,
      phone,
      product_name: productName,
      data
    });
  } catch (error) {
    return res.status(500).json({
      error: "Webhook error.",
      message: error?.message || String(error)
    });
  }
      }
