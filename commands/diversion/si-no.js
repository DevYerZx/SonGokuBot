const axios = require("axios")

module.exports = {
  command: ["yesno", "siyno"],
  categoria: "diversion",
  run: async (client, m, args) => {
    try {
      if (!args.length) {
        return m.reply("❌ Ingresa una pregunta.")
      }

      const pregunta = args.join(" ")
      const respuestas = ["Si", "No"]
      const answer = respuestas[Math.floor(Math.random() * respuestas.length)]

      const url = `https://api.soymaycol.icu/juegoyesno?answer=${answer}&apikey=may-3697c22b`
      const res = await axios.get(url)

      if (!res.data.status) {
        return m.reply("❌ No se pudo generar la respuesta.")
      }

      m.reply(
        `🎲 *Pregunta:* ${pregunta}\n🔮 *Respuesta:* ${answer}`
      )
    } catch (e) {
      m.reply("⚠️ Error al consultar la API.")
    }
  }
}