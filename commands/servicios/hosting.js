module.exports = {
  command: ["hostig", "hosting"],
  categoria: "menu",
  description: "Muestra los hostings donde puedes desplegar bots de WhatsApp y más",

  run: async (client, m, { prefix }) => {
    try {
      const BOT_NAME = "SonGokuBot";

      // 🔹 Primer Hosting: Swallox
      const hosting1 = {
        name: "Swallox Hosting",
        description: `🔹 Aloja tu bot de WhatsApp
🔹 Despliega páginas web
🔹 Minecraft & Python
🔹 Soporte oficial en su canal y grupo de WhatsApp
🔹 ${BOT_NAME} ya está en la lista de pre-bot`,
        image: "https://skyultraplus.com/assets/og-image.jpg",
        buttons: [
          { buttonId: `${prefix}swallox_web`, buttonText: { displayText: "🌐 Sitio Web" }, type: 1 },
          { buttonId: `${prefix}swallox_group`, buttonText: { displayText: "💬 Grupo WhatsApp" }, type: 1 },
          { buttonId: `${prefix}swallox_channel`, buttonText: { displayText: "📢 Canal WhatsApp" }, type: 1 }
        ]
      };

      await client.sendMessage(
        m.chat,
        {
          image: { url: hosting1.image },
          caption: `🖤 *${hosting1.name}*\n\n⤿ ${hosting1.description}`,
          buttons: hosting1.buttons,
          footer: "🐉 SonGokuBot • Ultra Instinto • DVYER",
          headerType: 4
        },
        { quoted: m }
      );

      // 🔹 Segundo Hosting: SkyUltraPlus
      const hosting2 = {
        name: "SkyUltraPlus Hosting",
        description: `🔹 Aloja tu bot de WhatsApp
🔹 Despliega páginas web y apps
🔹 Minecraft & Python
🔹 Soporte oficial en su canal y grupo de WhatsApp
🔹 ${BOT_NAME} ya está en la lista de pre-bot`,
        image: "https://skyultraplus.com/assets/og-image.jpg",
        buttons: [
          { buttonId: `${prefix}sky_web`, buttonText: { displayText: "🌐 Sitio Web" }, type: 1 },
          { buttonId: `${prefix}sky_group`, buttonText: { displayText: "💬 Grupo WhatsApp" }, type: 1 },
          { buttonId: `${prefix}sky_channel`, buttonText: { displayText: "📢 Canal WhatsApp" }, type: 1 }
        ]
      };

      await client.sendMessage(
        m.chat,
        {
          image: { url: hosting2.image },
          caption: `🖤 *${hosting2.name}*\n\n⤿ ${hosting2.description}`,
          buttons: hosting2.buttons,
          footer: "🐉 SonGokuBot • Ultra Instinto • DVYER",
          headerType: 4
        },
        { quoted: m }
      );

    } catch (e) {
      console.error("HOSTING ERROR:", e);
      client.reply(m.chat, "❌ Error al mostrar los hostings.", m);
    }
  }
};
