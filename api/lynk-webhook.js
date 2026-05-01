import { createClient } from "@supabase/supabase-js";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function findValue(obj, keys) {
  for (const key of keys) {
    if (obj?.[key]) return obj[key];
  }

  for (const value of Object.values(obj || {})) {
    if (value && typeof value === "object") {
      const found = findValue(value, keys);
      if (found) return found;
    }
  }

  return null;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      message: "Webhook aktif. Gunakan POST dari Lynk.id.",
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
        error: "SUPABASE_URL belum diisi di Vercel Environment Variables."
      });
    }

    if (!serviceRoleKey) {
      return res.status(500).json({
        error:
          "SUPABASE_SERVICE_ROLE_KEY belum diisi di Vercel Environment Variables."
      });
    }

    const body = req.body || {};

    const email = normalizeEmail(
      findValue(body, [
        "email",
        "customer_email",
        "buyer_email",
        "payer_email",
        "user_email",
        "contact_email"
      ])
    );

    const name =
      findValue(body, [
        "name",
        "customer_name",
        "buyer_name",
        "full_name",
        "username"
      ]) || null;

    const phone =
      findValue(body, [
        "phone",
        "phone_number",
        "whatsapp",
        "wa",
        "customer_phone",
        "buyer_phone"
      ]) || null;

    const productName =
      findValue(body, [
        "product_name",
        "product",
        "item_name",
        "title",
        "package_name"
      ]) || null;

    const statusRaw =
      findValue(body, [
        "status",
        "payment_status",
        "transaction_status",
        "order_status",
        "event",
        "event_name"
      ]) || "paid";

    if (!email) {
      return res.status(400).json({
        error: "Email pembeli tidak ditemukan dari payload Lynk.id.",
        receivedKeys: Object.keys(body || {}),
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
        error: "Supabase insert/upsert gagal.",
        supabaseError: error.message,
        details: error
      });
    }

    return res.status(200).json({
      ok: true,
      saved: true,
      email,
      name,
      product_name: productName,
      status: statusRaw,
      data
    });
  } catch (error) {
    return res.status(500).json({
      error: "Webhook error.",
      message: error?.message || String(error)
    });
  }
}
