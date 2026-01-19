const fs = require("fs");
const path = require("path");

module.exports = {
  command: ["menu", "help", "ayuda"],
  categoria: "menu",
  description: "Muestra el menú completo de SonGokuBot con todos los comandos",

  run: async (client, m, { prefix }) => {
    try {
      const usedPrefix = prefix && prefix.length ? prefix : ".";

      const commandsDir = path.join(__dirname, "..");

      // 🔹 Obtener todos los archivos de comandos
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

      // 🔹 Agrupar comandos por categoría
      const categories = {};
      for (const file of commandFiles) {
        try {
          delete require.cache[require.resolve(file)];
          const cmd = require(file);

          if (!cmd.command || !cmd.categoria || !cmd.description) continue;

          const category = cmd.categoria || "Otros";
          const name = Array.isArray(cmd.command) ? cmd.command[0] : cmd.command;

          if (!categories[category]) categories[category] = [];
          categories[category].push({
            name,
            desc: cmd.description
          });
        } catch {}
      }

      // 🔹 Construir texto del menú
      let menuText = `🐉 *SonGokuBot v1.0* 🐉\n\n`;

      for (const cat in categories) {
        menuText += `╭─❑ *${cat.toUpperCase()}* ❑─╮\n`;
        categories[cat].forEach(c => {
          menuText += `〩 ${usedPrefix}${c.name}\n   ⤿ ${c.desc}\n`;
        });
        menuText += `╰─────────────╯\n\n`;
      }

      menuText += `✨ *SonGokuBot • Ultra Instinto • DVYER*`;

      // 🔹 BOTONES (CON PREFIJO, COMO PLAY)
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
          buttonText: { displayText: "ℹ️ INFO DEL BOT" },
          type: 1
        }
      ];

      // 🔹 Enviar menú (MISMO FORMATO QUE PLAY)
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