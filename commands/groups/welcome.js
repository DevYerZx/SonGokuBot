const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "../database/welcome.json");

module.exports = {
  command: ["welcome"],
  category: "grupo",
  description: "Activar o desactivar bienvenida",

  run: async (client, m, args) => {
    if (!m.isGroup) return m.reply("❌ Este comando es solo para grupos");

    // 🔐 OBTENER METADATA DEL GRUPO
    const metadata = await client.groupMetadata(m.chat);
    const admins = metadata.participants
      .filter(p => p.admin)
      .map(p => p.id);

    const isAdmin = admins.includes(m.sender);
    const isOwner = m.sender === client.user.id;

    if (!isAdmin && !isOwner)
      return m.reply("❌ Solo admins pueden usar este comando");

    if (!args[0])
      return m.reply("📌 Uso: .welcome on / off");

    let db = {};
    if (fs.existsSync(dbPath))
      db = JSON.parse(fs.readFileSync(dbPath));

    if (!db[m.chat]) db[m.chat] = { enabled: false };

    if (args[0] === "on") {
      db[m.chat].enabled = true;
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
      return m.reply("✅ Bienvenida activada en este grupo");
    }

    if (args[0] === "off") {
      db[m.chat].enabled = false;
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
      return m.reply("❌ Bienvenida desactivada en este grupo");
    }

    return m.reply("📌 Uso correcto: .welcome on / off");
  },
};