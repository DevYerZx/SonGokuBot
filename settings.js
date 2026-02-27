const fs = require("fs");
const chalk = require("chalk");

global.owner = ["51907376960"];
global.grupoOficial = "https://chat.whatsapp.com/DS3ttxXb1cVJttVlC2dTtL"
global.antiPrivado = true
global.sessionName = "SonGokuBot_session";
global.version = "SonGokuBot";
global.namebot = "SonGokuBOT";
global.author = "DvYer | SonGokuBot";


global.mess = {
  admin: "→ Esta función está reservada para los administradores del grupo",
  botAdmin: "→ Para ejecutar esta función debo ser administrador",
  owner: "→ Solo mi creador puede usar este comando",
  group: "→ Esta función solo funciona en grupos",
  private: "→ Esta función solo funciona en mensajes privados",
  wait: "→ Espera un momento...",
};


global.thumbnailUrl = "https://i.ibb.co/JR8Qz9j6/20251204-0617-Retrato-Misterioso-Mejorado-remix-01kbmh4newf9k8r1r0bafmxr46.png"; // Cambia esta imagen

global.my = {
  ch: "120363401477412280@newsletter",
};

global.channelInfo = {
  contextInfo: {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: "120363207586611704@newsletter", // ID de tu canal
      newsletterName: "SonGokuBot DvYer",
      serverMessageId: -1,
    },
  },
};

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.yellowBright(`Actualización '${__filename}'`));
  delete require.cache[file];
  require(file);
});
