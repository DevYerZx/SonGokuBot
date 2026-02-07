const fs = require("fs");
const path = require("path");

const PRIORITY_PATH = path.join(process.cwd(), "database", "priority-users.json");

module.exports = {
  command: ["addlimit", "darcupon", "prioridad"],
  categoria: "owner",

  run: async (client, m, args) => {
    if (!global.owner.includes(m.sender))
      return m.reply("❌ Solo el owner");

    const user = m.mentionedJid?.[0];
    const limit = parseInt(args[1]);

    if (!user || isNaN(limit))
      return m.reply("📌 Uso:\n.addlimit @usuario 20");

    let data = {};
    if (fs.existsSync(PRIORITY_PATH))
      data = JSON.parse(fs.readFileSync(PRIORITY_PATH));

    data[user] = limit;
    fs.writeFileSync(PRIORITY_PATH, JSON.stringify(data, null, 2));

    m.reply(`✅ Usuario con *${limit} comandos/min*`);
  }
};
