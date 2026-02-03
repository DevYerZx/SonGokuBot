const fs = require("fs");
const path = require("path");

const dirPath = path.join(__dirname, "../database");
const dbPath = path.join(dirPath, "welcome.json");

module.exports = {
  command: ["welcome"],
  category: "grupo",
  description: "Activar o desactivar bienvenida",

  run: async (client, m, args) => {
    try {
      // ✅ SOLO GRUPOS
      if (!m.isGroup) {
        return client.sendMessage(
          m.chat,
          { text: "❌ Este comando solo funciona en grupos" },
          { quoted: m }
        );
      }

      // ✅ USO
      if (!args[0]) {
        return client.sendMessage(
          m.chat,
          { text: "📌 Uso: .welcome on / off" },
          { quoted: m }
        );
      }

      // ✅ CREAR CARPETA /database
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // ✅ CREAR ARCHIVO welcome.json
      if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, "{}");
      }

      // ✅ LEER DB
      let db = JSON.parse(fs.readFileSync(dbPath));

      if (!db[m.chat]) db[m.chat] = { enabled: false };

      // ✅ ON
      if (args[0] === "on") {
        db[m.chat].enabled = true;
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        return client.sendMessage(
          m.chat,
          { text: "✅ Bienvenida activada en este grupo" },
          { quoted: m }
        );
      }

      // ✅ OFF
      if (args[0] === "off") {
        db[m.chat].enabled = false;
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        return client.sendMessage(
          m.chat,
          { text: "❌ Bienvenida desactivada en este grupo" },
          { quoted: m }
        );
      }

      // ❌ MAL USO
      return client.sendMessage(
        m.chat,
        { text: "📌 Uso correcto: .welcome on / off" },
        { quoted: m }
      );

    } catch (err) {
      console.log("❌ ERROR REAL welcome command:", err);

      return client.sendMessage(
        m.chat,
        { text: "❌ Error interno (revisa consola)" },
        { quoted: m }
      );
    }
  },
};