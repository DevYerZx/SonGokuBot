const axios = require("axios");

/* ======================
   🔍 API
====================== */
const SEARCH_API = "https://gawrgura-api.onrender.com/search/tiktok";

/* ======================
   🤖 BOT
====================== */
const BOT_NAME = "SonGokuBot";

/* ======================
   ⏳ COOLDOWN
====================== */
const cooldowns = new Map();
const COOLDOWN_TIME = 30 * 1000; // 30 segundos

const setCooldown = (id) => {
  cooldowns.set(id, Date.now() + COOLDOWN_TIME);
  setTimeout(() => cooldowns.delete(id), COOLDOWN_TIME);
};

const checkCooldown = (id) => {
  if (!cooldowns.has(id)) return 0;
  const remaining = cooldowns.get(id) - Date.now();
  return remaining > 0 ? remaining : 0;
};

module.exports = {
  command: ["tiktoksearch", "tiktokbuscar", "ttks"],
  categoria: "busqueda",
  description: "Busca videos virales de TikTok",

  run: async (client, m, args) => {
    const userId = m.sender;

    /* ======================
       🔒 COOLDOWN
    ====================== */
    const remaining = checkCooldown(userId);
    if (remaining > 0) {
      return client.reply(
        m.chat,
        `⏳ Espera *${Math.ceil(remaining / 1000)}s* antes de volver a usar este comando.`,
        m,
        global.channelInfo
      );
    }

    const query = args.join(" ").trim();
    if (!query) {
      return client.reply(
        m.chat,
        "❌ Uso correcto:\n.tiktoksearch <palabra>\nEjemplo:\n.tiktoksearch goku",
        m,
        global.channelInfo
      );
    }

    setCooldown(userId);

    try {
      /* ======================
         ⏳ MENSAJE UX
      ====================== */
      await client.reply(
        m.chat,
        `🔍 *Buscando en TikTok...*\n📌 *${query}*\n🤖 ${BOT_NAME}`,
        m,
        global.channelInfo
      );

      /* ======================
         📡 API
      ====================== */
      const { data } = await axios.get(
        `${SEARCH_API}?q=${encodeURIComponent(query)}`,
        { timeout: 20000 }
      );

      const results = Array.isArray(data?.result) ? data.result : [];
      if (!results.length) {
        cooldowns.delete(userId);
        return client.reply(
          m.chat,
          "❌ No se encontraron resultados.",
          m,
          global.channelInfo
        );
      }

      /* ======================
         🎬 RESULTADOS
      ====================== */
      const videos = results.slice(0, 5);
      let index = 1;

      for (const v of videos) {
        if (!v?.play) continue;

        const caption =
`╭━━〔 🎵 TikTok #${index} 🎵 〕━━╮
┃ 👤 Autor: ${v.author?.nickname || "Desconocido"}
┃ ❤️ Likes: ${v.digg_count || 0}
┃ 👁 Vistas: ${v.play_count || 0}
┃ ⏱ Duración: ${v.duration || 0}s
┃ 🔗 Link: ${v.url || "No disponible"}
╰━━━━━━━━━━━━━━━━━━━━╯
🤖 ${BOT_NAME}`;

        await client.sendMessage(
          m.chat,
          {
            video: { url: v.play },
            caption
          },
          { quoted: m, ...global.channelInfo }
        );

        index++;
      }

    } catch (err) {
      console.error("❌ TIKTOK SEARCH ERROR:", err?.message || err);
      cooldowns.delete(userId);

      return client.reply(
        m.chat,
        "❌ Error al buscar videos de TikTok.\nIntenta nuevamente más tarde.",
        m,
        global.channelInfo
      );
    }
  }
};
