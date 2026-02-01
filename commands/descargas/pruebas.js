const axios = require("axios");

module.exports = {
  command: ["spsearch", "spotify"],
  categoria: "busqueda",
  description: "Buscar canciones en Spotify",

  run: async (client, m, args) => {
    try {
      if (!args.length) {
        return m.reply("📌 Usa:\n`!spsearch <canción o artista>`");
      }

      const query = args.join(" ");
      await m.reply("🔎 Buscando en Spotify...");

      const url = `https://api-adonix.ultraplus.click/search/spotify?apikey=dvyer&query=${encodeURIComponent(query)}&type=track`;

      const res = await axios.get(url);
      const data = res.data;

      // ✅ VALIDACIÓN REAL
      if (!data.status || !data.result || !data.result.results.length) {
        return m.reply("❌ No se encontraron resultados.");
      }

      const results = data.result.results.slice(0, 5);

      let text = `🎧 *Spotify – Resultados*\n`;
      text += `🔎 *${data.result.query}*\n\n`;

      results.forEach((song, i) => {
        text +=
          `*${i + 1}.* ${song.title}\n` +
          `👤 ${song.artist}\n` +
          `💿 ${song.album}\n` +
          `⏱️ ${song.duration}\n` +
          `🔥 Popularidad: ${song.popularity}\n\n`;
      });

      await client.sendMessage(m.chat, { text }, { quoted: m });

    } catch (e) {
      console.error(e);
      m.reply("⚠️ Error al buscar en Spotify.");
    }
  }
};