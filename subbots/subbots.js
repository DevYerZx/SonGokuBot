const { startSubBot } = require("../subbots"); // ajusta la ruta si usas subcarpetas

module.exports = {
  command: ["subbot"],
  description: "Crear tu propio subbot",

  run: async (client, m, args) => {
    if (!args[0]) {
      return client.reply(
        m.chat,
        "📱 Usa: .subbot 519XXXXXXXX\n\nEjemplo:\n.subbot 51999999999",
        m
      );
    }

    const phone = args[0].replace(/\D/g, "");

    if (phone.length < 10) {
      return client.reply(
        m.chat,
        "❌ Número inválido, usa código de país",
        m
      );
    }

    try {
      const code = await startSubBot(phone);

      await client.reply(
        m.chat,
        `🤖 *SUBBOT CREADO*\n\n🔐 Código de vinculación:\n*${code}*\n\nWhatsApp > Dispositivos vinculados > Vincular con código`,
        m
      );
    } catch (e) {
      console.error(e);
      client.reply(
        m.chat,
        "❌ Error al crear subbot, intenta más tarde",
        m
      );
    }
  }
};