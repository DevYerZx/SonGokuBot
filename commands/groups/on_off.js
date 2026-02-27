module.exports = {
  command: ["on", "off"],
  categoria: "grupos",
  isGroup: true,
  isAdmin: true,
  isBotAdmin: true,

  run: async (client, m, args) => {
    const cmd = m.command; // on u off
    const feature = args[0]?.toLowerCase();

    if (!feature) {
      return m.reply(
        "Debes indicar qué activar o desactivar\n\nEjemplo:\n.on antilink\n.off antilink"
      );
    }

    const chatData = global.db.data.chats[m.chat];
    if (!chatData) return m.reply("Error en la base de datos");

    switch (feature) {
      case "antilink":
        chatData.antilink = cmd === "on";
        m.reply(
          `✅ *Antilink* ha sido *${cmd === "on" ? "ACTIVADO" : "DESACTIVADO"}*`
        );
        break;

      default:
        m.reply(
          "Función no válida\n\nFunciones disponibles:\n- antilink"
        );
    }
  },
};

