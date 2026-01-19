const fs = require("fs");
const path = require("path");

module.exports = {
  command: ["menu", "help", "ayuda"],
  categoria: "menu",
  description: "Muestra el menú completo de SonGokuBot en catálogo",

  run: async (client, m, { prefix }) => {
    try {
      const usedPrefix = prefix && prefix.length ? prefix : ".";

      // 🔹 Leer todos los comandos
      const commandsPath = path.join(__dirname, ".."); // Ajusta según tu estructura
      const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

      let menuText = `🐉 𝗦𝗼𝗻𝗚𝗼𝗸𝘂𝗕𝗼𝘁 - Menú de Comandos 📜\n\n`;

      for (const file of commandFiles) {
        try {
          const cmd = require(path.join(commandsPath, file));
          const cmdName = Array.isArray(cmd.command) ? cmd.command.join(", ") : cmd.command;
          const desc = cmd.description || cmd.descripcion || "Sin descripción";

          menuText += `⚡ ${usedPrefix}${cmdName}\n   📝 ${desc}\n\n`;
        } catch (e) {
          console.log("Error cargando comando:", file, e.message);
        }
      }

      menuText += `🤖 SonGokuBot • Ultra Instinto • DVYER`;

      // 🔹 Crear catálogo
      const sections = [
        {
          title: "📜 Comandos Disponibles",
          rows: commandFiles.map(file => {
            try {
              const cmd = require(path.join(commandsPath, file));
              const cmdName = Array.isArray(cmd.command) ? cmd.command[0] : cmd.command;
              const desc = cmd.description || cmd.descripcion || "Sin descripción";

              return {
                title: `${usedPrefix}${cmdName}`,
                description: desc,
                rowId: `${usedPrefix}${cmdName}`
              };
            } catch {
              return null;
            }
          }).filter(Boolean)
        }
      ];

      const catalogMessage = {
        text: menuText,
        footer: "🐉 SonGokuBot • Ultra Instinto • DVYER",
        title: "📋 Menú Completo",
        buttonText: "Ver comandos",
        sections
      };

      await client.sendMessage(m.chat, catalogMessage, { quoted: m });

    } catch (e) {
      console.error("MENU ERROR:", e);
      client.reply(m.chat, "❌ Error al mostrar el menú.", m);
    }
  }
};
