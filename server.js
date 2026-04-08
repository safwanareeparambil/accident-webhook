import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

const WEBHOOK_KEY = process.env.WEBHOOK_KEY;
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const BLYNK_AUTH_TOKEN = process.env.BLYNK_AUTH_TOKEN;

app.get("/", (req, res) => {
  res.send("Webhook running");
});

app.get("/accident", async (req, res) => {
  try {
    const { key, vehicle, loc, text } = req.query;

    if (!key || key !== WEBHOOK_KEY) {
      return res.status(401).send("unauthorized");
    }

    const msg =
      text || `EMERGENCY! Accident detected\nVehicle: ${vehicle}\nLocation: ${loc}`;

    // Telegram
    const tgUrl =
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage` +
      `?chat_id=${CHAT_ID}&text=${encodeURIComponent(msg)}`;
    const tgResp = await fetch(tgUrl);
    const tgJson = await tgResp.json();

    // Blynk
    const blynkUrl =
      `https://blynk.cloud/external/api/logEvent` +
      `?token=${BLYNK_AUTH_TOKEN}&code=accident_detected&description=${encodeURIComponent(msg)}`;
    const bResp = await fetch(blynkUrl);
    const bText = await bResp.text();

    return res.json({
      ok: true,
      telegram_ok: tgJson.ok === true,
      blynk_response: bText
    });
  } catch (err) {
    return res.status(500).send("server error");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
