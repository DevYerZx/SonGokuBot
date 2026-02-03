const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "../database/welcome.json");

module.exports = {
  command: ["welcome"],
  category: "grupo",
  description: "Activar o desactivar bienvenida",

  run: async (client, m, args) => {
    try {
      if (!m.isGroup)
        return m.reply("❌ Este comando solo funciona en grupos");

      // 📌 OBTENER INFO DEL GRUPO
      const metadata = await client.groupMetadata(m.chat);

      // 📌 NORMALIZAR JIDS
      const sender = client.decodeJid(m.sender);
      const botJid = client.decodeJid(client.user.id);

      // 📌 LISTA REAL DE ADMINS
      const admins = metadata.participants
        .filter(p => p.admin !== null)
        .map(p => client.decodeJid(p.id));

      const isAdmin = admins.includes(sender);
      const isBotAdmin = admins.includes(botJid);

      if (!isBotAdmin)
        return m.reply("❌ El bot debe ser admin del grupo");

      if (!isAdmin)
        return m.reply("❌ Solo admins pueden usar este comando");

      if (!args[0])
        return m.reply("📌 Uso: .welcome on / off");

      let db = {};
      if (fs.existsSync(dbPath)) {
        db = JSON.parse(fs.readFileSync(dbPath));
      }

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
    } catch (e) {
      console.log("❌ Error comando welcome:", e);
      return m.reply("❌ Error interno");
    }
  },
};