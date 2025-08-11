// /api/mailchimp.ts
// Serverless endpoint: Add subscriber to Mailchimp list + notify Telegram via /api/telegram

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, firstName, lastName } = req.body ?? {};

    if (!email) {
      return res.status(400).json({ error: "Missing email address" });
    }

    const { MAILCHIMP_API_KEY, MAILCHIMP_LIST_ID, MAILCHIMP_SERVER_PREFIX, SITE_URL } = process.env;

    if (!MAILCHIMP_API_KEY || !MAILCHIMP_LIST_ID || !MAILCHIMP_SERVER_PREFIX) {
      return res.status(500).json({ error: "Missing Mailchimp environment variables" });
    }
    if (!SITE_URL) {
      return res.status(500).json({ error: "Missing SITE_URL environment variable" });
    }

    const mailchimpUrl = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members`;

    const subscriberData = {
      email_address: email,
      status: "subscribed",
      merge_fields: {
        FNAME: firstName || "",
        LNAME: lastName || "",
      },
    };

    const mcResponse = await fetch(mailchimpUrl, {
      method: "POST",
      headers: {
        Authorization: `apikey ${MAILCHIMP_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscriberData),
    });

    const mcData = await mcResponse.json();

    if (!mcResponse.ok) {
      console.error("Mailchimp error:", mcData);
      return res.status(502).json({ error: "Failed to subscribe to Mailchimp", details: mcData });
    }

    // Gọi API /api/telegram để gửi thông báo
    const telegramMessage = `
🆕 *New Newsletter Subscriber*
📧 *Email*: ${email}
👤 *Name*: ${firstName || ""} ${lastName || ""}
    `;

    const telegramRes = await fetch(`${SITE_URL}/api/telegram`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: telegramMessage }),
    });

    const telegramData = await telegramRes.json();
    if (!telegramRes.ok || !telegramData.success) {
      console.error("Telegram API error:", telegramData);
      return res.status(500).json({
        error: "Mailchimp subscription added, but Telegram notification failed",
        details: telegramData,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Subscribed to Mailchimp & Telegram notification sent",
      mailchimp_details: mcData,
      telegram_details: telegramData,
    });
  } catch (err) {
    console.error("Internal error in /api/mailchimp:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
