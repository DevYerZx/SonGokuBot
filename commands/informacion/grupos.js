module.exports = {
  command: ["grupos", "gruposoficiales"],
  categoria: "informacion",

  run: async (client, m) => {
    await client.sendMessage(
      m.chat,
      {
        text: "📢 *Grupos oficiales de SonGokuBot* 🐉\n\nElige a cuál unirte:",
        buttons: [
          {
            buttonId: "https://chat.whatsapp.com/COMUNIDAD_LINK",
            buttonText: { displayText: "🌐 Comunidad" },
            type: 1
          },
          {
            buttonId: "https://chat.whatsapp.com/GRUPO1_LINK",
            buttonText: { displayText: "👥 SonGokuBot 1" },
            type: 1
          },
          {
            buttonId: "https://chat.whatsapp.com/GRUPO2_LINK",
            buttonText: { displayText: "👥 SonGokuBot 2" },
            type: 1
          }
        ],
        footer: "🐉 SonGokuBot • DVYER"
      },
      { quoted: m }
    );
  }
};
