const Starlights = require('@StarlightsTeam/Scraper')
const fetch = require('node-fetch')
const { ytdl_han } = require('ytdl-han')

const limit = 100 // MB

let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!args[0]) {
    return conn.reply(
      m.chat,
      '[ ✰ ] Ingresa el enlace del vídeo de *YouTube*\n\n» Ejemplo:\n' +
      `> *${usedPrefix + command}* https://youtu.be/QSvaCSt8ixs`,
      m
    )
  }

  await m.react('🕓')

  try {
    // 🔹 Método principal
    const gi = await ytdl_han(args[0], '128kbps')
    const sizeMB = parseFloat(gi.data.size.replace('MB', ''))

    if (sizeMB >= limit) {
      await m.react('✖️')
      return m.reply(`El archivo pesa más de ${limit} MB, se canceló la descarga.`)
    }

    const audioBuffer = Buffer.from(gi.data.format, 'base64')

    const txt =
      '`乂  Y O U T U B E  -  M P 3`\n\n' +
      `✩ *Título* : ${gi.data.title}\n` +
      `✩ *Calidad* : 128kbps\n` +
      `✩ *Tamaño* : ${gi.data.size}\n\n` +
      '> *- ↻ El audio se está enviando, espera un momento...*'

    await conn.sendFile(m.chat, gi.data.thumbnail, 'thumbnail.jpg', txt, m)
    await conn.sendMessage(
      m.chat,
      {
        audio: audioBuffer,
        mimetype: 'audio/mpeg',
        fileName: `${gi.data.title}.mp3`,
      },
      { quoted: m }
    )

    return await m.react('✅')

  } catch (e1) {
    // 🔁 Fallback
    try {
      const { title, size, quality, thumbnail, dl_url } = await Starlights.ytmp3(args[0])
      const sizeMB = parseFloat(size.replace('MB', ''))

      if (sizeMB >= limit) {
        await m.react('✖️')
        return m.reply(`El archivo pesa más de ${limit} MB, se canceló la descarga.`)
      }

      const img = await (await fetch(thumbnail)).buffer()

      const txt2 =
        '`乂  Y O U T U B E  -  M P 3`\n\n' +
        `✩ *Título* : ${title}\n` +
        `✩ *Calidad* : ${quality}\n` +
        `✩ *Tamaño* : ${size}\n\n` +
        '> *- ↻ El audio se está enviando, espera un momento...*'

      await conn.sendFile(m.chat, img, 'thumbnail.jpg', txt2, m)
      await conn.sendMessage(
        m.chat,
        {
          audio: { url: dl_url },
          mimetype: 'audio/mp4',
          fileName: `${title}.mp3`,
        },
        { quoted: m }
      )

      return await m.react('✅')

    } catch (e2) {
      await m.react('✖️')
    }
  }
}

handler.help = ['ytmp5 <link yt>']
handler.tags = ['downloader']
handler.command = ['ytmp5', 'yta', 'fgmp3']
handler.register = true

module.exports = handler