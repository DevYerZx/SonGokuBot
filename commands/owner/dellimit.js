const fs = require("fs");
const path = require("path");

const PRIORITY_PATH = path.join(process.cwd(), "database", "priority-users.json");

module.exports = {
  command: ["dellimit", "quitarlimit"],
  categoria: "owner",

  run: async (client, m) => {
    if (!global.owner.includes(m.sender))
      return m.reply("❌ Solo el owner");

    const user = m.mentionedJid?.[0];
    if (!user) return m.reply("📌 Uso:\n.dellimit @usuario");

    let data = {};
    if (fs.existsSync(PRIORITY_PATH))
      data = JSON.parse(fs.readFileSync(PRIORITY_PATH));

    delete data[user];
    fs.writeFileSync(PRIORITY_PATH, JSON.stringify(data, null, 2));

    m.reply("🗑️ Límite eliminado");
  }
};
