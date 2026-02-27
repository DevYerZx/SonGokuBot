const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(process.cwd(), "database", "priority-users.json");

const isOwner = (jid) => global.owner.includes(jid.split("@")[0]);

module.exports = {
  command: ["addlimit"],
  categoria: "owner",

  run: async (client, m, args) => {
    if (!isOwner(m.sender))
      return m.reply("❌ Solo el owner");

    const user = m.mentionedJid?.[0];
    const limit = parseInt(args[1]);

    if (!user || isNaN(limit))
      return m.reply("📌 Uso: .addlimit @usuario 20");

    let db = {};
    if (fs.existsSync(DB_PATH))
      db = JSON.parse(fs.readFileSync(DB_PATH));

    if (!db[user]) db[user] = { free: false };

    db[user].limit = limit;

    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

    m.reply(`✅ Nuevo límite: *${limit} comandos/min*`);
  }
};
