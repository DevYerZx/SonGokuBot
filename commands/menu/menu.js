const fs = require("fs");
const path = require("path");

module.exports = {
  command: ["menu", "help", "ayuda"],
  categoria: "menu",
  description: "Muestra el menú completo de SonGokuBot",

  run: async (client, m, { prefix }) => {
    try {
      const usedPrefix = prefix && prefix.length ? prefix : ".";
      const name = m.pushName || "Usuario";

      const uptimeMs = process.uptime() * 1000;
      const date = new Date().toLocaleDateString("es-PE");
      const time = new Date().toLocaleTimeString("es-PE");
      const mode = "Público";
      const country = "Perú 🇵🇪";

      const formatUptime = ms => {
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        return `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
      };

      const commandsDir = path.join(__dirname, "..");

      const getCommandFiles = dir => {
        let files = [];
        for (const file of fs.readdirSync(dir)) {
          const fullPath = path.join(dir, file);
          if (fs.statSync(fullPath).isDirectory()) {
            files = files.concat(getCommandFiles(fullPath));
          } else if (file.endsWith(".js")) {
            files.push(fullPath);
          }
        }
        return files;
      };

      const commandFiles = getCommandFiles(commandsDir);

      const categories = {};
      for (const file of commandFiles) {
        try {
          delete require.cache[require.resolve(file)];
          const cmd = require(file);

          if (!cmd.command || !cmd.categoria) continue;

          const category = cmd.categoria.toLowerCase() || "otros";
          const nameCmd = Array.isArray(cmd.command) ? cmd.command[0] : cmd.command;

          if (!categories[category]) categories[category] = new Set();
          categories[category].add(nameCmd);
        } catch {}
      }

      const sortedCategories = Object.keys(categories).sort();

      let menuText = `
☞︎︎︎SonGokuBO☜︎︎︎
⸼݇҉ֻ᠂⃟ꕥ─➤Lista comandos:  
╭──────────────────
╰─🅸︎🅽︎🅵︎🅾︎
│㆒⸼݇҉ֻ᠂⃟𓇽📅 Fecha : ${date}
│㆒⸼݇҉ֻ᠂⃟𓇽🕒 Hora  : ${time}
│㆒⸼݇҉ֻ᠂⃟𓇽🌎 País : ${country}
│㆒⸼݇҉ֻ᠂⃟𓇽⚙️ Modo : ${mode}
╰─────➤☆ۣۜۜ͜͡${name}𖣘⃟ᗒ
㆒⸼݇҉ֻ᠂⃟𓇽🤖 ActivoBOT: ${formatUptime(uptimeMs)}
━━━━━━━━━━━━━━━━━━━━
`.trimStart();

      for (const cat of sortedCategories) {
        const cmds = Array.from(categories[cat]).sort();
        menuText += `\n\`𝖒𝖊𝖓𝖚 ${cat.toUpperCase()} ⛤⃗͜\`\n`;
        menuText += `┌─⋅☆·̇·̣̇̇·̣̣̇·̣̇̇·̇⸼݇҉ֻ᠂⃟୨୧┈┈┈୨୧⸼݇҉ֻ᠂⃟·̇·̣̇̇·̣̣̇·̣̇̇☆─⋅┐\n`;
        cmds.forEach(cmd => {
          menuText += `│ ⋆➪ ${usedPrefix}${cmd}\n`;
        });
        menuText += `└─⋅☆·̇·̣̇̇·̣̣̇·̣̇̇·̇⸼݇҉ֻ᠂⃟୨୧┈┈┈୨୧⸼݇҉ֻ᠂⃟·̇·̣̇̇·̣̣̇·̣̇̇☆─⋅┘\n`;
      }

    const buttons = [
  {
    buttonId: `${usedPrefix}hosting`,
    buttonText: { displayText: "🤖 TENER BOT / HOSTING" },
    type: 1
  },
  {
    buttonId: `${usedPrefix}grupos`,
    buttonText: { displayText: "📢 GRUPOS OFICIALES" },
    type: 1
  }
];

      await client.sendMessage(
        m.chat,
        {
          image: { url: "https://i.ibb.co/Xrxbcymh/IMG-20241011-WA0000.jpg" },
          caption: menuText,
          buttons,
          footer: "🐉 SonGokuBot • Ultra Instinto • DVYER",
          headerType: 4
        },
        { quoted: m }
      );

    } catch (e) {
      console.error("MENU ERROR:", e);
      client.reply(m.chat, "❌ Error al mostrar el menú.", m);
    }
  }
};
