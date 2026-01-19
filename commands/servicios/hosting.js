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
        image: "https://i.ibb.co/0p1FWXT9/IMG-20260119-WA0055.jpg",
        description: `
╭─❑ *🌌 ${BOT_NAME} Pre-Bot en Swallox* ❑─╮
↬ *Sitio Web:* https://dash.swallox.com/
↬ *Servicios Disponibles:*
   ⤿ Aloja tu bot de WhatsApp
   ⤿ Despliega páginas web
   ⤿ Minecraft & Python
↬ *Soporte Oficial:*
   ⤿ Canal WhatsApp: https://chat.whatsapp.com/xxxx
   ⤿ Grupo WhatsApp: https://chat.whatsapp.com/xxxx
↬ *Beneficio:* ${BOT_NAME} ya está en la lista de pre-bot
╰───────────────────────────────╯
`
      };

      // 🔹 Segundo Hosting: SkyUltraPlus
      const hosting2 = {
        name: "SkyUltraPlus Hosting",
        image: "https://i.ibb.co/3mk1WyBY/IMG-20260119-WA0052.jpg",
        description: `
╭─❑ *☄ ${BOT_NAME} Pre-Bot en SkyUltraPlus* ❑─╮
↬ *Sitio Web:* https://skyultraplus.com/
↬ *Servicios Disponibles:*
   ⤿ Aloja tu bot de WhatsApp
   ⤿ Despliega páginas web y apps
   ⤿ Minecraft & Python
↬ *Soporte Oficial:*
   ⤿ Canal WhatsApp: https://chat.whatsapp.com/yyyy
   ⤿ Grupo WhatsApp: https://chat.whatsapp.com/yyyy
↬ *Beneficio:* ${BOT_NAME} ya está en la lista de pre-bot
╰───────────────────────────────╯
`
      };

      // 🔹 Array de hostings
      const hostings = [hosting1, hosting2];

      // 🔹 Mezclar aleatoriamente
      const shuffled = hostings.sort(() => Math.random() - 0.5);

      // 🔹 Enviar cada hosting con diseño diferente
      for (const h of shuffled) {
        await client.sendMessage(
          m.chat,
          {
            image: { url: h.image },
            caption: h.description,
          },
          { quoted: m }
        );
      }

    } catch (e) {
      console.error("HOSTING ERROR:", e);
      client.reply(m.chat, "❌ Error al mostrar los hostings.", m);
    }
  }
};


