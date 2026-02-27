const axios = require("axios");

// 🔒 Cooldown global
const cooldowns = new Map();

module.exports = {
  command: ["ytmp4doc"],
  categoria: "descarga",
  description: "Descarga video de YouTube y lo envía como documento",

  run: async (client, m, args) => {
    const userId = m.sender;

    try {
      // 🔒 Cooldown
      if (cooldowns.has(userId)) {
        const wait = cooldowns.get(userId) - Date.now();
        if (wait > 0)
          return client.reply(
            m.chat,
            `⏳ Espera *${Math.ceil(wait / 1000)}s*`,
            m,
            global.channelInfo
          );
      }

      // ⏱️ Activar cooldown (30s)
      cooldowns.set(userId, Date.now() + 30_000);
      setTimeout(() => {
        cooldowns.delete(userId);
      }, 30_000);

      if (!args[0])
        return client.reply(
          m.chat,
          "❌ Envía un link de YouTube\n\nEjemplo:\n*ytmp4doc https://youtu.be/O0kcQlykUqQ*",
          m,
          global.channelInfo
        );

      const ytUrl = encodeURIComponent(args[0]);
      const apiKey = "stellar-GrCTT787";

      await client.reply(
        m.chat,
        "⏳ Descargando video, espera...",
        m,
        global.channelInfo
      );

      const api = `https://api.stellarwa.xyz/dl/ytmp4?url=${ytUrl}&quality=360&key=${apiKey}`;
      const { data } = await axios.get(api);

      if (!data.status)
        return client.reply(
          m.chat,
          "❌ Error al obtener el video",
          m,
          global.channelInfo
        );

      const info = data.data;

      const caption =
        `🎬 *${info.title}*\n` +
        `⏱ Duración: ${info.duration}\n` +
        `📦 Tamaño: ${info.fileSize}\n` +
        `🎞 Calidad: ${info.quality}`;

      await client.sendMessage(
        m.chat,
        {
          document: { url: info.dl },
          mimetype: "video/mp4",
          fileName: `${info.title}.mp4`,
          caption
        },
        { quoted: m }
      );

    } catch (e) {
      console.error(e);
      client.reply(
        m.chat,
        "❌ Ocurrió un error al descargar el video",
        m,
        global.channelInfo
      );
    }
  }
};

