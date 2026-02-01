const axios = require("axios");

module.exports = {
  command: ["spdl"],
  categoria: "spotify",

  run: async (client, m, args) => {
    try {
      if (!args[0]) return;

      const spotifyUrl = args[0];

      await client.sendMessage(
        m.chat,
        { text: "⬇️ Descargando..." },
        { quoted: m, ...global.channelInfo }
      );

      const api = `https://api-adonix.ultraplus.click/download/spotify?apikey=dvyer&url=${encodeURIComponent(spotifyUrl)}`;
      const res = await axios.get(api);

      const data = res.data;
      if (!data.status || !data.result?.url) {
        return client.sendMessage(
          m.chat,
          { text: "❌ Error al descargar" },
          { quoted: m, ...global.channelInfo }
        );
      }

      const song = data.result;

      await client.sendMessage(
        m.chat,
        {
          audio: { url: song.url },
          mimetype: "audio/mpeg",
          fileName: `${song.title || "Spotify"}.mp3`
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