const axios = require("axios");

// 🔍 API
const SEARCH_API = "https://gawrgura-api.onrender.com/search/tiktok";

// 🤖 BOT
const BOT_NAME = "SonGokuBot";

module.exports = {
  command: ["tiktoksearch", "tiktokbuscar", "ttks"],
  categoria: "busqueda",
  description: "Busca videos virales de TikTok",

  run: async (client, m, args) => {
    try {
      const query = args.join(" ").trim();

      if (!query) {
        return client.reply(
          m.chat,
          "❌ Usa:\n.tiktoksearch <palabra>\nEjemplo:\n.tiktoksearch goku",
          m,
          global.channelInfo
        );
      }

      // ⏳ UX
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
        return client.reply(
          m.chat,
          "❌ No se encontraron resultados.",
          m,
          global.channelInfo
        );
      }

      const videos = results.slice(0, 5); // limitar a 5 resultados

      // ✅ Crear elementos para lista
      const sections = [
        {
          title: `Resultados de TikTok para: ${query}`,
          rows: videos.map((v, i) => ({
            title: `${i + 1}. ${v.author?.nickname || "Desconocido"}`,
            description: `❤️ ${v.digg_count || 0} | 👁 ${v.play_count || 0} | ⏱ ${v.duration || 0}s`,
            rowId: `.tiktokplay ${v.url}` // comando para reproducir video si quieres
          }))
        }
      ];

      const listMessage = {
        text: `🎬 *Resultados de TikTok* - ${BOT_NAME}`,
        footer: `SonGokuBot • DVYER`,
        title: "📱 Catálogo de TikToks",
        buttonText: "Ver videos",
        sections
      };

      await client.sendMessage(m.chat, listMessage, { quoted: m });

    } catch (err) {
      console.error("TIKTOK SEARCH ERROR:", err.response?.data || err.message);
      await client.reply(
        m.chat,
        "❌ Error al buscar videos de TikTok.",
        m,
        global.channelInfo
      );
    }
  }
};

