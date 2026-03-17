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
  stripExtension,
} = require("../../lib/dvyerApi");

const BOT_NAME = global.namebot || "SonGokuBot";
const VIDEO_QUALITY = "360p";
const COOLDOWN_TIME = 15 * 1000;
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
const TMP_DIR = ensureTmpDir("ytdoc");

const cooldowns = new Map();

module.exports = {
  command: ["ytdoc"],
  categoria: "descarga",
  description: "Descarga video de YouTube y lo envia como documento",

  run: async (client, m, args) => {
    let rawVideoFile = null;
    let finalVideoFile = null;
    const userId = `${m.sender}:ytdoc`;

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
          "❌ Usa .ytdoc <nombre o link de YouTube>",
          m,
          global.channelInfo,
        );
      }

      let videoUrl = extractYouTubeUrl(rawInput);
      let title = "video";

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
        title = search.title;
      }

      await client.reply(
        m.chat,
        `🎬 Descargando video como documento...\n🤖 ${BOT_NAME}`,
        m,
        global.channelInfo,
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
      const finalTitle = safeFileName(
        stripExtension(linkResult.fileName || `${title}.mp4`) || title,
      );

      await client.sendMessage(
        m.chat,
        {
          document: { url: sendPath },
          mimetype: "video/mp4",
          fileName: normalizeMp4Name(linkResult.fileName || `${finalTitle}.mp4`),
          caption:
            `📁 VIDEO YT\n\n` +
            `🎬 ${finalTitle}\n` +
            `🎞 Calidad: ${VIDEO_QUALITY}\n` +
            `🤖 ${BOT_NAME}`,
        },
        { quoted: m, ...global.channelInfo },
      );
    } catch (error) {
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
