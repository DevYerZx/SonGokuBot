const axios = require("axios");

module.exports = {
  command: ["spotify"],
  categoria: "descarga",
  description: "Buscar música en Spotify con botón de descarga",

  run: async (client, m, args) => {
    try {
      if (!args.length) {
        return m.reply("📌 Usa así:\n`!spsearch <canción o artista>`");
      }

      const query = args.join(" ");
      m.reply("🔎 Buscando en Spotify...");

      // 🔍 API SPOTIFY SEARCH (ADO)
      const api = `https://api-adonix.ultraplus.click/api/spotify-search?query=${encodeURIComponent(query)}`;
      const { data } = await axios.get(api);

      if (!data.status || !data.result?.results?.length) {
        return m.reply("❌ No se encontraron resultados.");
      }

      const results = data.result.results.slice(0, 5);

      // Mensaje principal
      let text = `🎧 *Resultados de Spotify*\n🔎 *${query}*\n\n`;
      let buttons = [];

      results.forEach((song, i) => {
        text +=
          `*${i + 1}.* ${song.title}\n` +
          `👤 ${song.artist}\n` +
          `💿 ${song.album}\n` +
          `⏱️ ${song.duration}\n\n`;

        // botón por canción
        buttons.push({
          buttonId: `spdl|${song.title} ${song.artist}`,
          buttonText: { displayText: `⬇️ Descargar ${i + 1}` },
          type: 1
        });
      });

      await client.sendMessage(
        m.chat,
        {
          text: text.trim(),
          footer: "Spotify Downloader • DvYerBot",
          buttons,
          headerType: 1
        },
        { quoted: m }
      );

    } catch (e) {
      console.error(e);
      m.reply("⚠️ Error al buscar en Spotify.");
    }
  }
};