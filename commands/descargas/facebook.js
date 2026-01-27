const { fetchDownloadLinks, getDownloadLink } = require("lurcloud");

module.exports = {
  command: ["fb", "facebook"],
  description: "Descarga videos de Facebook.",
  categoria: "descarga",
  use: "https://www.facebook.com/share/r/15kXJEJXPA/",
  run: async (client, m, args) => {
    if (!args[0]) {
      return client.reply(
        m.chat,
        "Ingrese un enlace de Facebook\n\nEjemplo\n!fb https://www.facebook.com/share/r/15kXJEJXPA/",
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
      "⏳ Tu video se está procesando...\nPuede tardar un momento si el archivo es largo.",
      m,
      global.channelInfo
    );

    try {
      const links = await fetchDownloadLinks(args[0], "facebook");
      if (!links || links.length === 0) {
        return client.reply(
          m.chat,
          "❌ No se pudo obtener el video",
          m,
          global.channelInfo
        );
      }

      const videoUrl = getDownloadLink("facebook", links);

      const caption = `FB DOWNLOADER

→ Enlace ›
${args[0]}
      `.trim();

      // 📄 SIEMPRE como documento
      await client.sendMessage(
        m.chat,
        {
          document: { url: videoUrl },
          mimetype: "video/mp4",
          fileName: "facebook.mp4",
          caption,
        },
        { quoted: m, ...global.channelInfo }
      );

    } catch (e) {
      console.error(e);
      await client.reply(
        m.chat,
        "❌ Ocurrió un error al procesar el video de Facebook",
        m,
        global.channelInfo
      );
    }
  },
};