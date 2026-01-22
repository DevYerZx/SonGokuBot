const fs = require("fs");
const path = require("path");

module.exports = {
  command: ["reiniciarbot", "restart"],
  categoria: "owner",
  description: "Reinicia el bot manualmente (solo owner)",

  run: async (client, m, args) => {
    try {
      // 🔹 Verificación segura del owner
      // Extrae solo el número, sin @s.whatsapp.net
      const senderNumber = m.sender.split("@")[0];
      if (!global.owner.includes(senderNumber)) {
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
