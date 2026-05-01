import { createClient } from "@supabase/supabase-js";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
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

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({
        error: "SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum diisi di Vercel."
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const body = req.body || {};

    const email = normalizeEmail(
      findValue(body, [
        "email",
        "customer_email",
        "buyer_email",
        "payer_email",
        "user_email"
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
        "order_status"
      ]) || "paid";

    const statusText = String(statusRaw).toLowerCase();

    const isPaid =
      statusText.includes("paid") ||
      statusText.includes("success") ||
      statusText.includes("complete") ||
      statusText.includes("completed") ||
      statusText.includes("settlement") ||
      statusText === "1" ||
      statusText === "true";

    if (!email) {
      return res.status(400).json({
        error: "Email pembeli tidak ditemukan dari payload Lynk.id.",
        received: body
      });
    }

    if (!isPaid) {
      return res.status(200).json({
        ok: true,
        saved: false,
        message: "Webhook diterima, tapi status belum paid/success.",
        email,
        status: statusRaw
      });
    }

    const { error } = await supabaseAdmin.from("buyers").upsert(
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
    );

    if (error) {
      return res.status(500).json({
        error: error.message
      });
    }

    return res.status(200).json({
      ok: true,
      saved: true,
      email,
      name,
      product_name: productName
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Webhook error"
    });
  }
        }
