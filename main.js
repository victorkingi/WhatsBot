const express = require('express');
const app = express();
const { Client, MessageMedia } = require('whatsapp-web.js');
const config = require('./config')
const qr = require('./modules/qr');
const saavn = require('./modules/jiosaavn');
const pmpermit = require('./modules/pmpermit');
const carbon = require('./modules/carbon');
const telegraph = require('./modules/telegraph');
const serveIndex = require('serve-index');
const youtube = require('./modules/youtube');
const weather = require('./modules/weather');
const { exec } = require('child_process');
const help = require('./modules/help');
const start = require('./modules/start');
const ud = require('./modules/ud');
const gitinfo = require('./modules/git');
const cron = require('node-cron');
const cricket = require('./modules/cricket');
const crypto = require('./modules/crypto');
const watch = require('./modules/watch');
const shorten = require('./modules/urlshortner');
const ocr = require('./modules/ocr');
const emailVerifier = require('./modules/emailverifier');
const songM = require('./modules/song');
const numeral = require('numeral');
const fs = require('fs');

const allCoins = [
    {n: 'ETH', amount: '0.497305355757638186'},
    {n: 'VET', amount: '1176.9'},
    {n: 'ADA', amount: '54.561815'},
    {n: 'XRP', amount: '110.984987'},
    {n: 'SOL', amount: '1.6187388'},
    {n: 'XDC', amount: '380'},
    {n: 'ALBT', amount: '43.99'},
    {n: 'VXV', amount: '3.8663'},
    {n: 'QNT', amount: '2.142'},
    {n: 'RVN', amount: '899'}];
const extraCoin = [
    {n: 'XRP', amount: '3765.704313'},
    {n: 'ETH', amount: '0.46807046'}
];

function decodeInput(body) {
    let commands = body.split(' ');
    if (commands[0] !== "!portfolio") return -1;
    if(commands.length === 1) return 0;
    if (commands.length === 2) {
        let toDo = commands[1];
        if (toDo === "-c") return 1;
        if (toDo === "-a") return 2;
        if (toDo === "-l") return 3;
    } else {
        if (commands[commands.length-1] === '') {
            let toDo = commands[1];
            if (toDo === "-c") return 1;
            if (toDo === "-a") return 2;
            if (toDo === "-l") return 3;
        }
    }
    return -2;
}

function getLevel(lastRecorded, total, total2, total3) {
    const allRise = lastRecorded.price1 < total && lastRecorded.price2 < total2 && lastRecorded.price3 < total3; // 111
    const allFall = lastRecorded.price1 > total && lastRecorded.price2 > total2 && lastRecorded.price3 > total3; // 000
    const oneRise = lastRecorded.price1 < total && lastRecorded.price2 > total2 && lastRecorded.price3 > total3; // 100
    const twoRise = lastRecorded.price1 > total && lastRecorded.price2 < total2 && lastRecorded.price3 > total3; // 010
    const threeRise = lastRecorded.price1 > total && lastRecorded.price2 > total2 && lastRecorded.price3 < total3; // 001
    const oneTwoRise = lastRecorded.price1 < total && lastRecorded.price2 < total2 && lastRecorded.price3 > total3; // 110
    const oneThreeRise = lastRecorded.price1 < total && lastRecorded.price2 > total2 && lastRecorded.price3 < total3; // 101
    const twoThreeRise = lastRecorded.price1 > total && lastRecorded.price2 < total2 && lastRecorded.price3 < total3; // 011
    const testArr = [allRise, allFall, oneTwoRise, oneRise, twoRise, threeRise, oneThreeRise, twoThreeRise];
    if (testArr.filter(Boolean).length !== 1) throw new Error("Invalid boolean logic! "+testArr);
    if (allRise) return ["📈", "📈", "📈"];
    if (allFall) return ["📉", "📉", "📉"];
    if (oneRise) return ["📈", "📉", "📉"];
    if (twoRise) return ["📉", "📈", "📉"];
    if (threeRise) return ["📉", "📉", "📈"];
    if (oneTwoRise) return ["📈", "📈", "📉"];
    if (oneThreeRise) return ["📈", "📉", "📈"];
    if (twoThreeRise) return ["📉", "📈", "📈"];
}

/**
 *
 * @param client
 * @param msg
 * @param lastRecorded
 * @param isMe
 * @returns {Promise<number>}
 */
async function getAllData(client, msg, lastRecorded, isMe) {
    let data;
    let extraData;
    const cumulate = [];
    for (const coin of allCoins) {
        data = await crypto.getPrice(coin.n, coin.amount);
        console.log(data);
        if (data === "error") {
            await client.sendMessage(isMe ? msg.to : msg.from, `🙇‍♂️ *Error*\n\n` + "```Something unexpected happened while fetching Cryptocurrency Price```");
            return -1;
        }
        if (data === "unsupported") {
            await client.sendMessage(isMe ? msg.to : msg.from, `🙇‍♂️ *Error*\n\n` + "```Support for this CryptoCurrency is not yet added```");
            return -2;
        } else {
            cumulate.push({
                coin,
                name: data.name,
                price: data.price
            });
        }
    }
    const finalExtra = [];
    for (const c of extraCoin) {
        extraData = await crypto.getPrice(c.n, c.amount);
        console.log(extraData);
        if (extraData === "error") {
            await client.sendMessage(isMe ? msg.to : msg.from, `🙇‍♂️ *Error*\n\n` + "```Something unexpected happened while fetching Cryptocurrency Price```");
            return -1;
        }
        if (extraData === "unsupported") {
            await client.sendMessage(isMe ? msg.to : msg.from, `🙇‍♂️ *Error*\n\n` + "```Support for this CryptoCurrency is not yet added```");
            return -2;
        } else {
            finalExtra.push({
                c,
                name: extraData.name,
                price: extraData.price
            });
        }
    }
    let total = 0;
    let total2 = parseFloat(finalExtra[0].price);
    let total3 = parseFloat(finalExtra[1].price);
    for (const coin of cumulate) {
        const added = parseFloat(coin.price);
        total += added;
    }
    const date = new Date().toLocaleString('en-US', {timeZone: 'Africa/Nairobi'});
    const level = getLevel(lastRecorded, total, total2, total3); // returns array of icons to be used
    await client.sendMessage(isMe ? msg.to : msg.from, `1) *XRP, XDC, VXV, ALBT, QNT, VET, ADA, RVN, SOL, ETH*\nINITIAL INVESTMENT:\n\t$ 3,000\n\nCURRENT: \n\t*$ ${numeral(total).format('0,0.00')}* ${level[0]} as of ${date}\n\n2) *XRP*\nINITIAL INVESTMENT:\n $ 5,000\n\nCURRENT: \n *$ ${numeral(total2).format('0,0.00')}* ${level[1]} as of ${date}\n\n3) *ETH*\nINITIAL INVESTMENT:\n $ 2014.84\n\nCURRENT: \n *$ ${numeral(total3).format('0,0.00')}* ${level[2]} as of ${date}`);
    await client.sendMessage(isMe ? msg.to : msg.from, "Other commands:\n*!portfolio -c* : View all coin amounts and prices\n*!portfolio -a* : view all addresses\n*!portfolio -l* : view location coin is stored");
    console.log("done sending");
    lastRecorded.price1 = total;
    lastRecorded.price2 = total2;
    lastRecorded.price3 = total3;
    fs.writeFile(`${__dirname}/current.txt`, `${lastRecorded.price1},${lastRecorded.price2},${lastRecorded.price3}`, (err) => {
        if (err) throw new Error("Error writing values: " + err);
        console.log("updated");
    });
    return 0;
}

/**
 * posts message containing all coins, value and amount
 * @param client
 * @param msg
 * @param lastRecorded
 * @param isMe
 * @returns {Promise<number>}
 */
async function getCoins(client, msg, lastRecorded, isMe) {
    let data;
    let extraData;
    const cumulate = [];
    console.log("Getting coins...")
    for (const coin of allCoins) {
        data = await crypto.getPrice(coin.n, coin.amount);
        if (data === "error") {
            await client.sendMessage(isMe ? msg.to : msg.from, `🙇‍♂️ *Error*\n\n` + "```Something unexpected happened while fetching Cryptocurrency Price```");
            return -1;
        }
        if (data === "unsupported") {
            await client.sendMessage(isMe ? msg.to : msg.from, `🙇‍♂️ *Error*\n\n` + "```Support for this CryptoCurrency is not yet added```");
            return -2;
        } else {
            cumulate.push({
                coin,
                name: data.name,
                price: data.price,
                value: data.value
            });
        }
    }
    const finalExtra = [];
    for (const c of extraCoin) {
        extraData = await crypto.getPrice(c.n, c.amount);
        console.log(extraData);
        if (extraData === "error") {
            await client.sendMessage(isMe ? msg.to : msg.from, `🙇‍♂️ *Error*\n\n` + "```Something unexpected happened while fetching Cryptocurrency Price```");
            return -1;
        }
        if (extraData === "unsupported") {
            await client.sendMessage(isMe ? msg.to : msg.from, `🙇‍♂️ *Error*\n\n` + "```Support for this CryptoCurrency is not yet added```");
            return -2;
        } else {
            finalExtra.push({
                coin: c,
                name: extraData.name,
                price: extraData.price,
                value: extraData.value
            });
        }
    }
    const date = new Date().toLocaleString('en-US', {timeZone: 'Africa/Nairobi'});
    await client.sendMessage(isMe ? msg.to : msg.from, `*3000$* Investment\n\n*ETH @ $ ${numeral(cumulate[0].value).format("0,0.00")}*\nCoins: ${allCoins[0].amount}\nAmount: $ ${numeral(cumulate[0].price).format("0,0.00")}\n\n*VET @ $ ${numeral(cumulate[1].value).format("0,0.00")}*\nCoins: ${allCoins[1].amount}\nAmount: $ ${numeral(cumulate[1].price).format("0,0.00")}\n\n*ADA @ $ ${numeral(cumulate[2].value).format("0,0.00")}*\nCoins: ${allCoins[2].amount}\nAmount: $ ${numeral(cumulate[2].price).format("0,0.00")}\n\n*XRP @ $ ${numeral(cumulate[3].value).format("0,0.00")}*\nCoins: ${allCoins[3].amount}\nAmount: $ ${numeral(cumulate[3].price).format("0,0.00")}\n\n*SOL @ $ ${numeral(cumulate[4].value).format("0,0.00")}*\nCoins: ${allCoins[4].amount}\nAmount: $ ${numeral(cumulate[4].price).format("0,0.00")}\n\n*XDC @ $ ${numeral(cumulate[5].value).format("0,0.00")}*\nCoins: ${allCoins[5].amount}\nAmount: $ ${numeral(cumulate[5].price).format("0,0.00")}\n\n*ALBT @ $ ${numeral(cumulate[6].value).format("0,0.00")}*\nCoins: ${allCoins[6].amount}\nAmount: $ ${numeral(cumulate[6].price).format("0,0.00")}\n\n*VXV @ $ ${numeral(cumulate[7].value).format("0,0.00")}*\nCoins: ${allCoins[7].amount}\nAmount: $ ${numeral(cumulate[7].price).format("0,0.00")}\n\n*QNT @ $ ${numeral(cumulate[8].value).format("0,0.00")}*\nCoins: ${allCoins[8].amount}\nAmount: $ ${numeral(cumulate[8].price).format("0,0.00")}\n\n*RVN @ $ ${numeral(cumulate[9].value).format("0,0.00")}*\nCoins: ${allCoins[9].amount}\nAmount: $ ${numeral(cumulate[9].price).format("0,0.00")}\n`);
    await client.sendMessage(isMe ? msg.to : msg.from, `*5000$* Investment\n\n*XRP @ $ ${numeral(finalExtra[0].value).format("0,0.00")}*\nCoins: ${extraCoin[0].amount}\nAmount: $ ${numeral(finalExtra[0].price).format("0,0.00")}`+`\n\n${date}`);
    await client.sendMessage(isMe ? msg.to : msg.from, `*2014.84$* Investment\n\n*ETH @ $ ${numeral(finalExtra[1].value).format("0,0.00")}*\nCoins: ${extraCoin[1].amount}\nAmount: $ ${numeral(finalExtra[1].price).format("0,0.00")}`+`\n\n${date}`);
    return 0;
}

/**
 *
 * @param client
 * @param msg
 * @param isMe
 * @returns {Promise<number>}
 */
async function getLocations(client, msg, isMe) {
    console.log("getting location...");
    const date = new Date().toLocaleString('en-US', {timeZone: 'Africa/Nairobi'});
    await client.sendMessage(isMe ? msg.to : msg.from, `*3000$* Investment\n\n*ETH* : Metamask (private key backed up)\n\n*VET* : my laptop (private key backed up)\n\n*XRP* : phone XUMM app (private key backed up)\n\n*SOL* : phantom chrome extension (private key backed up)\n\n*XDC* : web wallet (private key backed up)\n\n*ALBT* : hotbit exchange\n\n*VXV* : probit exchange\n\n*QNT* : 0.142 in hotbit exchange, 2 in metamask\n\n*RVN* : my laptop (private key backed up)`);
    await client.sendMessage(isMe ? msg.to : msg.from, `*5000$* Investment\n\n*XRP* : wanja's iphone (has private key backed up)\n`+`\n${date}`);
    await client.sendMessage(isMe ? msg.to : msg.from, `*2014.84$* Investment\n\n*ETH* : Metamask/Polygon network (private key backed up)\n`+`\n${date}`);
    return 0;
}

/**
 *
 * @param client
 * @param msg
 * @param isMe
 * @returns {Promise<number>}
 */
async function getAddresses(client, msg, isMe) {
    console.log("getting addresses...");
    const date = new Date().toLocaleString('en-US', {timeZone: 'Africa/Nairobi'});
    await client.sendMessage(isMe ? msg.to : msg.from, `*3000$* Investment\n\n*ETH* : https://etherscan.io/address/0x484Fb0ebAA66Bc8E62737060Dd7703F3CaB39E7c\n\n*VET* : https://explore.vechain.org/accounts/0xe7705f8856561cb6087419c870f13d4200c6c84c\n\n*XRP* : https://xrpscan.com/account/rnbMyKSEgRBSFNb1A1LyjxTqN44EMLwY3J\n\n*SOL* : https://explorer.solana.com/address/4JgW8Mz8m6FkqBasfWYewD6qNEwYFbJusNSQkXGkdKAD\n\n*XDC* : https://explorer.xinfin.network/addr/xdc9748b78dd18eca3520484e60e5c7d64b7d18e385\n\n*ALBT* : UNKNOWN\n\n*VXV* : UNKNOWN\n\n*QNT* : 0.142 UNKNOWN, 2 at https://etherscan.io/address/0x484Fb0ebAA66Bc8E62737060Dd7703F3CaB39E7c\n\n*RVN* : https://ravencoin.network/address/RKnP6eoVpehw9AcDXGLk2v8ySwqsap7hog\n`);
    await client.sendMessage(isMe ? msg.to : msg.from, `*5000$* Investment\n\n*XRP* : https://xrpscan.com/account/rn5UUayGA1ZQDeHuhBZdyQftwA9Fwzmvqz\n`+`\n${date}`);
    return 0;
}

fs.readFile(`${__dirname}/current.txt`, (err, data) => {
    if (err) throw new Error("Error writing values: "+err);
    const last  = data.toString().split(',');
    let lastRecorded = { price1: parseFloat(last[0]), price2: parseFloat(last[1]), price3: parseFloat(last[2])};
    console.log("values loaded:", lastRecorded);

    const client = new Client({ puppeteer: { headless: true, args: ['--no-sandbox'] }, session: config.session });

    client.initialize();

    client.on('auth_failure', () => {
        console.error("There is a problem in authentication, Kindly set the env var again and restart the app");
    });

    client.on('ready', () => {
        console.log('Bot has been started');
    });

    client.on('message', async msg => {
        if (msg.author === undefined && config.pmpermit_enabled === "true") { // Pm check for pmpermit module
            var pmpermitcheck = await pmpermit.handler(msg.from.split("@")[0])
            const chat = await msg.getChat();
            if (pmpermitcheck === "permitted") {
                // do nothing
            } else if (pmpermitcheck.mute === true && chat.isMuted === false) { // mute
                msg.reply(pmpermitcheck.msg)
                const chat = await msg.getChat();

                const unmuteDate = new Date();
                unmuteDate.setSeconds(Number(unmuteDate.getSeconds()) + Number(config.pmpermit_mutetime));
                await chat.mute(unmuteDate)

            } else if (chat.isMuted === true) {
                //do nothing
            } else if (pmpermitcheck === "error") {
                //do nothing
            } else {
                msg.reply(pmpermitcheck.msg)
            }

        } else {
            if (msg.body.includes("!info")) {

                const startdata = await start.get(await client.info.getBatteryStatus(), client.info.phone);
                await client.sendMessage(msg.to, new MessageMedia(startdata.mimetype, startdata.data, startdata.filename), { caption: startdata.msg })

            }
        }
    });

    const allricketschedules = {} // Will need later

    client.on('message_create', async (msg) => {
        let getdata;
        let attachmentData;
        let quotedMsg;
        let data;
        let chat;
        console.log(msg);
        let sticker;
        let raw_text;
        let res;
        let text;
        if (msg.fromMe) {
            if (msg.body === "!allow" && config.pmpermit_enabled === "true" && !msg.to.includes("-")) { // allow and unmute the chat (PMPermit module)

                pmpermit.permitacton(msg.to.split("@")[0])
                chat = await msg.getChat();
                await chat.unmute(true)
                msg.reply("Allowed for PM")

            } else if (msg.body === "!nopm" && config.pmpermit_enabled === "true" && !msg.to.includes("-")) { // not allowed for pm (PMPermit module)

                pmpermit.nopermitacton(msg.to.split("@")[0])
                msg.reply("Not Allowed for PM")

            } else if (msg.body === "!block" && !msg.to.includes("-")) { // Block an user in pm

                chat = await msg.getChat();
                const contact = await chat.getContact();
                msg.reply("You have been Blocked")
                contact.block()

            } else if (msg.body === "!mute" && !msg.to.includes("-")) { // Mute an user in pm

                chat = await msg.getChat();
                const unmuteDate = new Date();
                unmuteDate.setSeconds(Number(unmuteDate.getSeconds()) + Number(config.pmpermit_mutetime));
                await chat.mute(unmuteDate)
                msg.reply(`You have been muted for ${config.pmpermit_mutetime / 60} Minutes`)

            } else if (msg.body === "!unmute" && !msg.to.includes("-")) { // Unmute an user in pm

                chat = await msg.getChat();
                await chat.unmute(true)
                msg.reply(`You have been unmuted`)

            } else if (msg.body.startsWith("!term ")) { // Terminal

                msg.delete(true)
                exec("cd public && " + msg.body.replace("!term ", ""), (error, stdout, stderr) => {
                    if (error) {
                        client.sendMessage(msg.to, "*whatsbot~:* ```" + error + "```")
                    } else if (stderr) {
                        client.sendMessage(msg.to, "*whatsbot~:* ```" + stderr + "```")
                    } else {
                        client.sendMessage(msg.to, "*whatsbot~:* ```" + stdout + "```")
                    }
                })

            } else if (msg.body.startsWith("!help")) { // help module

                msg.delete(true)
                data = await help.mainF(msg.body);
                await client.sendMessage(msg.to, data)

            } else if (msg.body === "!ping") { // Ping command

                msg.reply("Pong !!!");

            } else if (msg.body === "!start") { // Start command
                msg.delete(true)
                var startdata = await start.get(await client.info.getBatteryStatus(), client.info.phone)
                await client.sendMessage(msg.to, new MessageMedia(startdata.mimetype, startdata.data, startdata.filename), {caption: startdata.msg})

            } else if (msg.body === '!delete' && msg.hasQuotedMsg) {

                msg.delete(true)
                quotedMsg = await msg.getQuotedMessage();
                if (quotedMsg.fromMe) {
                    quotedMsg.delete(true);
                } else {
                    await client.sendMessage(msg.to, "Sorry, I can't delete that message.");
                }

            } else if (msg.body.startsWith("!qr ")) { // QR Code Gen

                msg.delete(true)
                data = await qr.qrgen(msg.body.replace("!qr ", ""));
                await client.sendMessage(msg.to, new MessageMedia(data.mimetype, data.data, data.filename), {caption: `QR code for 👇\n` + "```" + msg.body.replace("!qr ", "") + "```"});

            } else if (msg.body.startsWith("!qr") && msg.hasQuotedMsg) { // QR Code Gen from reply text

                msg.delete(true)
                quotedMsg = await msg.getQuotedMessage();
                data = await qr.qrgen(quotedMsg.body);
                await client.sendMessage(msg.to, new MessageMedia(data.mimetype, data.data, data.filename), {caption: `QR code for 👇\n` + "```" + quotedMsg.body + "```"});

            } else if (msg.body.startsWith("!jiosaavn ")) { // Jiosaavn Module

                msg.delete(true)
                data = await saavn.mainF(msg.body.replace("!jiosaavn ", ""));
                if (data === "error") {
                    await client.sendMessage(msg.to, `🙇‍♂️ *Error*\n\n` + "```Something Unexpected Happened to fetch this Jiosaavn Link, Maybe it's a wrong url.```")
                } else {
                    await client.sendMessage(msg.to, new MessageMedia(data.image.mimetype, data.image.data, data.image.filename), {caption: `🎶 *${data.title}* _(${data.released_year})_\n\n📀 *Artist :*  ` + "```" + data.singers + "```\n📚 *Album :*  " + "```" + data.album + "```" + `\n\n*Download Url* 👇\n${data.url}`});
                }

            } else if (msg.body.startsWith("!jiosaavn") && msg.hasQuotedMsg) { // Jiosaavn Module message reply

                msg.delete(true)
                quotedMsg = await msg.getQuotedMessage();
                data = await saavn.mainF(quotedMsg.body);
                if (data === "error") {
                    await client.sendMessage(msg.to, `🙇‍♂️ *Error*\n\n` + "```Something Unexpected Happened to fetch this Jiosaavn Link, Maybe it's a wrong url.```")
                } else {
                    await client.sendMessage(msg.to, new MessageMedia(data.image.mimetype, data.image.data, data.image.filename), {caption: `🎶 *${data.title}* _(${data.released_year})_\n\n📀 *Artist :*  ` + "```" + data.singers + "```\n📚 *Album :*  " + "```" + data.album + "```" + `\n\n*Download Url* 👇\n${data.url}`});
                }

            } else if (msg.body.startsWith("!carbon ")) { // Carbon Module

                msg.delete(true)
                data = await carbon.mainF(msg.body.replace("!carbon ", ""));
                if (data === "error") {
                    await client.sendMessage(msg.to, `🙇‍♂️ *Error*\n\n` + "```Something Unexpected Happened to create the Carbon.```")
                } else {
                    await client.sendMessage(msg.to, new MessageMedia(data.mimetype, data.data, data.filename), {caption: `Carbon for 👇\n` + "```" + msg.body.replace("!carbon ", "") + "```"});
                }

            } else if (msg.body.startsWith("!carbon") && msg.hasQuotedMsg) { // Carbon Module message reply

                msg.delete(true)
                quotedMsg = await msg.getQuotedMessage();
                data = await carbon.mainF(quotedMsg.body);
                if (data === "error") {
                    await client.sendMessage(msg.to, `🙇‍♂️ *Error*\n\n` + "```Something Unexpected Happened to create the Carbon.```")
                } else {
                    await client.sendMessage(msg.to, new MessageMedia(data.mimetype, data.data, data.filename), {caption: `Carbon for 👇\n` + "```" + quotedMsg.body + "```"});
                }

            } else if (msg.body.startsWith("!directlink") && msg.hasQuotedMsg) { // Telegraph Module

                msg.delete(true)
                quotedMsg = await msg.getQuotedMessage();
                attachmentData = await quotedMsg.downloadMedia();
                data = await telegraph.mainF(attachmentData);
                if (data === "error") {
                    quotedMsg.reply(`Error occured while create direct link.`)
                } else {
                    quotedMsg.reply(`🔗 *Direct Link 👇*\n\n` + "```" + data + "```")
                }

            } else if (msg.body.startsWith("!yt ")) { // Youtube Module

                msg.delete(true)
                data = await youtube.mainF(msg.body.replace("!yt ", ""));
                if (data === "error") {
                    await client.sendMessage(msg.to, `🙇‍♂️ *Error*\n\n` + "```Something Unexpected Happened to fetch the YouTube video```")
                } else {
                    await client.sendMessage(msg.to, new MessageMedia(data.image.mimetype, data.image.data, data.image.filename), {caption: `*${data.title}*\n\nViews: ` + "```" + data.views + "```\nLikes: " + "```" + data.likes + "```\nComments: " + "```" + data.comments + "```\n\n*Download Link* 👇\n" + "```" + data.download_link + "```"});
                }

            } else if (msg.body.startsWith("!yt") && msg.hasQuotedMsg) { // Youtube Module Reply

                msg.delete(true)
                quotedMsg = await msg.getQuotedMessage();
                data = await youtube.mainF(quotedMsg.body);
                if (data === "error") {
                    await client.sendMessage(msg.to, `🙇‍♂️ *Error*\n\n` + "```Something Unexpected Happened to fetch the YouTube video```")
                } else {
                    await client.sendMessage(msg.to, new MessageMedia(data.image.mimetype, data.image.data, data.image.filename), {caption: `*${data.title}*\n\nViews: ` + "```" + data.views + "```\nLikes: " + "```" + data.likes + "```\nComments: " + "```" + data.comments + "```\n\n*Download Link* 👇\n" + "```" + data.download_link + "```"});
                }

            } else if (msg.body.startsWith("!weather ")) { // Weather Module

                msg.delete(true)
                data = await weather.mainF(msg.body.replace("!weather ", ""));
                if (data === "error") {
                    await client.sendMessage(msg.to, `🙇‍♂️ *Error*\n\n` + "```Something Unexpected Happened to fetch Weather```")
                } else {
                    await client.sendMessage(msg.to, `*Today's Weather at ${data.place}*\n` + "```" + data.current_observation.text + " (" + data.current_observation.temperature + "°C)```\n\n*Type:* " + "```" + data.today_forcast.text + "```\n*Max temperature:* " + "```" + data.today_forcast.high + "°C```\n*Min temperature:* " + "```" + data.today_forcast.low + "°C```");
                }

            } else if (msg.body.startsWith("!ud ")) { // Urban Dictionary Module

                msg.delete(true)
                data = await ud.mainF(msg.body.replace("!ud ", ""));
                if (data === "error") {
                    await client.sendMessage(msg.to, `🙇‍♂️ *Error*\n\n` + "```Something Unexpected Happened while Lookup on Urban Dictionary```")
                } else {
                    await client.sendMessage(msg.to, "*Term:* ```" + data.term + "```\n\n" + "*Definition:* ```" + data.def + "```\n\n" + "*Example:* ```" + data.example + "```")
                }
            } else if (msg.body.startsWith("!sticker") && msg.hasQuotedMsg) { // Sticker Module

                msg.delete(true)
                quotedMsg = await msg.getQuotedMessage();
                if (quotedMsg.hasMedia) {
                    attachmentData = await quotedMsg.downloadMedia();
                    await client.sendMessage(msg.to, new MessageMedia(attachmentData.mimetype, attachmentData.data, attachmentData.filename), {sendMediaAsSticker: true});
                } else {
                    await client.sendMessage(msg.to, `🙇‍♂️ *Error*\n\n` + "```No image found to make a Sticker```")
                }
            } else if (msg.body === "!awake") {
                client.sendPresenceAvailable()
                msg.reply("```" + "I will be online from now." + "```")
            } else if (msg.body.startsWith('!git ')) { // Gitinfo Module with link
                msg.delete(true)
                data = await gitinfo.detail(msg.body.replace('!git ', ''));
                if (data.status) {
                    if (data.data.status) {
                        await await client.sendMessage(msg.to, new MessageMedia(data.data.mimetype, data.data.data, data.data.filename))
                    }
                    await client.sendMessage(msg.to, data.msg)
                } else {
                    await client.sendMessage(msg.to, `🙇‍♂️ *Error*\n\n` + "```" + data.msg + "```")
                }
            } else if (msg.body.startsWith('!cricket ')) { // Cricket Module Start
                msg.delete(true)

                var packed = {
                    url: msg.body.split(' ')[1],
                    interval: Number(msg.body.split(' ')[2]?.replace('m', '').replace('M', '').replace('.', '')) || 1,
                    stoptime: Number(msg.body.split(' ')[3]?.replace('m', '').replace('M', '')) || 10,
                }

                var task = cron.schedule(`*/${packed.interval} * * * *`, async () => {
                    var fetchscore = await cricket(packed.url)
                    if (fetchscore.status) {
                        await client.sendMessage(msg.to, fetchscore.msg)
                    }
                })

                if (allricketschedules[msg.to] !== undefined) {
                    let critask = allricketschedules[msg.to];
                    critask.stop();
                    await client.sendMessage(msg.to, `Previous cricket updates of this chat has been stopped !`)
                }

                await client.sendMessage(msg.to, `⏱ *Update setted*\n\n_It will now give you cricket update in every ${packed.interval}M and it will stop after ${packed.stoptime}M._`)

                setTimeout(() => {
                    task.stop()
                }, packed.stoptime * 60 * 1000);

                allricketschedules[msg.to] = task

            } else if (msg.body.startsWith('!cricketstop')) { // Cricket Module stop
                await msg.delete(true)
                let critask = allricketschedules[msg.to];
                critask.stop();
                await client.sendMessage(msg.to, `All running cricket updates of this chat has been stopped !`)
            } else if (msg.body.startsWith("!spam ")) { // Spamming Op in the chat
                msg.delete(true)
                var i, count
                if (msg.hasQuotedMsg) {
                    quotedMsg = await msg.getQuotedMessage();
                    count = msg.body.replace("!spam ", "")
                    if (isNaN(count)) {
                        await client.sendMessage(msg.to, `🙇‍♂️ *Error*\n\n` + "```Invalid count```")
                        return 0
                    }
                    if (count > 0)
                        count = parseInt(count)
                    else {
                        await client.sendMessage(msg.to, `🙇‍♂️ *Error*\n\n` + "```Count can't be zero.```")
                        return 0
                    }
                    if (quotedMsg.hasMedia) {
                        const media = await quotedMsg.downloadMedia();

                        sticker = quotedMsg.type === "sticker";
                        for (i = 0; i < count; i++)
                            await client.sendMessage(msg.to, new MessageMedia(media.mimetype, media.data, media.filename), {sendMediaAsSticker: sticker});
                    } else {
                        for (i = 0; i < count; i++)
                            await client.sendMessage(msg.to, quotedMsg.body)
                    }
                } else {
                    raw_text = msg.body.replace("!spam ", "")
                    if (raw_text.includes("|")) {
                        res = raw_text.split("|")
                        count = res[0]
                        text = res[1]
                    } else {
                        await client.sendMessage(msg.to, "```Please read !help spam.```")
                        return 0
                    }
                    if (isNaN(count)) {
                        await client.sendMessage(msg.to, `🙇‍♂️ *Error*\n\n` + "```Invalid count```")
                        return 0
                    }
                    if (count > 0)
                        count = parseInt(count)
                    else {
                        await client.sendMessage(msg.to, `🙇‍♂️ *Error*\n\n` + "```Count can't be zero.```")
                        return 0
                    }
                    for (i = 0; i < count; i++)
                        await client.sendMessage(msg.to, text)
                }
            } else if (msg.body.startsWith("!portfolio")) {
                const command = decodeInput(msg.body);
                await msg.delete(true);
                const initiatorTo = msg.to.split('@');
                const initiatorFrom = msg.from.split('@');
                const checkInitiator = (!initiatorTo[0].startsWith('254722489882')
                        && !initiatorTo[0].startsWith('254712054049')
                        && !initiatorTo[0].startsWith('254701004363'))
                    && (!initiatorFrom[0].startsWith('254722489882')
                        && !initiatorFrom[0].startsWith('254712054049')
                        && !initiatorFrom[0].startsWith('254701004363'));

                if (checkInitiator) {
                    await client.sendMessage(msg.to, `🙇‍♂️ *Error*\n\n` + "```Not authorized to execute this command```");
                    return -1;
                }
                if (command === -2 || command === -1) {
                    await client.sendMessage(msg.to, `🙇‍♂️ *Error*\n\n` + "```\'"+msg.body+"\' is not recognized as an internal or external command```");
                    return -1;
                }
                if (command === 0) return getAllData(client, msg, lastRecorded, true);
                if (command === 1) return getCoins(client, msg, lastRecorded, true);
                if (command === 2) return getAddresses(client, msg, true);
                if (command === 3) return getLocations(client, msg, true);
            } else if (msg.body.startsWith("!watch ")) { // Watch Module
                msg.delete(true)
                data = await watch.getDetails(msg.body.replace("!watch ", ""));
                if (data === "error") {
                    await client.sendMessage(msg.to, `🙇‍♂️ *Error*\n\n` + "```Something Unexpected Happened while fetching Movie/TV Show Details.```")
                } else if (data === "No Results") {
                    await client.sendMessage(msg.to, `🙇‍♂️ *No Results Found!*\n\n` + "```Please check the name of Movie/TV Show you have entered.```")
                } else {
                    await client.sendMessage(msg.to, new MessageMedia(data.mimetype, data.thumbdata, data.filename), {caption: data.caption});
                }

            } else if (msg.body.startsWith("!shorten ")) { // URL Shortener Module
                msg.delete(true)
                data = await shorten.getShortURL(msg.body.replace("!shorten ", ""));
                if (data === "error") {
                    await client.sendMessage(msg.to, `🙇‍♂️ *Error*\n\n` + "```Please make sure the entered URL is in correct format.```")
                } else {
                    await client.sendMessage(msg.to, `Short URL for ${data.input} is 👇\n${data.short}`)
                }
            } else if (msg.body.startsWith("!shorten") && msg.hasQuotedMsg) { // URL Shortener Module Reply

                msg.delete(true)
                quotedMsg = await msg.getQuotedMessage();
                data = await shorten.getShortURL(quotedMsg.body);
                if (data === "error") {
                    await client.sendMessage(msg.to, `🙇‍♂️ *Error*\n\n` + "```Please make sure the entered URL is in correct format.```")
                } else {
                    await client.sendMessage(msg.to, `Short URL for ${data.input} is 👇\n${data.short}`)
                }

            } else if (msg.body.startsWith("!ocr") && msg.hasQuotedMsg) { // OCR Module

                msg.delete(true)
                quotedMsg = await msg.getQuotedMessage();
                attachmentData = await quotedMsg.downloadMedia();
                data = await ocr.readImage(attachmentData);
                if (data === "error") {
                    quotedMsg.reply(`Error occured while reading the image. Please make sure the image is clear.`)
                } else {
                    quotedMsg.reply(`*Extracted Text from the Image*  👇\n\n${data.parsedText}`)
                }
            } else if (msg.body.startsWith("!emailverifier") && msg.hasQuotedMsg) { // Email Verifier Module Reply
                msg.delete(true)
                quotedMsg = await msg.getQuotedMessage();
                getdata = await emailVerifier(quotedMsg.body);
                quotedMsg.reply(getdata)
            } else if (msg.body.startsWith("!emailverifier ")) { // Email Verifier Module
                msg.delete(true)
                getdata = await emailVerifier(msg.body.replace('!emailverifier ', ''));
                await client.sendMessage(msg.to, getdata);
            } else if (msg.body.startsWith("!song ")) { // Song downloader Module

                msg.delete(true)
                getdata = await songM.search(msg.body.replace('!song ', ''));
                const sendmessage = await await client.sendMessage(msg.to, getdata.content); // have to grab the message ID
                if (getdata.status) {
                    fs.writeFileSync(`${__dirname}/modules/tempdata/song~${sendmessage.id.id}.json`, JSON.stringify(getdata.songarray))
                }

            } else if (msg.body.startsWith("!dldsong ") && msg.hasQuotedMsg) { // Downloader Module (song)

                msg.delete(true)
                quotedMsg = await msg.getQuotedMessage();
                getdata = await songM.download(msg.body.replace('!dldsong ', ''), quotedMsg.id.id);
                if (getdata.status) {
                    await client.sendMessage(msg.to, new MessageMedia(getdata.content.image.mimetype, getdata.content.image.data, getdata.content.image.filename), {caption: getdata.content.text});
                } else {
                    await client.sendMessage(msg.to, getdata.content);
                }
            }
        } else if (msg.body.startsWith("!portfolio")) {
            const command = decodeInput(msg.body);
            await msg.delete(true);
            const initiatorTo = msg.to.split('@');
            const initiatorFrom = msg.from.split('@');
            const checkInitiator = (!initiatorTo[0].startsWith('254722489882')
                    && !initiatorTo[0].startsWith('254712054049')
                    && !initiatorTo[0].startsWith('254701004363'))
                && (!initiatorFrom[0].startsWith('254722489882')
                    && !initiatorFrom[0].startsWith('254712054049')
                    && !initiatorFrom[0].startsWith('254701004363'));

            if (checkInitiator) {
                await client.sendMessage(msg.from, `🙇‍♂️ *Error*\n\n` + "```Not authorized to execute this command```");
                return -1;
            }
            if (command === -2 || command === -1) {
                await client.sendMessage(msg.from, `🙇‍♂️ *Error*\n\n` + "```\'"+msg.body+"\' is not recognized as an internal or external command```");
                return -1;
            }
            if (command === 0) return getAllData(client, msg, lastRecorded, false);
            if (command === 1) return getCoins(client, msg, lastRecorded, false);
            if (command === 2) return getAddresses(client, msg, false);
            if (command === 3) return getLocations(client, msg, false);
        }
    });

    client.on('message_revoke_everyone', async (after, before) => {
        if (before) {
            if (before.fromMe !== true && before.hasMedia !== true && before.author === undefined && config.enable_delete_alert === "true") {
                //await client.sendMessage(before.from, "_You deleted this message_ 👇👇\n\n" + before.body)
            }
        }
    });


    client.on('disconnected', (reason) => {
        console.log('Client was logged out', reason);
    });

    app.get('/', (req, res) => {
        res.send('<h1>This server is powered by Whatsbot<br><a href="https://github.com/TheWhatsBot/WhatsBot">https://github.com/TheWhatsBot/WhatsBot</a></h1>')
    })

    app.use('/public', express.static('public'), serveIndex('public', { 'icons': true })) // public directory will be publicly available


    app.listen(process.env.PORT || 8080, () => {
        console.log(`Server listening at Port: ${process.env.PORT || 8080}`)
    })
});
