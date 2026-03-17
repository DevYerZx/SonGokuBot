const fs = require("fs");
const path = require("path");
const {
  deleteFileSafe,
  downloadAbsoluteFile,
  ensureTmpDir,
  extractYouTubeUrl,
  getCooldownRemaining,
  isHttpUrl,
  normalizeMp4Name,
  normalizeVideoForWhatsApp,
  resolveFastestVideo,
  resolveYouTubeSearch,
  safeFileName,
  sendVideoOrDocument,
  stripExtension,
} = require("../../lib/dvyerApi");

const BOT_NAME = global.namebot || "SonGokuBot";
const VIDEO_QUALITY = "360p";
const COOLDOWN_TIME = 15 * 1000;
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
const VIDEO_AS_DOCUMENT_THRESHOLD = 70 * 1024 * 1024;
const TMP_DIR = ensureTmpDir("ytmp4");

const cooldowns = new Map();

module.exports = {
  command: ["ytmp4", "ytvideo"],
  categoria: "descarga",
  description: "Descarga video de YouTube con la API nueva",

  run: async (client, m, args) => {
    const userId = `${m.sender}:video`;
    let rawVideoFile = null;
    let finalVideoFile = null;

    const until = cooldowns.get(userId);
    if (until && until > Date.now()) {
      return client.reply(
        m.chat,
        `⏳ Espera ${getCooldownRemaining(until)}s antes de volver a usar este comando.`,
        m,
        global.channelInfo,
      );
    }

    cooldowns.set(userId, Date.now() + COOLDOWN_TIME);

    try {
      const rawInput = args.join(" ").trim();
      if (!rawInput) {
        cooldowns.delete(userId);
        return client.reply(
          m.chat,
          "❌ Usa .ytmp4 <nombre o link de YouTube>",
          m,
          global.channelInfo,
        );
      }

      let videoUrl = extractYouTubeUrl(rawInput);
      let title = "video";
      let thumbnail = null;

      if (!videoUrl) {
        if (isHttpUrl(rawInput)) {
          cooldowns.delete(userId);
          return client.reply(
            m.chat,
            "❌ Envia un link valido de YouTube.",
            m,
            global.channelInfo,
          );
        }

        const search = await resolveYouTubeSearch(rawInput);
        videoUrl = search.videoUrl;
        title = search.title || title;
        thumbnail = search.thumbnail;
      }

      await client.sendMessage(
        m.chat,
        thumbnail
          ? {
              image: { url: thumbnail },
              caption: `🎬 Preparando video...\n\nTitulo: ${title}\nCalidad: ${VIDEO_QUALITY}\nAPI: ${BOT_NAME}`,
            }
          : {
              text: `🎬 Preparando video...\n\nTitulo: ${title}\nCalidad: ${VIDEO_QUALITY}\nAPI: ${BOT_NAME}`,
            },
        { quoted: m, ...global.channelInfo },
      );

      const linkResult = await resolveFastestVideo(videoUrl, VIDEO_QUALITY);
      title = safeFileName(linkResult.title || title || "video");

      const stamp = Date.now();
      rawVideoFile = path.join(TMP_DIR, `${stamp}-raw.mp4`);
      finalVideoFile = path.join(TMP_DIR, `${stamp}-final.mp4`);

      const downloaded = await downloadAbsoluteFile(linkResult.resolvedDownloadUrl, {
        outputPath: rawVideoFile,
        maxBytes: MAX_VIDEO_BYTES,
        minBytes: 150000,
      });

      const normalized = await normalizeVideoForWhatsApp(
        downloaded.tempPath,
        finalVideoFile,
      );
      const sendPath =
        normalized && fs.existsSync(finalVideoFile) ? finalVideoFile : rawVideoFile;
      const sendSize = fs.existsSync(sendPath) ? fs.statSync(sendPath).size : downloaded.size;
      const finalTitle = safeFileName(
        stripExtension(linkResult.fileName || `${title}.mp4`) || title,
      );

      await sendVideoOrDocument(
        client,
        m.chat,
        { quoted: m, ...global.channelInfo },
        {
          filePath: sendPath,
          fileName: normalizeMp4Name(linkResult.fileName || `${finalTitle}.mp4`),
          title: finalTitle,
          size: sendSize,
          documentThreshold: VIDEO_AS_DOCUMENT_THRESHOLD,
          caption: `🎬 ${finalTitle}\nCalidad: ${VIDEO_QUALITY}${linkResult.duration ? `\nDuracion: ${linkResult.duration}` : ""}\n🤖 ${BOT_NAME}`,
        },
      );
    } catch (error) {
      console.error("YTMP4 ERROR:", error?.message || error);
      cooldowns.delete(userId);

      await client.reply(
        m.chat,
        String(error?.message || "❌ Error al descargar o enviar el video."),
        m,
        global.channelInfo,
      );
    } finally {
      deleteFileSafe(rawVideoFile);
      deleteFileSafe(finalVideoFile);
    }
  },
};
