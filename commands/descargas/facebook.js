const axios = require("axios");

module.exports = {
  command: ["fb", "facebook"],
  description: "Descarga videos de Facebook.",
  categoria: "descarga",
  use: "https://www.facebook.com/share/r/15kXJEJXPA/",
  run: async (client, m, args) => {
    if (!args[0]) {
      return client.reply(
        m.chat,
        "Ingrese un enlace de *Facebook*\n\n`Ejemplo`\n!fb https://www.facebook.com/share/r/15kXJEJXPA/",
        m,
        global.channelInfo
      );
    }

    if (!args[0].match(/facebook\.com|fb\.watch|video\.fb\.com/)) {
      return client.reply(
        m.chat,
        "El enlace no parece *válido*. Asegúrate de que sea de *Facebook*",
        m,
        global.channelInfo
      );
    }

    await client.reply(
      m.chat,
      "⏳ Tu video se está procesando...\n🤖 Bot: SonGokuBot",
      m,
      global.channelInfo
    );

    try {
      const api = `https://apis-starlights-team.koyeb.app/starlight/facebook?url=${encodeURIComponent(args[0])}`;
      const { data } = await axios.get(api);

      if (!data || data.status === false) {
        return client.reply(
          m.chat,
          "❌ No se pudo obtener el video",
          m,
          global.channelInfo
        );
      }

      const videoUrl = data.hd || data.sd;

      // 🔍 Obtener tamaño del archivo
      const head = await axios.head(videoUrl);
      const sizeMB = head.headers["content-length"]
        ? Number(head.headers["content-length"]) / 1024 / 1024
        : 0;

      const caption = `
📥 *FACEBOOK DOWNLOADER*

🎬 *Título:* ${data.title}
👤 *Autor:* ${data.creator}
⏱ *Duración:* ${(data.duration_ms / 1000).toFixed(0)}s
📦 *Peso:* ${sizeMB.toFixed(2)} MB
      `.trim();

      // Miniatura
      await client.sendMessage(
        m.chat,
        {
          image: { url: data.thumbnail },
          caption,
        },
        { quoted: m, ...global.channelInfo }
      );

      // 📄 Si pesa mucho → documento
      if (sizeMB > 70) {
        await client.sendMessage(
          m.chat,
          {
            document: { url: videoUrl },
            mimetype: "video/mp4",
            fileName: "facebook.mp4",
            caption: "📄 El video pesa mucho, enviado como *documento*",
          },
          { quoted: m, ...global.channelInfo }
        );
      } else {
        // 🎥 Video normal
        await client.sendMessage(
          m.chat,
          {
            video: { url: videoUrl },
            mimetype: "video/mp4",
            fileName: "facebook.mp4",
          },
          { quoted: m, ...global.channelInfo }
        );
      }

    } catch (e) {
      console.error(e);
      await client.reply(
        m.chat,
        "❌ Error al procesar el video de Facebook",
        m,
        global.channelInfo
      );
    }
  },
};