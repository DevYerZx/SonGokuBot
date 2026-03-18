const {
  findCharacter,
  formatTransformationCaption,
  formatTransformationsList,
  imageUrlToJpegBuffer,
} = require("../../lib/dragonBallApi");

module.exports = {
  command: ["transformacionesdbz", "dbztransformaciones", "formasdbz"],
  categoria: "dbz",
  description: "Muestra las transformaciones reales de un personaje DBZ",

  run: async (client, m, args) => {
    try {
      if (!args.length) {
        return client.reply(
          m.chat,
          "Uso: .transformacionesdbz <personaje o id> [numero]\nEjemplos: .transformacionesdbz goku | .transformacionesdbz goku 2",
          m,
          global.channelInfo,
        );
      }

      const lastArg = String(args[args.length - 1] || "").trim();
      const requestedIndex = /^\d+$/.test(lastArg) ? Number(lastArg) : null;
      const query = requestedIndex
        ? args.slice(0, -1).join(" ").trim()
        : args.join(" ").trim();

      if (!query) {
        return client.reply(
          m.chat,
          "Debes indicar el personaje.\nEjemplo: .transformacionesdbz goku",
          m,
          global.channelInfo,
        );
      }

      await client.reply(
        m.chat,
        "Consultando transformaciones de Dragon Ball...",
        m,
        {
          ...global.channelInfo,
          disableCommandArt: true,
        },
      );

      const character = await findCharacter(query);

      if (!character.transformations.length) {
        return client.reply(
          m.chat,
          `${character.name} no tiene transformaciones registradas en la API.`,
          m,
          global.channelInfo,
        );
      }

      if (!requestedIndex) {
        const imageBuffer = await imageUrlToJpegBuffer(character.image);
        return client.sendMessage(
          m.chat,
          {
            image: imageBuffer,
            caption: formatTransformationsList(character),
          },
          {
            quoted: m,
            ...global.channelInfo,
          },
        );
      }

      const selected = character.transformations[requestedIndex - 1];
      if (!selected) {
        return client.reply(
          m.chat,
          `Ese numero no existe. ${character.name} tiene ${character.transformations.length} transformaciones.`,
          m,
          global.channelInfo,
        );
      }

      const imageBuffer = await imageUrlToJpegBuffer(selected.image || character.image);
      await client.sendMessage(
        m.chat,
        {
          image: imageBuffer,
          caption: formatTransformationCaption(
            character,
            selected,
            requestedIndex - 1,
          ),
        },
        {
          quoted: m,
          ...global.channelInfo,
        },
      );
    } catch (error) {
      console.error("TRANSFORMACIONES DBZ API ERROR:", error);
      await client.reply(
        m.chat,
        String(error.message || "No pude obtener las transformaciones DBZ."),
        m,
        global.channelInfo,
      );
    }
  },
};
