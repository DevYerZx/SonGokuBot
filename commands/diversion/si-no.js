const axios = require("axios");

module.exports = {
  command: ["yesno", "siyno"],
  categoria: "diversion",
  run: async (client, m) => {
    try {
      const args = m.body.trim().split(/ +/).slice(1);
      if (!args.length) return m.reply("❌ Ingresa una pregunta.");

      const question = encodeURIComponent(args.join(" "));
      const url = `https://api.soymaycol.icu/juegoyesno?answer=${question}&apikey=may-3697c22b`;

      const res = await axios.get(url);
      const data = res.data;

      if (!data.status || !data.result)
        return m.reply("❌ No se pudo responder, intenta otra vez.");

      const { question: q, userAnswer } = data.result;

      m.reply(
        `🎲 *Pregunta:* ${q}\n🔮 *Respuesta:* ${userAnswer}`
      );
    } catch (e) {
      m.reply("⚠️ Ocurrió un error en la respuesta.");
    }
  }
};