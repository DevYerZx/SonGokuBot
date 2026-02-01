const axios = require("axios");

module.exports = {
  command: ["sp"],
  categoria: "spotify",
  description: "Buscar Spotify",

  run: async (client, m, args) => {
    try {
      if (!args.length) return;

      const query = args.join(" ");

      await client.reply(m.chat, "🔎 Buscando...", m, global.channelInfo);

      const api =
        `https://api-adonix.ultraplus.click/search/spotify?apikey=dvyer&query=${encodeURIComponent(query)}&type=track`;

      const res = await axios.get(api);
      const results = res.data?.result?.results;

      if (!results || !results.length) {
        return client.reply(m.chat, "❌ Sin resultados", m, global.channelInfo);
      }

      const song = results[0];

      await client.sendMessage(
        m.chat,
        {
          image: { url: song.image },
          caption:
`🎵 ${song.title}
👤 ${song.artist}
💿 ${song.album}
⏱️ ${song.duration}`,
          buttons: [
            {
              // 👇 ESTO ES LA CLAVE
              buttonId: `.spdl ${song.link}`,
              buttonText: { displayText: "⬇️ Descargar" },
              type: 1
            }
          ],
          footer: "SonGoku",
          headerType: 4
        },
        global.channelInfo
      );

    } catch {
      client.reply(m.chat, "⚠️ Error en Spotify", m, global.channelInfo);
    }
  }
};