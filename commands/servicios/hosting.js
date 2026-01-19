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
        image: "https://i.ibb.co/rR84Ld7Q/sky.jpg",
        description: `↬ *Nombre:* Swallox Hosting
↬ *Servicios:*
    ⤿ Aloja tu bot de WhatsApp
    ⤿ Despliega páginas web
    ⤿ Minecraft & Python
↬ *Soporte:*
    ⤿ Canal WhatsApp: https://chat.whatsapp.com/xxxx
    ⤿ Grupo WhatsApp: https://chat.whatsapp.com/xxxx
↬ *Nota:* ${BOT_NAME} ya está en la lista de pre-bot`
      };

      await client.sendMessage(
        m.chat,
        {
          image: { url: hosting1.image },
          caption: `🖤 ${hosting1.name}\n\n${hosting1.description}`,
        },
        { quoted: m }
      );

      // 🔹 Segundo Hosting: SkyUltraPlus
      const hosting2 = {
        name: "SkyUltraPlus Hosting",
        image: "https://i.ibb.co/rR84Ld7Q/sky.jpg",
        description: `↬ *Nombre:* SkyUltraPlus Hosting
↬ *Servicios:*
    ⤿ Aloja tu bot de WhatsApp
    ⤿ Despliega páginas web y apps
    ⤿ Minecraft & Python
↬ *Soporte:*
    ⤿ Canal WhatsApp: https://chat.whatsapp.com/yyyy
    ⤿ Grupo WhatsApp: https://chat.whatsapp.com/yyyy
↬ *Nota:* ${BOT_NAME} ya está en la lista de pre-bot`
      };

      await client.sendMessage(
        m.chat,
        {
          image: { url: hosting2.image },
          caption: `🖤 ${hosting2.name}\n\n${hosting2.description}`,
        },
        { quoted: m }
      );

    } catch (e) {
      console.error("HOSTING ERROR:", e);
      client.reply(m.chat, "❌ Error al mostrar los hostings.", m);
    }
  }
};

