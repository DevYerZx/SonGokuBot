module.exports = {
  command: ["grupos", "gruposoficiales"],
  categoria: "informacion",
  description: "Grupos oficiales de SonGokuBot",

  run: async (client, m) => {
    const caption =
`📢 *GRUPOS OFICIALES DE SonGokuBot* 🐉

🌐 *Comunidad oficial*
https://chat.whatsapp.com/GuLWXlFUdy3BJA9OXcc1Hj

👥 *SonGokuBot 1*
https://chat.whatsapp.com/EiKOEeHRq6zAJEjfmiQ9pg

👥 *SonGokuBot 2*
https://chat.whatsapp.com/DS3ttxXb1cVJttVlC2dTtL

⚠️ *Reglas básicas*
• No spam
• Respeto obligatorio
• No links externos

👇 Usa los botones para otras opciones
`;

    await client.sendMessage(
      m.chat,
      {
        image: {
          url: "https://i.ibb.co/RTHtNc95/Songokugrupos.png" // 🔁 cambia la imagen si quieres
        },
        caption,
        buttons: [
          {
            buttonId: ".menu",
            buttonText: { displayText: "📜 MENÚ" },
            type: 1
          },
          {
            buttonId: ".hosting",
            buttonText: { displayText: "🤖 HOSTING / BOT" },
            type: 1
          }
        ],
        footer: "🐉 SonGokuBot • DVYER",
        headerType: 4
      },
      { quoted: m }
    );
  }
};

