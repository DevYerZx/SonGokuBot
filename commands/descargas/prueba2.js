const Starlights = require("@StarlightsTeam/Scraper");
const fetch = require("node-fetch");
const { ytdl_han } = require("ytdl-han");

const BOT_NAME = "SonGokuBot";
const LIMIT_MB = 100;

module.exports = {
  command: ["ytmp5", "yta", "fgmp3"],
  categoria: "descarga",
  description: "Descarga audio de YouTube (MP3)",

  run: async (client, m, args) => {
    try {
      if (!args.length) {
        return client.reply(
          m.chat,
          "⚠️ Ingresa el enlace de YouTube.\n\nEjemplo:\n!ytmp3 https://youtu.be/QSvaCSt8ixs",
          m,
          global.channelInfo
        );
      }

      const url = args[0];

      await client.reply(
        m.chat,
        "⏳ Procesando audio...\n🤖 " + BOT_NAME,
        m,
        global.channelInfo
      );

      /* ======================
         MÉTODO PRINCIPAL
      ====================== */
      try {
        const gi = await ytdl_han(url, "128kbps");
        const sizeMB = parseFloat(gi.data.size.replace("MB", ""));

        if (sizeMB >= LIMIT_MB) {
          return client.reply(
            m.chat,
            `❌ El archivo pesa más de ${LIMIT_MB} MB`,
            m,
            global.channelInfo
          );
        }

        const audioBuffer = Buffer.from(gi.data.format, "base64");

        const caption =
          "🎵 *YOUTUBE MP3*\n\n" +
          `📌 Título: ${gi.data.title}\n` +
          `🎚 Calidad: 128kbps\n` +
          `📦 Tamaño: ${gi.data.size}\n\n` +
          "⏳ Enviando audio…";

        await client.sendMessage(
          m.chat,
          {
            image: { url: gi.data.thumbnail },
            caption,
          },
          { quoted: m, ...global.channelInfo }
        );

        await client.sendMessage(
          m.chat,
          {
            audio: audioBuffer,
            mimetype: "audio/mpeg",
            fileName: `${gi.data.title}.mp3`,
          },
          { quoted: m, ...global.channelInfo }
        );

        return;

      } catch (err) {
        /* ======================
           FALLBACK STARS
        ====================== */
        const { title, size, quality, thumbnail, dl_url } =
          await Starlights.ytmp3(url);

        const sizeMB = parseFloat(size.replace("MB", ""));
        if (sizeMB >= LIMIT_MB) {
          return client.reply(
            m.chat,
            `❌ El archivo pesa más de ${LIMIT_MB} MB`,
            m,
            global.channelInfo
          );
        }

        const img = await (await fetch(thumbnail)).buffer();

        const caption =
          "🎵 *YOUTUBE MP3*\n\n" +
          `📌 Título: ${title}\n` +
          `🎚 Calidad: ${quality}\n` +
          `📦 Tamaño: ${size}\n\n` +
          "⏳ Enviando audio…";

        await client.sendMessage(
          m.chat,
          {
            image: img,
            caption,
          },
          { quoted: m, ...global.channelInfo }
        );

        await client.sendMessage(
          m.chat,
          {
            audio: { url: dl_url },
            mimetype: "audio/mp4",
            fileName: `${title}.mp3`,
          },
          { quoted: m, ...global.channelInfo }
        );
      }

    } catch (error) {
      console.error(error);
      await client.reply(
        m.chat,
        "❌ Ocurrió un error al procesar el audio.",
        m,
        global.channelInfo
      );
    }
  },
};