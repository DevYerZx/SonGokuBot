const axios = require("axios");

module.exports = {
  command: ["spdl"],
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

      // Mensaje simple de descarga
      await client.reply(
        m.chat,
        "⬇️ Descargando música...",
        m,
        global.channelInfo
      );

      const url = encodeURIComponent(args[0]);
      const api = `https://api-adonix.ultraplus.click/download/spotify?apikey=dvyer&url=${url}`;

      const { data } = await axios.get(api);

      if (!data?.status || !data?.result?.url) {
        return client.reply(
          m.chat,
          "⚠️ No se pudo descargar el audio.",
          m,
          global.channelInfo
        );
      }

      const { title, url: audio } = data.result;

      // Enviar SOLO el audio
      await client.sendMessage(
        m.chat,
        {
          audio: { url: audio },
          mimetype: "audio/mpeg",
          fileName: `${title || "spotify"}.mp3`
        },
        { quoted: m }
      );

    } catch (err) {
      console.error("Spotify DL Error:", err);
      client.reply(
        m.chat,
        "⚠️ Ocurrió un error al descargar.",
        m,
        global.channelInfo
      );
    }
  }
};