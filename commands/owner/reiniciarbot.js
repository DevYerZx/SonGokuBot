const fs = require("fs");
const path = require("path");

module.exports = {
  command: ["reiniciarbot", "restart"],
  categoria: "owner",
  description: "Reinicia el bot manualmente",

  run: async (client, m, args) => {
    try {
      // Solo owner
      if (!global.owner.includes(m.sender)) {
        return client.reply(m.chat, "❌ Solo el owner puede reiniciar el bot", m);
      }

      // Mensaje de aviso
      await client.reply(
        m.chat,
        "♻️ Reiniciando el bot, espera unos segundos...",
        m
      );

      // OPCIONAL: borrar temporales antes de reiniciar
      const tmpPath = path.join(__dirname, "../../tmp");
      if (fs.existsSync(tmpPath)) {
        const files = fs.readdirSync(tmpPath);
        for (const file of files) {
          const filePath = path.join(tmpPath, file);
          try { fs.unlinkSync(filePath); } catch {}
        }
      }

      // Espera 2 segundos antes de cerrar
      setTimeout(() => {
        console.log("Bot reiniciado por comando del owner");
        process.exit(0); // PM2 lo levantará si está configurado
      }, 2000);

    } catch (err) {
      console.error("REINICIARBOT ERROR:", err);
      client.reply(m.chat, "❌ Error al intentar reiniciar el bot", m);
    }
  }
};
