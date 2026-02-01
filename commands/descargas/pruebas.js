const axios = require("axios");

module.exports = {
  command: ["spotify", "sp"],
  description: "Descarga música de Spotify",

  run: async (client, m, args) => {
    try {
      if (!args[0]) {
        return client.reply(
          m.chat,
          "❌ Envía un enlace de Spotify",
          m,
          global.channelInfo
        );
      }

      const url = encodeURIComponent(args[0]);
      const api = `https://api-adonix.ultraplus.click/download/spotify?apikey=dvyer&url=${url}`;

      const { data } = await axios.get(api);

      if (!data.status) {
        return client.reply(
          m.chat,
          "⚠️ No se pudo descargar el audio.",
          m,
          global.channelInfo
        );
      }

      const { title, thumbnail, url: audio } = data.result;

      await client.sendMessage(
        m.chat,
        {
          image: { url: thumbnail },
          caption: `🎵 *${title}*\n\n⬇️ Descargando audio...`
        },
        { quoted: m }
      );

      await client.sendMessage(
        m.chat,
        {
          audio: { url: audio },
          mimetype: "audio/mpeg",
          fileName: `${title}.mp3`
        },
        { quoted: m }
      );

    } catch (e) {
      console.error(e);
      client.reply(
        m.chat,
        "⚠️ Error en la descarga.",
        m,
        global.channelInfo
      );
    }
  }
};