const axios = require("axios");

// 🔍 API
const SEARCH_API = "https://gawrgura-api.onrender.com/search/tiktok";

// 🤖 BOT
const BOT_NAME = "SonGokuBot";

// ⏳ COOLDOWN
const cooldowns = new Map();
const COOLDOWN_TIME = 30 * 1000; // 15 segundos

module.exports = {
  command: ["tiktoksearch", "tiktokbuscar", "ttks"],
  categoria: "busqueda",
  description: "Busca videos virales de TikTok",

  run: async (client, m, args) => {
    const userId = m.sender;

    // 🔒 Verificar cooldown
    if (cooldowns.has(userId)) {
      const expire = cooldowns.get(userId);
      const remaining = expire - Date.now();

      if (remaining > 0) {
        return client.reply(
          m.chat,
          `⏳ Espera *${Math.ceil(remaining / 1000)} segundos* antes de volver a usar este comando.`,
          m,
          global.channelInfo
        );
      }
    }

    // ✅ Activar cooldown
    cooldowns.set(userId, Date.now() + COOLDOWN_TIME);

    try {
      const query = args.join(" ").trim();

      if (!query) {
        cooldowns.delete(userId);
        return client.reply(
          m.chat,
          "❌ Usa:\n.tiktoksearch <palabra>\nEjemplo:\n.tiktoksearch goku",
          m,
          global.channelInfo
        );
      }

      // ⏳ Mensaje UX
      await client.reply(
        m.chat,
        `🔍 *Buscando en TikTok...*\n📌 ${query}\n🤖 ${BOT_NAME}`,
        m,
        global.channelInfo
      );

      // 📡 API
      const res = await axios.get(
        `${SEARCH_API}?q=${encodeURIComponent(query)}`,
        { timeout: 60000 }
      );

      const results = res.data?.result;
      if (!Array.isArray(results) || results.length === 0) {
        cooldowns.delete(userId);
        return client.reply(
          m.chat,
          "❌ No se encontraron resultados.",
          m,
          global.channelInfo
        );
      }

      // Limitar a 5 resultados
      const videos = results.slice(0, 5);

      await client.reply(
        m.chat,
        `🎬 *${videos.length} resultados encontrados*`,
        m,
        global.channelInfo
      );

      // Enviar videos uno por uno
      let i = 1;
      for (const v of videos) {
        const caption =
          `╭━━〔 🎵 TikTok #${i} 🎵 〕━━╮\n` +
          `┃ 👤 Autor: ${v.author?.nickname || "Desconocido"}\n` +
          `┃ ❤️ Likes: ${v.digg_count || 0} | 👁 Vistas: ${v.play_count || 0}\n` +
          `┃ ⏱ Duración: ${v.duration || 0}s\n` +
          `┃ 🔗 Link: ${v.url || "Sin link"}\n` +
          `╰━━━━━━━━━━━━━━━━━━━━╯\n` +
          `🤖 ${BOT_NAME}`;

        await client.sendMessage(
          m.chat,
          {
            video: { url: v.play },
            caption
          },
          { quoted: m, ...global.channelInfo }
        );

        i++;
      }

    } catch (err) {
      console.error("TIKTOK SEARCH ERROR:", err.response?.data || err.message);
      cooldowns.delete(userId);

      await client.reply(
        m.chat,
        "❌ Error al buscar videos de TikTok.",
        m,
        global.channelInfo
      );
    }
  }
};

