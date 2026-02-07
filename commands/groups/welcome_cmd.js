const fs = require("fs");
const path = require("path");

const dbPath = path.resolve(process.cwd(), "database", "welcome.json");

module.exports = {
  command: ["welcome"],
  categoria: "grupos",

  run: async (client, m, args) => {
    try {
      if (!m.isGroup) return m.reply("❌ Solo en grupos");
      if (!m.isAdmin) return m.reply("❌ Solo admins del grupo");
      if (!args[0]) return m.reply("📌 Uso: .welcome on / off");

      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(path.dirname(dbPath), { recursive: true });
        fs.writeFileSync(dbPath, "{}");
      }

      const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
      const groupId = m.chat;

      if (!db[groupId]) db[groupId] = {};

      if (args[0] === "on") {
        db[groupId].enabled = true;
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        return m.reply("✅ Bienvenida activada");
      }

      if (args[0] === "off") {
        db[groupId].enabled = false;
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        return m.reply("❌ Bienvenida desactivada");
      }

      return m.reply("📌 Uso correcto: .welcome on / off");

    } catch (e) {
      console.log(e);
      return m.reply("❌ Error al procesar el comando");
    }
  },
};

