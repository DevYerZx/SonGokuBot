const axios = require("axios");

module.exports = {
  command: ["pinterest", "pin"],
  categoria: "busqueda",
  description: "Busca imágenes en Pinterest",

  run: async (client, m, args) => {
    try {
      if (!args.length) {
        return m.reply(
          "❌ Escribe qué imagen deseas buscar.\n\nEjemplo:\n.pinterest edit songoku"
        );
      }

      const query = encodeURIComponent(args.join(" "));
      const limit = 5;
      const apiKey = "dvyer";

      const url = `https://api-adonix.ultraplus.click/search/pinterest?apikey=${apiKey}&query=${query}&limit=${limit}`;

      // 🔔 Notificación de carga
      await m.reply("🔎 Buscando imágenes en Pinterest...\n⏳ Por favor espera");

      const res = await axios.get(url);

      if (!res.data || !res.data.status || !res.data.results.length) {
        return m.reply("❌ No se encontraron imágenes.");
      }

      let count = 1;
      for (const img of res.data.results) {
        await client.sendMessage(
          m.chat,
          {
            image: { url: img },
            caption: `📌 *Pinterest*\n🖼️ Imagen ${count++}\n🔍 Búsqueda: ${args.join(" ")}`
          },
          { quoted: m }
        );
      }

    } catch (e) {
      console.log("PINTEREST ERROR:", e);
      m.reply("⚠️ Error al buscar imágenes en Pinterest.");
    }
  },
};
