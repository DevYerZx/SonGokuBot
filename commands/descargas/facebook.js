const { fetchDownloadLinks, getDownloadLink } = require("lurcloud");

module.exports = {
  command: ["fb", "facebook"],
  description: "Descarga videos de Facebook.",
  categoria: "descarga",
  use: "https://www.facebook.com/share/r/15kXJEJXPA/",

  run: async (client, m, args) => {
    try {
      if (!args[0]) {
        return client.reply(
          m.chat,
          "❌ Ingresa un enlace de Facebook\n\n📌 Ejemplo:\n!fb https://www.facebook.com/share/r/15kXJEJXPA/",
          m,
          global.channelInfo
        );
      }

      if (!/facebook\.com|fb\.watch|video\.fb\.com/i.test(args[0])) {
        return client.reply(
          m.chat,
          "❌ El enlace no es válido.\nAsegúrate que sea de Facebook",
          m,
          global.channelInfo
        );
      }

      await client.reply(
        m.chat,
        "⏳ Procesando video de Facebook...\n📥 Descargando, espera un momento\n🤖 SonGokuBot",
        m,
        global.channelInfo
      );

      const links = await fetchDownloadLinks(args[0], "facebook");

      if (!links || !Array.isArray(links) || links.length === 0) {
        return client.reply(
          m.chat,
          "❌ No se pudo obtener el video",
          m,
          global.channelInfo
        );
      }

      const videoUrl = getDownloadLink("facebook", links);

      if (!videoUrl) {
        return client.reply(
          m.chat,
          "❌ No se encontró un enlace de descarga válido",
          m,
          global.channelInfo
        );
      }

      const caption = `
📘 FB DOWNLOADER

🔗 Enlace:
${args[0]}

🤖 SonGokuBot
`.trim();

      await client.sendMessage(
        m.chat,
        {
          video: { url: videoUrl },
          caption,
          mimetype: "video/mp4",
          fileName: "facebook.mp4",
        },
        { quoted: m, ...global.channelInfo }
      );

    } catch (err) {
      console.error("FB ERROR:", err);
      await client.reply(
        m.chat,
        "❌ Error al procesar el video de Facebook",
        m,
        global.channelInfo
      );
    }
  },
};