const fs = require("fs");
const path = require("path");

module.exports = {
  command: ["restart"],
  categoria: "owner",
  description: "Reinicia el bot manualmente (solo owner o el número del bot)",

  run: async (client, m, args) => {
    try {
      // 🔹 Número del sender sin @s.whatsapp.net
      const senderNumber = m.sender.split("@")[0];

      // 🔹 Número del bot sin @s.whatsapp.net
      const botNumber = client.user.jid.split("@")[0];

      // 🔹 Verificación: debe ser owner o el mismo número del bot
      if (!global.owner.includes(senderNumber) && senderNumber !== botNumber) {
        return client.reply(
          m.chat,
          "❌ Solo el owner puede reiniciar el bot",
          m
        );
      }

      // 🔹 Mensaje de aviso
      await client.reply(
        m.chat,
        "♻️ Reiniciando el bot, espera unos segundos...",
        m
      );

      // 🔹 Limpieza de temporales antes de reiniciar
      const tmpPath = path.join(__dirname, "../../tmp");
      if (fs.existsSync(tmpPath)) {
        const files = fs.readdirSync(tmpPath);
        for (const file of files) {
          const filePath = path.join(tmpPath, file);
          try { fs.unlinkSync(filePath); } catch {}
        }
      }

      // 🔹 Espera 2 segundos para que se vea el mensaje antes de cerrar
      setTimeout(() => {
        console.log("Bot reiniciado por comando del owner ✅");
        process.exit(0); // PM2 lo levantará si está configurado
      }, 2000);

    } catch (err) {
      console.error("REINICIARBOT ERROR:", err);
      client.reply(
        m.chat,
        "❌ Ocurrió un error al intentar reiniciar el bot",
        m
      );
    }
  }
};

