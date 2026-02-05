const axios = require("axios");

module.exports = {
  command: ["elaina"],
  categoria: "random",
  description: "Envía una imagen random de Elaina ✨",

  run: async (client, m, args) => {
    try {
      // ⏳ Mensaje enviando... CON info channel
      await client.reply(
        m.chat,
        "✨ Enviando imagen de Elaina, espera un momento...",
        m,
        global.channelInfo
      );

      // 🌐 Llamada a la API
      const res = await axios.get(
        "https://gawrgura-api.onrender.com/random/elaina"
      );

      if (!res.data || !res.data.url) {
        return client.reply(
          m.chat,
          "❌ No se pudo obtener la imagen de Elaina.",
          m,
          global.channelInfo
        );
      }

      // 🖼️ Enviar imagen con info channel
      await client.sendMessage(
        m.chat,
        {
          image: { url: res.data.url },
          caption: "✨ *ELAINA RANDOM*\n\n🧙‍♀️ La bruja viajera 💖",
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
        "❌ Error al conectar con la API de Elaina.",
        m,
        global.channelInfo
      );
    }
  }
};
