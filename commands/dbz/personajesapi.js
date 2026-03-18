const {
  findCharacter,
  formatCharacterCaption,
  getRandomCharacter,
  imageUrlToJpegBuffer,
} = require("../../lib/dragonBallApi");

const DIRECT_CHARACTER_COMMANDS = {
  goku: "Goku",
  vegeta: "Vegeta",
  gohan: "Gohan",
  piccolo: "Piccolo",
  freezer: "Freezer",
  broly: "Broly",
  whis: "Whis",
  beerus: "Beerus",
};

module.exports = {
  command: [
    "personajedbz",
    "dbzpersonaje",
    "dbzrandom",
    ...Object.keys(DIRECT_CHARACTER_COMMANDS),
  ],
  categoria: "dbz",
  description: "Busca personajes reales de Dragon Ball con imagen",

  run: async (client, m, args, context = {}) => {
    try {
      const used = String(context.command || "personajedbz").toLowerCase();
      const directName = DIRECT_CHARACTER_COMMANDS[used];
      const query = directName || args.join(" ").trim();
      const isRandom = used === "dbzrandom";

      if (!isRandom && !query) {
        return client.reply(
          m.chat,
          "Uso: .personajedbz <nombre o id>\nEjemplos: .personajedbz goku | .goku | .dbzrandom",
          m,
          global.channelInfo,
        );
      }

      await client.reply(
        m.chat,
        "Buscando energia de Dragon Ball...",
        m,
        {
          ...global.channelInfo,
          disableCommandArt: true,
        },
      );

      const character = isRandom
        ? await getRandomCharacter()
        : await findCharacter(query);
      const imageBuffer = await imageUrlToJpegBuffer(character.image);
      const caption = formatCharacterCaption(character, { isRandom });

      await client.sendMessage(
        m.chat,
        {
          image: imageBuffer,
          caption,
        },
        {
          quoted: m,
          ...global.channelInfo,
        },
      );
    } catch (error) {
      console.error("PERSONAJE DBZ API ERROR:", error);
      await client.reply(
        m.chat,
        String(error.message || "No pude obtener el personaje DBZ."),
        m,
        global.channelInfo,
      );
    }
  },
};
