const axios = require("axios");

module.exports = {
  command: ["elaina"],
  categoria: "random",
  description: "Envía una imagen random de Elaina ✨",

  run: async (client, m, args) => {
    try {
      // ⏳ Mensaje enviando... (con info channel)
      await client.reply(
        m.chat,
        "✨ Enviando imagen de Elaina, espera un momento...",
        m,
        global.channelInfo
      );

      // 🌐 Petición a la API
      const res = await axios.get(
        "https://gawrgura-api.onrender.com/random/elaina"
      );

      // 🧼 Extraer y LIMPIAR la URL
      let imgUrl =
        res.data?.url ||
        res.data?.result ||
        res.data?.image ||
        res.data;

      if (!imgUrl || typeof imgUrl !== "string") {
        return client.reply(
          m.chat,
          "❌ No se pudo obtener la imagen de Elaina.",
          m,
          global.channelInfo
        );
      }

      // 🔧 LIMPIEZA CLAVE (esto evita el error)
      imgUrl = imgUrl.trim();          // quita espacios
      imgUrl = encodeURI(imgUrl);      // escapa caracteres raros

      // ⬇️ Descargar imagen como BUFFER
      const img = await axios.get(imgUrl, {
        responseType: "arraybuffer",
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      // 🖼️ Enviar imagen (con info channel)
      await client.sendMessage(
        m.chat,
        {
          image: Buffer.from(img.data),
          caption: "✨ *ELAINA RANDOM*\n\n🧙‍♀️ La bruja viajera 💖"
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
        "❌ Error al descargar la imagen de Elaina.",
        m,
        global.channelInfo
      );
    }
  }
};


