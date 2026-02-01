const axios = require("axios");

module.exports = {
  command: ["spdl"],
  categoria: "spotify",
  description: "Descargar Spotify",

  run: async (client, m) => {
    try {
      // 👉 EXTRAER LINK DEL MENSAJE COMPLETO
      const match = m.text.match(/https?:\/\/open\.spotify\.com\/track\/[^\s]+/);

      if (!match) {
        return client.reply(
          m.chat,
          "❌ Link de Spotify inválido",
          m,
          global.channelInfo
        );
      }

      const spotifyUrl = match[0];

      await client.reply(
        m.chat,
        "⬇️ Descargando...",
        m,
        global.channelInfo
      );

      const api =
        `https://api-adonix.ultraplus.click/download/spotify?apikey=dvyer&url=${encodeURIComponent(spotifyUrl)}`;

      const res = await axios.get(api);
      const song = res.data?.result;

      if (!song?.url) {
        return client.reply(
          m.chat,
          "❌ Error al descargar",
          m,
          global.channelInfo
        );
      }

      await client.sendMessage(
        m.chat,
        {
          audio: { url: song.url },
          mimetype: "audio/mpeg",
          fileName: `${song.title || "Spotify"}.mp3"
        },
        global.channelInfo
      );

    } catch (e) {
      client.reply(
        m.chat,
        "⚠️ Error",
        m,
        global.channelInfo
      );
    }
  }
};