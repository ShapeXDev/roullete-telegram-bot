const TeleBot = require('telebot');
const fs = require('fs');

/* Bot information */
const BOT_TOKEN = "2114012944:AAFb-Jr5s1PeHjPyQSSuRUhxxhb80vHSl3A";
const BOT_CONFIG = {
	polling: {
		interval: 1000,
		timeout: 0,
		limit: 100,
		retryTimeout: 10000
	},
	allowedUpdates: []
}

const BOT_SIGNATURE = new TeleBot(BOT_TOKEN, BOT_CONFIG);
const bot = BOT_SIGNATURE;

const get_info = async () => {
	let BOT_INFO = await bot.getMe();

	return BOT_INFO;
}
const BOT_INFO = get_info();

const gameInfo = require('./game.json');

bot.on(['/roulette'], async ctx => {
	let admins = await bot.getChatAdministrators(ctx.chat.id);
	let flag = null;

	if (ctx.chat.type !== 'supergroup') {
		return;
	}

	for (let admin of admins) {
		if (admin.id === BOT_INFO.id) {
			flag = true
		}
	}

	if (flag === null) {
		return bot.sendMessage(ctx.chat.id, `${ctx.from.first_name}, Bot has not administrator laws.`);
	}

	if (gameInfo['is-now-started']) {
		return bot.sendMessage(ctx.chat.id, `${ctx.from.first_name}, Game has been started.`);
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

	if (gameInfo['now-count'] === gameInfo['max-count']) {
		gameInfo['is-game-voted'] = false;
		gameInfo['is-started'] = true;
		bot.sendMessage(ctx.chat.id, `Game started, type /shoot to play!`);
	}

	return bot.sendMessage(ctx.chat.id, `${ctx.from.first_name}, you joined the game`);
});

bot.on(['/shoot'], async ctx => {
	if (!gameInfo['is-started']) {
		return bot.sendMessage(ctx.chat.id, `${ctx.from.first_name}, game not started!`);
	}

	const values = Object.values(gameInfo['users']);

	if (!values.includes(ctx.from.id)) {
		return bot.sendMessage(ctx.chat.id, `${ctx.from.first_name}, you has not joined the game!`);
	}

	while (gameInfo['now-count'] > 1) {
		const randomUser = random(gameInfo['max-count'], 1);

		await bot.kickChatMember(ctx.chat.id, gameInfo['users'][randomUser], '1d');
		gameInfo['now-count']--;
	}

	gameInfo['is-now-started'] = false;
	gameInfo['is-started'] = false;
	gameInfo['now-count'] = 0;
	gameInfo['users'] = {};

	return bot.sendMessage(ctx.chat.id, `Game ended!`);
});

const activate_bot = consoleMessage => {
	try {
		bot.start();
		return console.log(`${consoleMessage ? consoleMessage : 'Bot started!'}`);
	} catch (error) {
		throw Error(error);
	}
}

activate_bot();

setInterval(() => {
	fs.writeFileSync('./game.json', JSON.stringify(gameInfo, null, '\t'));
}, 5000);

const random = (max, min) => {
	return Math.round(Math.random() * (max - min)) + min;
}
