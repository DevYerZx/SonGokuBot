const axios = require("axios");

module.exports = {
  command: ["brat"],
  categoria: "herramientas",
  run: async (client, m) => {
    try {
      const args = m.body.trim().split(/ +/).slice(1);
      if (!args.length) return m.reply("❌ Ingresa el texto para crear la imagen.");

      const text = encodeURIComponent(args.join(" "));
      const url = `https://gawrgura-api.onrender.com/imagecreator/brat?text=${text}`;

      await client.sendMessage(m.chat, {
        image: { url },
        caption: `🖼️ ${args.join(" ")}`
      });
    } catch (e) {
      m.reply("⚠️ Error al generar la imagen.");
    }
  },
};