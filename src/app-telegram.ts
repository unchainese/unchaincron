import { Hono } from "hono";
import { Bot, webhookCallback } from 'grammy'

// https://grammy.dev/guide/commands


// Set your token in the vercel environment variable

async function setUpWebhook(host: string, telegramToken: string, webhookToken: string) {
    const bot = new Bot(telegramToken);
    await bot.api.setMyCommands([
        { command: 'typescript', description: 'typescript using the bot' },
        { command: 'cloudflare', description: 'cloudflare help info' },
        { command: 'vscode', description: 'vscode help info' },
        { command: 'github', description: 'github help info' },
        { command: 'help', description: 'Show help info' },
    ]);

    await bot.api.setWebhook(`https://${host}/api/telegram/webhook`, {
        drop_pending_updates: true,
        secret_token: webhookToken,
    });
}


function webhookHandler(telegramToken: string, webhookToken: string) {
    const bot = new Bot(telegramToken);
    bot.command('typescript', (ctx) => ctx.reply('typescript to use Eric Zhou'));
    bot.command('cloudflare', (ctx) => ctx.reply('cloudflare to use Eric Zhou'));
    bot.command('vscode', (ctx) => ctx.reply('vscode to use Eric Zhou'));
    bot.command('github', (ctx) => ctx.reply('github to use Eric Zhou'));

    bot.command('help', async (ctx) => {
        const commands = await ctx.api.getMyCommands();
        const info = commands.reduce((acc, val) => `${acc}/${val.command} - ${val.description}\n`, '');
        return ctx.reply(info);
    });
    bot.on(['message:photo', 'message:document'], async (ctx) => {
        //todo:: not working
        const file = await ctx.getFile();
        const host = 'afasdf.com'
        const tgImgUrl = `https://${host}/img/${file.file_id}`;
        return ctx.reply(
            `Successfully uploaded image!\nTelegram:\n${tgImgUrl}`
        );
    });

    bot.reaction("🎉", (ctx) => ctx.reply("whoop whoop"));
    bot.reaction(["👍", "👎"], (ctx) => ctx.reply("Nice thumb"));

    bot.on('message:text', ctx => ctx.reply(ctx.message.text + ' from Eric Zhou bot'));

    const hh = webhookCallback(bot, 'hono', { secretToken: webhookToken })
    return hh
}


export const apiTelegram = new Hono<{ Bindings: Env }>()



apiTelegram.get('/setup', async (c) => {
    const host = c.req.header("host") || '';
    if (!host) {
        return c.text('host not found')
    }
    const webhookToken = c.env.APP_SECRET;
    const telegramToken = c.env.TELEGRAM_TOKEN;
    await setUpWebhook(host, telegramToken, webhookToken)
    return c.text('done')
})

apiTelegram.post('/webhook', async (c, next) => {
    const hh = webhookHandler(c.env.TELEGRAM_TOKEN, c.env.APP_SECRET)
    return await hh(c)
})
