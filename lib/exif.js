require('../settings');
const fs = require('fs');
const path = require('path');
const { tmpdir } = require('os');
const Crypto = require('crypto');
const ff = require('fluent-ffmpeg');
const FileType = require('file-type');
const webp = require('node-webpmux');

async function imageToWebp(media) {
    const tmpFileOut = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`)
    const tmpFileIn = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.jpg`)
    fs.writeFileSync(tmpFileIn, media)
    await new Promise((resolve, reject) => {
        ff(tmpFileIn)
            .on("error", reject)
            .on("end", () => resolve(true))
            .addOutputOptions([
                "-vcodec",
                "libwebp",
                "-vf",
                "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse"
            ])
            .toFormat("webp")
            .save(tmpFileOut)
    })

    const buff = fs.readFileSync(tmpFileOut)
    fs.unlinkSync(tmpFileOut)
    fs.unlinkSync(tmpFileIn)
    return buff
}

async function videoToWebp(media) {
    const tmpFileOut = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`)
    const tmpFileIn = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.mp4`)
    fs.writeFileSync(tmpFileIn, media)
    await new Promise((resolve, reject) => {
        ff(tmpFileIn)
            .on("error", reject)
            .on("end", () => resolve(true))
            .addOutputOptions([
                "-vcodec",
                "libwebp",
                "-vf",
                "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse",
                "-loop",
                "0",
                "-ss",
                "00:00:00",
                "-t",
                "00:00:05",
                "-preset",
                "default",
                "-an",
                "-vsync",
                "0"
            ])
            .toFormat("webp")
            .save(tmpFileOut)
    })

    const buff = fs.readFileSync(tmpFileOut)
    fs.unlinkSync(tmpFileOut)
    fs.unlinkSync(tmpFileIn)
    return buff
}

async function writeExif(media, data) {
	const anu = await FileType.fromBuffer(media)
    const wMedia = /webp/.test(anu.mime) ? media : /jpeg|jpg|png/.test(anu.mime) ? await imageToWebp(media) : /video/.test(anu.mime) ? await videoToWebp(media) : ""
    const tmpFileIn = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`)
    const tmpFileOut = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`)
    fs.writeFileSync(tmpFileIn, wMedia)
    if (data) {
        const img = new webp.Image()
        const wr = { a: global.author ? global.author : 'naze-dev', b: data.packname ? data.packname : global.packname ? global.packname : '𖤍𝑷𝑨𝑷𝑳𝑶✘𝑯𝑨𝑮𝑲𝑰𝑵𝑮𖤍؍.َِ🥱👋
		للمَِـۥـِم̸ٛـزيډ مَِـۥـِمٛن ٱﺂلٱﺂسہًٍۦـسټيڪ̸ـﺮ̸ـز ټ̸ـوجٍَجهه ٱﺂلي ☟
	نمَِـۥـِمٛب̸ـﺮ بــٱﺂبـلــ̸ـو̸ـو : 01063510519
	    ټمَِـۥـِمٛټع ـ بٱﺂلسہًٍۦـس̸ـﺮقهه ؍.َِ🤎 .🧸 .🤎 .
', c: data.author ? data.author : global.author ? global.author : 'Papll', d: data.categories ? data.categories : [""], e: data.isAvatar ? data.isAvatar : 0 }
        const json = { 'sticker-pack-id': wr.a, 'sticker-pack-name': wr.b, 'sticker-pack-publisher': wr.c, 'emojis': wr.d, 'is-avatar-sticker': wr.e };
        const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00])
        const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8')
        const exif = Buffer.concat([exifAttr, jsonBuff])
        exif.writeUIntLE(jsonBuff.length, 14, 4)
        await img.load(tmpFileIn)
        fs.unlinkSync(tmpFileIn)
        img.exif = exif
        await img.save(tmpFileOut)
        return tmpFileOut
    }
}

module.exports = { imageToWebp, videoToWebp, writeExif }
