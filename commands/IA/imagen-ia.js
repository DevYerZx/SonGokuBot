const axios = require("axios");

module.exports = {
  command: ["crearimagen", "imgai", "imagenai"],
  categoria: "IA",
  description: "Genera imágenes con IA (Venice)",

  run: async (client, m, args) => {
    try {
      if (!args.length) {
        return m.reply(
          "❌ Escribe una descripción para generar la imagen.\n\nEjemplo:\n.veniceimg goku con ropa de la sierra peruana"
        );
      }

      const prompt = encodeURIComponent(args.join(" "));
      const apiKey = "dvyer";

      const url = `https://api-adonix.ultraplus.click/ai/venice-image?apikey=${apiKey}&prompt=${prompt}`;
      const res = await axios.get(url);

      if (!res.data || !res.data.status) {
        return m.reply("❌ No se pudo generar la imagen.");
      }

      const images = res.data.results;

      if (!images || images.length === 0) {
        return m.reply("❌ La IA no devolvió imágenes.");
      }

      await m.reply(
        `🖼️ *Generando imágenes con IA...*\n\n📝 *Prompt:* ${res.data.prompt}`
      );

      // Enviar las 3 imágenes
      for (let i = 0; i < images.length; i++) {
        await client.sendMessage(
          m.chat,
          {
            image: { url: images[i].url },
            caption: `✨ *Imagen ${i + 1}*\n🎨 IA: Venice`,
          },
          { quoted: m }
        );
      }
    } catch (e) {
      console.log("VENICE IMAGE ERROR:", e);
      m.reply("⚠️ Error al generar la imagen con IA.");
    }
  },
};
