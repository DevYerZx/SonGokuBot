const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "../database/welcome.json");

module.exports = {
  command: ["welcome"],
  category: "grupo",
  description: "Activar o desactivar bienvenida",

  run: async (client, m, args) => {
    if (!m.isGroup) return m.reply("❌ Solo en grupos");
    if (!m.isAdmin && !m.isOwner)
      return m.reply("❌ Solo admins");

    let db = {};
    if (fs.existsSync(dbPath))
      db = JSON.parse(fs.readFileSync(dbPath));

    if (!args[0])
      return m.reply("Uso: .welcome on / off");

    if (!db[m.chat]) db[m.chat] = { enabled: false };

    if (args[0] === "on") {
      db[m.chat].enabled = true;
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
      return m.reply("✅ Bienvenida activada");
    }

    if (args[0] === "off") {
      db[m.chat].enabled = false;
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
      return m.reply("❌ Bienvenida desactivada");
    }

    m.reply("Uso: .welcome on / off");
  },
};