const axios = require("axios");

module.exports = {
  command: ["spsearch"],
  categoria: "spotify",
  description: "Buscar una canción en Spotify",

  run: async (client, m, args) => {
    try {
      if (!args.length) {
        return m.reply("📌 Usa:\n`!spsearch <canción o artista>`");
      }

      const query = args.join(" ");
      await m.reply("🔎 Buscando en Spotify...");

      const api = `https://api-adonix.ultraplus.click/search/spotify?apikey=dvyer&query=${encodeURIComponent(query)}&type=track`;
      const res = await axios.get(api);
      const data = res.data;

      if (!data.status || !data.result || !data.result.results.length) {
        return m.reply("❌ No se encontró ningún resultado.");
      }

      // 🎯 SOLO 1 RESULTADO
      const song = data.result.results[0];

      const caption =
        `🎧 *${song.title}*\n` +
        `👤 *Artista:* ${song.artist}\n` +
        `💿 *Álbum:* ${song.album}\n` +
        `⏱️ *Duración:* ${song.duration}\n` +
        `🔥 *Popularidad:* ${song.popularity}\n`;

      // 🔘 BOTÓN
      const buttons = [
        {
          buttonId: `spdl|${song.link}`,
          buttonText: { displayText: "⬇️ Descargar MP3" },
          type: 1
        }
      ];

      await client.sendMessage(
        m.chat,
        {
          image: { url: song.image },
          caption,
          buttons,
          footer: "Spotify Downloader",
          headerType: 4
        },
        { quoted: m }
      );

    } catch (err) {
      console.error(err);
      m.reply("⚠️ Error al buscar en Spotify.");
    }
  }
};