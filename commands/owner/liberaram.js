const fs = require("fs");
const path = require("path");

module.exports = {
  command: ["liberaram", "freemem"],
  categoria: "admin",
  description: "Libera memoria RAM y limpia archivos temporales",

  run: async (client, m, args) => {
    try {
      const tmpPath = path.join(__dirname, "../../tmp");

      // 🔹 Borrar archivos temporales
      if (fs.existsSync(tmpPath)) {
        const files = fs.readdirSync(tmpPath);
        for (const file of files) {
          const filePath = path.join(tmpPath, file);
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            console.log("Error al borrar archivo:", filePath, err.message);
          }
        }
      }

      // 🔹 Ejecutar Garbage Collector si está disponible
      if (global.gc) {
        global.gc();
        await client.reply(m.chat, "✅ Archivos temporales borrados y GC ejecutado, memoria liberada.", m);
      } else {
        await client.reply(
          m.chat,
          "⚠️ Archivos temporales borrados, pero Node.js no arrancó con --expose-gc, no se pudo ejecutar GC.",
          m
        );
      }

    } catch (err) {
      console.error("LIBERARAM ERROR:", err);
      client.reply(m.chat, "❌ Ocurrió un error al intentar liberar memoria.", m);
    }
  }
};
