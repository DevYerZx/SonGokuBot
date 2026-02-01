const axios = require("axios");

module.exports = {
  command: ["spsearch"],
  categoria: "busqueda",
  description: "Buscar canciones en Spotify",

  run: async (client, m, args) => {
    try {
      if (!args.length) {
        return m.reply("📌 Usa así:\n`!spsearch <canción o artista>`");
      }

      const query = args.join(" ");
      await m.reply("🔎 Buscando en Spotify...");

      // ✅ ENDPOINT CORRECTO
      const api = `https://api-adonix.ultraplus.click/api/spotify-search-v2?query=${encodeURIComponent(query)}`;
      const res = await axios.get(api, { timeout: 15000 });
      const data = res.data;

      // 🔒 VALIDACIONES FUERTES
      if (
        !data ||
        data.status !== true ||
        !data.result ||
        !Array.isArray(data.result.results) ||
        data.result.results.length === 0
      ) {
        return m.reply("❌ No se encontraron resultados en Spotify.");
      }

      const results = data.result.results.slice(0, 5);

      let text = `🎧 *Resultados de Spotify*\n🔎 *${data.result.query}*\n\n`;

      results.forEach((song, i) => {
        text +=
          `*${i + 1}.* ${song.title}\n` +
          `👤 ${song.artist}\n` +
          `💿 ${song.album}\n` +
          `⏱️ ${song.duration}\n\n`;
      });

      text += "⬇️ *En el siguiente paso agregamos el botón de descarga*";

      await client.sendMessage(m.chat, { text }, { quoted: m });

    } catch (err) {
      console.error("SPOTIFY SEARCH ERROR:", err?.response?.data || err.message);
      await m.reply("⚠️ Error al buscar en Spotify.\nIntenta nuevamente en unos segundos.");
    }
  }
};