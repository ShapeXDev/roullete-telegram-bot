const TeleBot = require('telebot');
const fs = require('fs');
const BOT_TOKEN = "";
const bot = new TeleBot(BOT_TOKEN);
const get_info = async () => { return await bot.getMe(); }
const BOT_INFO = get_info();
const gameInfo = require('./game.json');

bot.on(['text'], ctx => {
	if (ctx.chat.type !== 'supergroup') {
		return;
	}
	
	let admins = await bot.getChatAdministrators(ctx.chat.id);
	let flag = null;

	for (let admin of admins) {
		if (admin.id === BOT_INFO.id) {
			flag = true
		}
	}

	if (flag === null) {
		return bot.sendMessage(ctx.chat.id, `${ctx.from.first_name}, Bot has not administrator laws.`);
	}
});

bot.on(['/roulette'], async ctx => {
	if (gameInfo['is-now-started']) {
		return bot.sendMessage(ctx.chat.id, `${ctx.from.first_name}, Game already has been started.`);
	}

	gameInfo['is-now-started'] = true;
	gameInfo['is-game-voted'] = true;
	gameInfo['now-count']++;
	gameInfo['users'][gameInfo['now-count']] = ctx.from.id;

	return bot.sendMessage(ctx.chat.id, `GAME HAS BEEN ENABLE, JOIN IT NOW!`);
});

bot.on(['/join'], async ctx => {
	if (!gameInfo['is-game-voted']) {
		return bot.sendMessage(ctx.chat.id, `${ctx.from.first_name}, Game is not aviable!`);
	}

	if (gameInfo['is-started']) {
		return bot.sendMessage(ctx.chat.id, `${ctx.from.first_name}, Game has been started!`);
	}

	const values = Object.values(gameInfo['users']);

	if (values.includes(ctx.from.id)) {
		return bot.sendMessage(ctx.chat.id, `${ctx.from.first_name}, You already in the game!`);
	}

	if (gameInfo['now-count'] === gameInfo['max-count']) {
		return bot.sendMessage(ctx.chat.id, `${ctx.from.first_name}, game room is full`);
	}

	gameInfo['now-count']++;
	gameInfo['users'][gameInfo['now-count']] = ctx.from.id;
	
	bot.sendMessage(ctx.chat.id, `${ctx.from.first_name}, you joined the game`);

	if (gameInfo['now-count'] === gameInfo['max-count']) {
		gameInfo['is-game-voted'] = false;
		gameInfo['is-started'] = true;
		
		bot.sendMessage(ctx.chat.id, `Game started, type /shoot to play!`);
	}
});

bot.on(['/shoot'], async ctx => {
	if (!gameInfo['is-started']) {
		return bot.sendMessage(ctx.chat.id, `${ctx.from.first_name}, game not started!`);
	}

	const values = Object.values(gameInfo['users']);

	if (!values.includes(ctx.from.id)) {
		return bot.sendMessage(ctx.chat.id, `${ctx.from.first_name}, you has not joined the game!`);
	}

	const randomUser = Math.round(Math.random() * (gameInfo['max-count'] - gameInfo['now-count'])) + gameInfo['max-count'];

	await bot.kickChatMember(ctx.chat.id, gameInfo['users'][randomUser], '1d');
	gameInfo['now-count']--;
	delete gameInfo['users'][randomUser]

	if (gameInfo['now-count'] < Math.round(gameInfo['max-count'] / 2)) {
		gameInfo['is-now-started'] = false;
		gameInfo['is-started'] = false;
		gameInfo['now-count'] = 0;
		gameInfo['users'] = {};
		
		return bot.sendMessage(ctx.chat.id, `Game ended!`);
	}
});

const activate_bot = async consoleMessage => {
	try {
		await bot.start();
		return console.log(`${consoleMessage ? consoleMessage : 'Bot started!'}`);
	} catch (error) {
		throw Error(error);
	}
}
activate_bot();

setInterval(() => {
	fs.writeFileSync('./game.json', JSON.stringify(gameInfo, null, '\t'));
}, 5000);
