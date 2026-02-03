const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "../database/welcome.json");

module.exports = {
  command: ["welcome"],
  categoria: "grupos",
  description: "Activar o desactivar bienvenida",

  run: async (client, m, args) => {
    try {
      if (!m.isGroup) {
        return m.reply("❌ Este comando solo funciona en grupos");
      }

      if (!args[0]) {
        return m.reply("📌 Uso: .welcome on / off");
      }

      // ✅ ID REAL DEL GRUPO (CLAVE)
      const groupId = m.chat.endsWith("@g.us")
        ? m.chat
        : m.key.remoteJid;

      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(path.dirname(dbPath), { recursive: true });
        fs.writeFileSync(dbPath, "{}");
      }

      const db = JSON.parse(fs.readFileSync(dbPath));

      if (!db[groupId]) db[groupId] = { enabled: false };

      if (args[0] === "on") {
        db[groupId].enabled = true;
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        return m.reply("✅ Bienvenida activada en este grupo");
      }

      if (args[0] === "off") {
        db[groupId].enabled = false;
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        return m.reply("❌ Bienvenida desactivada en este grupo");
      }

      return m.reply("📌 Uso correcto: .welcome on / off");

    } catch (e) {
      console.log("❌ Error welcome command:", e);
      return m.reply("❌ Error interno");
    }
  },
};