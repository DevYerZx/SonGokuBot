const axios = require("axios");

module.exports = {
  command: ["codestral"],
  categoria: "IA",
  run: async (client, m) => {
    try {
      const args = m.body.trim().split(/ +/).slice(1);
      if (!args.length) return m.reply("❌ Ingresa qué código deseas generar.");

      const query = encodeURIComponent(args.join(" "));
      const url = `https://api.soymaycol.icu/ai-codestral?q=${query}&apikey=may-3697c22b`;

      const res = await axios.get(url);
      const data = res.data;

      if (!data.status || !data.result)
        return m.reply("❌ No se pudo generar el código.");

      const response = data.result.trim();
      const maxLength = 1200;

      await m.reply(`🤖 *Codestral IA*\n\n📌 *Consulta:* ${args.join(" ")}`);

      for (let i = 0; i < response.length; i += maxLength) {
        await m.reply(response.slice(i, i + maxLength));
      }
    } catch (e) {
      m.reply("⚠️ Error al generar el código con Codestral.");
    }
  }
};