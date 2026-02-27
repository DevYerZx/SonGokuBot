const axios = require("axios");

const API = "https://gawrgura-api.onrender.com/download/tiktok";
const BOT_NAME = "SonGokuBot";

// Control de descargas por usuario
const pendingTikTok = new Set();

module.exports = {
  command: ["tiktok", "tt"],
  categoria: "descarga",
  description: "Descarga TikTok automáticamente (video y audio)",

  run: async (client, m, args) => {
    const userId = m.sender;

    try {
      if (pendingTikTok.has(userId)) {
        return client.reply(
          m.chat,
          "⏳ Espera a que termine tu descarga actual antes de pedir otra.",
          m,
          global.channelInfo
        );
      }

      const url = args[0];
      if (!url || !/tiktok\.com/.test(url)) {
        return client.reply(
          m.chat,
          "❌ Enlace inválido.\nEjemplo:\n.tiktok https://www.tiktok.com/@user/video/123",
          m,
          global.channelInfo
        );
      }

      // Marcar como pendiente
      pendingTikTok.add(userId);

      // Aviso de descarga
      await client.reply(
        m.chat,
        `⏳ Descargando video y audio...\n🤖 ${BOT_NAME}`,
        m,
        global.channelInfo
      );

      // Llamar API
      const res = await axios.get(`${API}?url=${encodeURIComponent(url)}`);
      const result = res.data?.result;

      if (!result || !result.video_nowm) {
        pendingTikTok.delete(userId);
        return client.reply(m.chat, "❌ Error al obtener video TikTok.", m, global.channelInfo);
      }

      // Descargar video
      const videoResp = await axios.get(result.video_nowm, { responseType: "arraybuffer" });
      const videoBuffer = Buffer.from(videoResp.data);

      // Descargar audio
      const audioResp = await axios.get(result.audio_url, { responseType: "arraybuffer" });
      const audioBuffer = Buffer.from(audioResp.data);

      // Enviar video
      await client.sendMessage(
        m.chat,
        { video: videoBuffer, mimetype: "video/mp4", fileName: "tiktok.mp4" },
        { quoted: m, ...global.channelInfo }
      );

      // Enviar audio
      await client.sendMessage(
        m.chat,
        { audio: audioBuffer, mimetype: "audio/mpeg", fileName: "tiktok.mp3", ptt: false },
        { quoted: m, ...global.channelInfo }
      );

      // Quitar bloqueo
      pendingTikTok.delete(userId);

    } catch (err) {
      console.error("TIKTOK DOWNLOAD ERROR:", err);
      pendingTikTok.delete(userId);
      client.reply(
        m.chat,
        "❌ Error al descargar TikTok.",
        m,
        global.channelInfo
      );
    }
  }
};
