const axios = require("axios");

module.exports = {
  command: ["neko", "gatita", "catgirl"],
  categoria: "random",
  description: "Envía una imagen random Neko 🐱",

  run: async (client, m, args) => {
    try {
      
      await client.reply(
        m.chat,
        "🐱 Enviando imagen Neko, espera un momento...",
        m,
        global.channelInfo
      );

      
      const res = await axios.get(
        "https://api.soymaycol.icu/neko?apikey=may-3697c22b"
      );

      if (!res.data || !res.data.status) {
        return client.reply(
          m.chat,
          "❌ No se pudo obtener la imagen Neko.",
          m,
          global.channelInfo
        );
      }

      await client.sendMessage(
        m.chat,
        {
          image: { url: res.data.url },
          caption: "🐱 *NEKO RANDOM*\n\n✨ Disfruta la imagen 💖",
        },
        {
          quoted: m,
          contextInfo: global.channelInfo
        }
      );

    } catch (err) {
      console.error(err);
      return client.reply(
        m.chat,
        "❌ Error al conectar con la API Neko.",
        m,
        global.channelInfo
      );
    }
  }
};
