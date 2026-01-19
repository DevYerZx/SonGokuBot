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

      const commandsDir = path.join(__dirname, "..");

      // 🔹 Leer comandos
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

      // 🔹 Agrupar por categoría
      const categories = {};
      for (const file of commandFiles) {
        try {
          delete require.cache[require.resolve(file)];
          const cmd = require(file);

          if (!cmd.command || !cmd.categoria) continue;

          const category = cmd.categoria || "otros";
          const nameCmd = Array.isArray(cmd.command) ? cmd.command[0] : cmd.command;

          if (!categories[category]) categories[category] = [];
          categories[category].push(nameCmd);
        } catch {}
      }

      // 🔹 BEFORE (DISEÑO EDITADO)
      let menuText = `
☞︎︎︎SonGokuBO☜︎︎︎
⸼݇҉ֻ᠂⃟ꕥ─➤Github: https://github.com/DevYerZx/SonGokuBot 
╭──────────────────
╰─🅸︎🅽︎🅵︎🅾︎
│㆒⸼݇҉ֻ᠂⃟𓇽📅 Fecha : ${date}
│㆒⸼݇҉ֻ᠂⃟𓇽🕒 Hora  : ${time}
│㆒⸼݇҉ֻ᠂⃟𓇽🌎 País : ${country}
│㆒⸼݇҉ֻ᠂⃟𓇽⚙️ Modo : ${mode}
╰─────➤☆ۣۜۜ͜͡${name}𖣘⃟ᗒ  
㆒⸼݇҉ֻ᠂⃟𓇽🤖 ActivoBOT: ${client.msToTime
        ? client.msToTime(uptimeMs)
        : `${Math.floor(process.uptime())}s`}

━━━━━━━━━━━━━━━━━━━━
`.trimStart();

      // 🔹 MENÚ POR CATEGORÍA
      for (const cat in categories) {
        menuText += `\n\`𝖒𝖊𝖓𝖚 ${cat.toUpperCase()} ⛤⃗͜\`\n`;
        menuText += `┌─⋅☆·̇·̣̇̇·̣̣̇·̣̇̇·̇⸼݇҉ֻ᠂⃟୨୧┈┈┈୨୧⸼݇҉ֻ᠂⃟·̇·̣̇̇·̣̣̇·̣̇̇☆─⋅┐\n`;

        categories[cat].forEach(cmd => {
          menuText += `│ ⋆➪ ${usedPrefix}${cmd}\n`;
        });

        menuText += `└─⋅☆·̇·̣̇̇·̣̣̇·̣̇̇·̇⸼݇҉ֻ᠂⃟୨୧┈┈┈୨୧⸼݇҉ֻ᠂⃟·̇·̣̇̇·̣̣̇·̣̇̇☆─⋅┘\n`;
      }

      // 🔹 BOTONES
      const buttons = [
        {
          buttonId: `${usedPrefix}hosting`,
          buttonText: { displayText: "🤖 TENER BOT / HOSTING" },
          type: 1
        },
        {
          buttonId: `${usedPrefix}menu_peliculas`,
          buttonText: { displayText: "🎬 MENÚ PELÍCULAS" },
          type: 1
        },
        {
          buttonId: `${usedPrefix}getbot`,
          buttonText: { displayText: "ℹ️ INFO BOT" },
          type: 1
        }
      ];

      // 🔹 ENVIAR
      await client.sendMessage(
        m.chat,
        {
          image: {
            url: "https://i.ibb.co/Xrxbcymh/IMG-20241011-WA0000.jpg"
          },
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