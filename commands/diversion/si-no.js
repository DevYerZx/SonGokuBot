const axios = require("axios")

module.exports = {
  command: ["yesno", "siyno"],
  categoria: "diversion",
  run: async (client, m, args) => {
    try {
      if (!args[0]) {
        return m.reply("❌ Responde con *si* o *no*")
      }

      const answer = args[0].toLowerCase()
      if (!["si", "no"].includes(answer)) {
        return m.reply("❌ Solo puedes responder *si* o *no*")
      }

      const url = `https://api.soymaycol.icu/juegoyesno?answer=${answer}&apikey=may-3697c22b`
      const res = await axios.get(url)

      if (!res.data.status) {
        return m.reply("❌ No se pudo obtener respuesta")
      }

      const { question, userAnswer } = res.data.result

      m.reply(
        `🎮 *Juego Sí o No*\n\n❓ ${question}\n🗣️ Tu respuesta: *${userAnswer}*`
      )
    } catch (e) {
      m.reply("⚠️ Error al conectar con la API")
    }
  }
}