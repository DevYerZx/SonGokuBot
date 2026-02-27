const axios = require("axios");

module.exports = {
  command: ["chatgpt", "ia2"],
  categoria: "IA",
  description: "Habla con ChatGPT gratis",

  run: async (client, m, args) => {
    try {
      if (!args.length) {
        return m.reply("❌ Escribe una pregunta para la IA.\n\nEjemplo:\n.chatgpt ¿cómo estás?");
      }

      const question = encodeURIComponent(args.join(" "));
      const apiKey = "dvyer";
      const model = "gpt-5-nano";

      const url = `https://api-adonix.ultraplus.click/ai/chatgptfree?apikey=${apiKey}&question=${question}&model=${model}`;

      const res = await axios.get(url);

      if (!res.data || !res.data.status) {
        return m.reply("❌ La IA no pudo responder.");
      }

      const reply = res.data.reply || "❌ Respuesta vacía de la IA.";

      await m.reply(reply);
    } catch (e) {
      console.log("CHATGPT IA ERROR:", e);
      m.reply("⚠️ Error al conectar con la IA.");
    }
  },
};
