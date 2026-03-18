const { ensureUserData, lockProfileCharacter } = require("../../lib/dbzSystem");
const {
  findCharacter,
  formatCharacterCaption,
  imageUrlToJpegBuffer,
} = require("../../lib/dragonBallApi");

module.exports = {
  command: ["elegirdbz", "mipersonaje", "personajefijo", "personajeperfil"],
  categoria: "dbz",
  description: "Elige un personaje fijo de Dragon Ball para tu perfil",

  run: async (client, m, args, context = {}) => {
    try {
      const used = String(context.command || "mipersonaje").toLowerCase();
      const user = ensureUserData(m.sender, m.pushName || "Guerrero");

      if (["mipersonaje", "personajeperfil"].includes(used)) {
        if (!user.character?.id) {
          return client.reply(
            m.chat,
            "Aun no elegiste personaje fijo.\nUsa .elegirdbz <nombre o id>\nEjemplo: .elegirdbz goku",
            m,
            global.channelInfo,
          );
        }

        const imageBuffer = await imageUrlToJpegBuffer(user.character.image);
        return client.sendMessage(
          m.chat,
          {
            image: imageBuffer,
            caption:
              `PERSONAJE FIJO DBZ\n\n` +
              `Nombre: ${user.character.name}\n` +
              `ID: ${user.character.id}\n` +
              `Raza: ${user.character.race}\n` +
              `Afiliacion: ${user.character.affiliation}\n` +
              `Bloqueado: si\n\n` +
              `Este personaje ya quedo unido a tu perfil.`,
          },
          {
            quoted: m,
            ...global.channelInfo,
          },
        );
      }

      const query = args.join(" ").trim();
      if (!query) {
        return client.reply(
          m.chat,
          "Uso: .elegirdbz <nombre o id>\nEjemplos: .elegirdbz goku | .elegirdbz 1\n\nImportante: solo puedes elegir una vez.",
          m,
          global.channelInfo,
        );
      }

      if (user.character?.locked) {
        return client.reply(
          m.chat,
          `Ya elegiste a ${user.character.name} y tu personaje quedo bloqueado.\nUsa .mipersonaje para verlo.`,
          m,
          global.channelInfo,
        );
      }

      await client.reply(
        m.chat,
        "Sellando tu personaje DBZ...",
        m,
        {
          ...global.channelInfo,
          disableCommandArt: true,
        },
      );

      const character = await findCharacter(query);
      const selected = lockProfileCharacter(user, character);
      const imageBuffer = await imageUrlToJpegBuffer(selected.image);
      const caption =
        `${formatCharacterCaption(character)}\n\n` +
        `PERSONAJE FIJO ACTIVADO\n` +
        `Este personaje ya quedo cargado a tu perfil y no se puede cambiar.`;

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
      console.error("PERSONAJE FIJO DBZ ERROR:", error);
      await client.reply(
        m.chat,
        String(error.message || "No pude guardar tu personaje fijo."),
        m,
        global.channelInfo,
      );
    }
  },
};
