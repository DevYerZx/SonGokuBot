const axios = require("axios");

module.exports = {
  command: ["spotify"],
  categoria: "descarga",

  run: async (client, m, args) => {
    try {
      if (!args.length) return;

      const query = args.join(" ");

      await client.sendMessage(
        m.chat,
        { text: "🔎 Buscando..." },
        { quoted: m, ...global.channelInfo }
      );

      const api = `https://api-adonix.ultraplus.click/search/spotify?apikey=dvyer&query=${encodeURIComponent(query)}&type=track`;
      const res = await axios.get(api);

      const data = res.data;
      if (!data.status || !data.result?.results?.length) {
        return client.sendMessage(
          m.chat,
          { text: "❌ Sin resultados" },
          { quoted: m, ...global.channelInfo }
        );
      }

      const song = data.result.results[0];

      const caption =
`🎵 ${song.title}
👤 ${song.artist}
💿 ${song.album}
⏱️ ${song.duration}`;

      const buttons = [
        {
          buttonId: `spdl|${song.link}`,
          buttonText: { displayText: "⬇️ Descargar" },
          type: 1
        }
      ];

      await client.sendMessage(
        m.chat,
        {
          image: { url: song.image },
          caption,
          buttons,
          footer: "SonGoku",
          headerType: 4
        },
        { quoted: m, ...global.channelInfo }
      );

    } catch (err) {
      await client.sendMessage(
        m.chat,
        { text: "⚠️ Error" },
        { quoted: m, ...global.channelInfo }
      );
    }
  }
};