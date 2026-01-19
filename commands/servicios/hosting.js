module.exports = {
  command: ["hostig", "hosting", "alojamiento"],
  categoria: "servicios",
  description: "Muestra los servicios de hosting para bots y proyectos web",

  run: async (client, m, { prefix }) => {
    try {
      const usedPrefix = prefix && prefix.length ? prefix : ".";

      const text =
`📌 *Hosting y despliegue disponibles para tu bot o proyecto web:*

➤ *Swallox Hosting*
   • Plataforma para alojar bots de WhatsApp y otros proyectos web.
   • Permite desplegar Python, páginas web o Minecraft sin complicaciones.
   • Panel de administración con acceso desde navegador.
   • Mantén tu proyecto activo 24/7 con estabilidad y monitoreo.
   • Sitio web: https://dash.swallox.com/ 

➤ *SkyUltraPlus Hosting*
   • Hosting especializado para bots (WhatsApp, Telegram, Discord).
   • VPS y servidores con Node.js, Python, Minecraft y proyectos web.
   • Diferentes planes según recursos, ideales para bots siempre online. :contentReference[oaicite:0]{index=0}

🤖 *SonGokuBot está incluido en la LISTA DE PRE‑BOTS* listo para instalar en estas plataformas.*`;

      // Enviar descripción principal con foto
      await client.sendMessage(
        m.chat,
        {
          image: { url: "https://i.ibb.co/Xrxbcymh/IMG-20241011-WA0000.jpg" },
          caption: text,
        },
        { quoted: m }
      );

      // Botones con enlaces directos (URL)
      const buttons = [
        {
          buttonId: "url: https://dash.swallox.com/",
          buttonText: { displayText: "VISITAR SWALLOX" },
          type: 1
        },
        {
          buttonId: "url: https://dash.swallox.com/", // mismo enlace para ejemplo
          buttonText: { displayText: "VISITAR SKYULTRAPLUS" },
          type: 1
        },
        {
          buttonId: `${usedPrefix}getbot`,
          buttonText: { displayText: "📌 INFO SONGOKU BOT" },
          type: 1
        }
      ];

      await client.sendMessage(
        m.chat,
        {
          text: `🔗 Enlaces de Hosting`,
          footer: "SonGokuBot • Ultra Instinto • DVYER",
          buttons
        },
        { quoted: m }
      );

    } catch (e) {
      console.error("HOSTING MENU ERROR:", e);
      client.reply(m.chat, "❌ Error al mostrar el menú de hosting.", m);
    }
  }
};
