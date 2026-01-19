module.exports = {
  command: ["antilink"],
  description: "Activa o desactiva funciones del grupo",
  categoria: "grupos",
  use: "antilink",
  isGroup: true,
  isAdmin: true,
  isBotAdmin: true,

  run: async (client, m, args) => {
    const cmd = m.text.trim().split(" ")[0].slice(1).toLowerCase();
    const setting = args[0]?.toLowerCase();

    if (!setting) {
      return m.reply(
        "Debes especificar la función\n\nEjemplo:\n.on antilink\n.off antilink",
      );
    }

    const chatData = global.db.data.chats[m.chat];
    if (!chatData) return m.reply("Error en la base de datos");

    switch (setting) {
      case "antilink":
        chatData.antilink = cmd === "on";
        m.reply(
          `La función *Antilink* ha sido *${cmd === "on" ? "activada" : "desactivada"}*`,
        );
        break;

      default:
        m.reply(
          "Opción no válida\n\nOpciones:\nantilink\n\nEjemplo:\n.on antilink",
        );
    }
  },
};

