const fs = require("fs");
const chalk = require("chalk");

const ownerList = String(process.env.SONGOKU_OWNER || "51907376960")
  .split(",")
  .map((value) => value.replace(/\D/g, "").trim())
  .filter(Boolean);

global.owner = ownerList.length ? ownerList : ["51907376960"];
global.grupoOficial = "https://chat.whatsapp.com/DS3ttxXb1cVJttVlC2dTtL";
global.antiPrivado = true;
global.sessionName =
  (process.env.SONGOKU_SESSION_NAME || "SonGokuBot_session").trim() ||
  "SonGokuBot_session";
global.version = "SonGokuBot";
global.namebot = (process.env.SONGOKU_BOT_NAME || "SonGokuBOT").trim() || "SonGokuBOT";
global.author = (process.env.SONGOKU_BOT_AUTHOR || "DvYer | SonGokuBot").trim() || "DvYer | SonGokuBot";
global.api = {
  baseUrl: (process.env.DVYER_API_BASE || "https://dv-yer-api.online").trim(),
  key: (process.env.DVYER_API_KEY || "").trim(),
  requestTimeout: Number(process.env.DVYER_API_TIMEOUT || 120000),
};
global.subbot = {
  maxLinks: Math.max(1, Number(process.env.SUBBOT_MAX_LINKS || 3) || 3),
  basePort: Math.max(3001, Number(process.env.SUBBOT_BASE_PORT || 3300) || 3300),
};


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
  ch: "120363423619533679@newsletter",
};

global.channelInfo = {
  contextInfo: {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: "120363354701957370@newsletter", // ID de tu canal
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
