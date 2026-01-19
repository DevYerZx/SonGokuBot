const axios = require("axios")

module.exports = {
  command: ["cohere"],
  categoria: "IA",
  run: async (client, m, args) => {
    try {
      if (!args.length) {
        return m.reply("❌ Escribe un mensaje para la IA.")
      }

      const query = encodeURIComponent(args.join(" "))
      const url = `https://api.soymaycol.icu/ai-cohere?q=${query}&apikey=may-3697c22b`

      const res = await axios.get(url)

      if (!res.data.status || !res.data.result) {
        return m.reply("❌ No se pudo obtener respuesta.")
      }

      m.reply(res.data.result)
    } catch (e) {
      m.reply("⚠️ Error al conectar con la IA.")
    }
  }
}