const fs = require("fs");
const path = require("path");

const PRIORITY_PATH = path.join(process.cwd(), "database", "priority-users.json");

const isOwner = (jid) => {
  const num = jid.split("@")[0];
  return global.owner.includes(num);
};

module.exports = {
  command: ["addlimit", "darcupon", "prioridad"],
  categoria: "owner",

  run: async (client, m, args) => {
    if (!isOwner(m.sender))
      return m.reply("❌ Solo el dueño del bot");

    const user = m.mentionedJid?.[0];
    const limit = parseInt(args[1]);

    if (!user || isNaN(limit))
      return m.reply("📌 Uso:\n.addlimit @usuario 20");

    let data = {};
    if (fs.existsSync(PRIORITY_PATH))
      data = JSON.parse(fs.readFileSync(PRIORITY_PATH));

    data[user] = limit;

    fs.mkdirSync(path.dirname(PRIORITY_PATH), { recursive: true });
    fs.writeFileSync(PRIORITY_PATH, JSON.stringify(data, null, 2));

    m.reply(`✅ Límite asignado: *${limit} comandos/min*`);
  }
};
