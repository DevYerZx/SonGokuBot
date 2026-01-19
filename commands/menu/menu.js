const fs = require("fs");
const path = require("path");

module.exports = {
  command: ["menu", "help", "ayuda"],
  categoria: "menu",
  description: "Muestra el menú completo de SonGokuBot con todos los comandos",

  run: async (client, m, { prefix }) => {
    try {
      const usedPrefix = prefix && prefix.length ? prefix : ".";

      // 🔹 Carpeta donde están los comandos
      const commandsDir = path.join(__dirname, ".."); // Ajusta según tu estructura
      const commandFiles = fs.readdirSync(commandsDir).filter(f => f.endsWith(".js"));

      // 🔹 Agrupar comandos válidos por categoría
      const categories = {};
      for (const file of commandFiles) {
        try {
          const cmd = require(path.join(commandsDir, file));
          
          // ✅ Solo comandos que tengan command, categoria y description
          if (!cmd.command || !cmd.categoria || !cmd.description) continue;

          const category = cmd.categoria || "Otros";
          const name = Array.isArray(cmd.command) ? cmd.command[0] : cmd.command;
          const desc = cmd.description;

          if (!categories[category]) categories[category] = [];
          categories[category].push({ name, desc });
        } catch (err) {
          console.log("ERROR CARGANDO COMANDO:", file, err.message);
        }
      }

      // 🔹 Construir el texto del menú
      let menuText = `🐉 *SonGokuBot - Menú Completo* 🐉\n\n`;
      for (const cat in categories) {
        menuText += `╭───〔 ${cat.toUpperCase()} 〕───╮\n`;
        categories[cat].forEach(c => {
          menuText += `⚡ ${usedPrefix}${c.name}\n   📝 ${c.desc}\n`;
        });
        menuText += `╰────────────────────────╯\n\n`;
      }
      menuText += `🤖 SonGokuBot • Ultra Instinto • DVYER`;

      // 🔹 Botones principales
      const buttons = [
        { buttonId: `${usedPrefix}menu_descargas`, buttonText: { displayText: "📥 DESCARGAS" }, type: 1 },
        { buttonId: `${usedPrefix}menu_peliculas`, buttonText: { displayText: "🎬 PELÍCULAS" }, type: 1 },
        { buttonId: `${usedPrefix}getbot`, buttonText: { displayText: "🤖 INFO BOT" }, type: 1 },
      ];

      // 🔹 Enviar el menú
      await client.sendMessage(
        m.chat,
        {
          image: { url: "https://i.ibb.co/Xrxbcymh/IMG-20241011-WA0000.jpg" },
          caption: menuText,
          footer: "🐉 SonGokuBot • Ultra Instinto • DVYER",
          buttons,
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

