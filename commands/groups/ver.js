/**
 * ============================================================
 *  🔓 MÓDULO DE ANÁLISIS DE CONTENIDO EFÍMERO
 * ============================================================
 *
 *  📌 Función:
 *  - Detecta mensajes de vista única (imagen / video)
 *  - Extrae el contenido sin alertar al remitente
 *  - Reenvía el archivo al privado del dueño del bot
 *
 *  🔐 Seguridad:
 *  - Solo números autorizados pueden ejecutar el comando
 *  - Ignora cualquier uso externo o no permitido
 *
 *  🧠 Diseño:
 *  - Código modular
 *  - Manejo silencioso de errores
 *  - Flujo limpio y controlado
 *
 *  👨‍💻 Creador: Dvyer
 * ============================================================
 */

const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

module.exports = {
  // 🧩 Comandos que activan el módulo
  //command: ["ñam", "uff", ".", "1", "xd"],

  // 📂 Categoría interna
  //categoria: "dueño",

  // 📝 Descripción interna
  description: "Extrae contenido efímero y lo envía al owner",

  /**
   * ============================================================
   *  🚀 EJECUCIÓN PRINCIPAL
   * ============================================================
   */
  run: async (client, m) => {
    try {

      // ========================================================
      // 🔐 CONTROL DE ACCESO — USUARIOS AUTORIZADOS
      // ========================================================
      const allowedUsers = [
        "51907376960@s.whatsapp.net",
        "51917391317@s.whatsapp.net",
        "519XXXXXXXX@s.whatsapp.net"
      ];

      // ⛔ Bloqueo inmediato si no está autorizado
      if (!allowedUsers.includes(m.sender)) return;

      // ========================================================
      // 📎 VALIDACIÓN — DEBE SER RESPUESTA A UN MENSAJE
      // ========================================================
      if (!m.quoted) return;

      // ========================================================
      // 👑 IDENTIFICACIÓN DEL DUEÑO REAL DEL BOT
      // ========================================================
      const ownerJid = client.decodeJid(client.user.id);

      // ========================================================
      // 🧠 ANÁLISIS PROFUNDO DEL MENSAJE CITADO
      // ========================================================
      const quotedMessage = m.quoted.message;

      /**
       * WhatsApp maneja las vistas únicas en múltiples estructuras.
       * Este bloque intenta capturar TODAS las variantes conocidas.
       */
      const viewOnceContent =
        quotedMessage?.viewOnceMessageV2?.message ||
        quotedMessage?.viewOnceMessageV2Extension?.message ||
        quotedMessage?.viewOnceMessage?.message ||
        quotedMessage;

      if (!viewOnceContent) return;

      // ========================================================
      // 🎯 DETECCIÓN DE TIPO DE CONTENIDO
      // ========================================================
      const image = viewOnceContent.imageMessage;
      const video = viewOnceContent.videoMessage;

      // ========================================================
      // 🖼️ PROCESAMIENTO DE IMAGEN
      // ========================================================
      if (image) {
        const buffer = await downloadViewOnce(image);

        await client.sendMessage(ownerJid, {
          image: buffer,
          caption: "🔓 *Contenido efímero procesado*\n👨‍💻 Dvyer"
        });

        return;
      }

      // ========================================================
      // 🎬 PROCESAMIENTO DE VIDEO
      // ========================================================
      if (video) {
        const buffer = await downloadViewOnce(video);

        await client.sendMessage(ownerJid, {
          video: buffer,
          caption: "🔓 *Contenido efímero procesado*\n👨‍💻 Dvyer"
        });

        return;
      }

    } catch (err) {
      // ========================================================
      // 🛑 MANEJO SILENCIOSO DE ERRORES
      // ========================================================
      console.log("⚠️ Error en módulo de vista única:", err);
    }
  }
};

/**
 * ============================================================
 *  📥 FUNCIÓN DE DESCARGA DE CONTENIDO EFÍMERO
 * ============================================================
 *
 *  - Convierte stream → buffer
 *  - Compatible con imagen y video
 *  - Manejo eficiente de memoria
 *
 * ============================================================
 */
async function downloadViewOnce(message) {
  const mediaType = message.mimetype.split("/")[0];
  const stream = await downloadContentFromMessage(message, mediaType);

  let buffer = Buffer.from([]);

  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }

  return buffer;
}
