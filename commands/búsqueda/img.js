const axios = require("axios");

module.exports = {
    command: ["imagen", "img", "gimage"],
    categoria: "busqueda",
    run: async (client, m) => {
        try {
            const args = m.body.trim().split(/ +/).slice(1);
            if (!args.length) return m.reply("❌ Ingresa qué imagen deseas buscar.");

            const query = encodeURIComponent(args.join(" "));
            const url = `https://gawrgura-api.onrender.com/search/gimage?q=${query}`;

            const res = await axios.get(url);
            const data = res.data;

            if (!data.status || !data.result || data.result.length === 0)
                return m.reply("❌ No se encontraron imágenes para esa búsqueda.");

            const image = data.result[Math.floor(Math.random() * data.result.length)].url;

            client.sendMessage(m.chat, { image: { url: image }, caption: `🔍 Resultado de: ${args.join(" ")}` });
        } catch (err) {
            console.error(err);
            m.reply("⚠️ Ocurrió un error al buscar la imagen.");
        }
    }
};