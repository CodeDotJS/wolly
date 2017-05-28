#!/usr/bin/env node
'use strict';

const fs = require('fs');
const http = require('http');
const dns = require('dns');
const got = require('got');
const cheerio = require('cheerio');
const chalk = require('chalk');
const mkdirp = require('mkdirp');
const ora = require('ora');
const logUpdate = require('log-update');
const updateNotifier = require('update-notifier');
const isURL = require('is-url');
const wolly = require('wolpi');
const pkg = require('./package.json');

updateNotifier({pkg}).notify();

const arg = process.argv[2];
let prevArg = process.argv[3];

const pre = `${'›'} `;

if (arg === '--help' || arg === '-h') {
	console.log(`
 ${chalk.cyan('Usage   :')} wolly [command] ${chalk.dim('<option>')}

 ${chalk.cyan('Global :')}
 ${chalk.bold('wolly')}                  Downloads random wallpapers, everytime

 ${chalk.cyan('Command :')}
 ${chalk.bold('-w')},${chalk.dim('--wolly')}             Wallpaper Of The Day
 ${chalk.bold('-d')},${chalk.dim('--download')}          Paste wallpaper's link to download it

 ${chalk.cyan('Extra :')}
 ${chalk.bold('-l')},${chalk.dim('--link')}    ${chalk.dim('[')}1${chalk.dim(']')}       URL of WallpaperOfTheDay
 ${chalk.bold('-r')},${chalk.dim('--random')}  ${chalk.dim('[')}2${chalk.dim(']')}       Random URLs of beautiful wallpapers
 ${chalk.bold('-b')},${chalk.dim('--bulk')}    ${chalk.dim('[')}3${chalk.dim(']')}       Get URLs of wallpaper in bulk

 ${chalk.cyan('Option :')}
 ${chalk.yellow(pre)}Specify ${chalk.yellow('-1')},${chalk.yellow('-2')} or ${chalk.yellow('-3')} without any argument to print link in json
 ${chalk.yellow(pre)}Specify ${chalk.yellow('--save')} after ${chalk.yellow('-1')} or ${chalk.yellow('-2')} to save links in a text file

 ${chalk.cyan('Tool :')}
 ${chalk.bold('-h')},${chalk.dim('--help')}              Show help
 ${chalk.bold('-v')},${chalk.dim('--version')}           Show current version

 ${chalk.cyan('Example :')}
 ${chalk.dim('$ wolly -wolly         Downloads')} ${chalk.dim('WallpaperOfTheDay')}
 ${chalk.dim('$ wolly -1             Output the result as JSON')}
 ${chalk.dim('$ wolly -2 --save      Export link in text file')}
	`);
	process.exit(1);
}

const mediaSave = 'wolly/';
const daily = 'wolly/wolly-daily/';
const random = 'wolly/random/';
const custom = 'wolly/custom/';
const dailyLink = 'wolly/wolly-daily/link/';
const diffLink = 'wolly/random/link/';
const fileNumber = 'WallpaperOfTheDay [' + new Date().toISOString().split('T')[0] + ']';
const randomLinkFile = 'RandomWallPaper [' + new Date().toISOString() + ']';

console.log();
const spinner = ora();

mkdirp(mediaSave, err => {
	if (err) {
		logUpdate(`${pre} ${chalk.dim('Sorry! Couldn\'t create the directory')}`);
	} else {
		spinner.start();
		spinner.text = `${chalk.dim('Wait! Initializing Wolly')}`;
	}
});

const argArray = ['-w', '-i', '-d', '-l', '-r', '-b', '-h', '-v', '--wolly', '--interactive', '--download', '--link', '--random', '--bulk', '--help', '--version', '-1', '-2', '-3', '--save', '--json'];
const availArg = argArray.indexOf(arg);

dns.lookup('www.thepaperwall.com', err => {
	if (err && err.code) {
		logUpdate(`${chalk.bold.red(pre)}${chalk.dim('Please check your Internet Connection\n')}`);
		process.exit(1);
	} else {
		spinner.start();
		spinner.text = `${chalk.dim('Wolly is finding a')} ${chalk.bold('Beautiful Wallpaper')}. ${chalk.dim('Just for you')}`;
		if (arg === '-w' || arg === '--wolly') {
			spinner.text = `${chalk.dim('Wolly is finding')} ${chalk.bold('Wallpaper of the Day')}. ${chalk.dim('Just for you')}`;
		}
		if (arg === '-l' || arg === '--link') {
			spinner.text = `${chalk.dim('Wolly is searching')} ${chalk.bold('Wallpaper of the Day')}${chalk.dim(`'s URL. Just for you`)}`;
		}
		if (arg === '-r' || arg === '--random') {
			spinner.text = `${chalk.dim('Wolly is searching a')} ${chalk.bold('Beautiful Wallpaper')}${chalk.dim(`'s URL. Just for you`)}`;
		}
		if (arg === '-b' || arg === '--bulk') {
			spinner.text = `${chalk.dim('Wolly is searching list of')} ${chalk.bold('Beautiful Wallpaper')}${chalk.dim(`'s URL. Just for you`)}`;
		}
		if (arg === '-d' || arg === '--download') {
			spinner.text = `${chalk.bold('Downloading')}${chalk.dim(' Please wait!')}`;
		}
		if (arg === '-1' && prevArg === '--save') {
			spinner.text = `${chalk.dim('Fetching wallpaper\'s link. Please wait!')}`;
		} else if (arg === '-1' && !prevArg) {
			spinner.text = `${chalk.dim('Fetching Output in JSON. Please wait!')}`;
		}
		if (arg === '-2' && prevArg === '--save') {
			spinner.text = `${chalk.dim('Fetching wallpaper\'s link. Please wait!')}`;
		} else if (arg === '-2' && !prevArg) {
			spinner.text = `${chalk.dim('Fetching Output in JSON. Please wait!')}`;
		}
		if (arg === '-3' && !prevArg) {
			spinner.text = `${chalk.dim('Fetching Output in JSON. Please wait!')}`;
		}
		if (availArg === -1) {
			spinner.stop();
			console.log(`${chalk.bold.red(pre)}${chalk.dim('$ wolly --help\n')}`);
		}
	}
});

const url = 'http://www.thepaperwall.com/';
const shuffle = 'http://www.thepaperwall.com/shuffle.php';

const mainImage = imageLink => {
	return url + imageLink.split('image=/')[1];
};

const shuffleImage = imageLink => {
	return url + imageLink.split('image=/')[1].replace('small/small_', 'big/big_');
};

const mediaName = imageLink => {
	return imageLink.split('/').pop();
};

mkdirp(random, err => {
	if (err) {
		process.exit(1);
	}
});

if (!arg) {
	got(shuffle).then(res => {
		spinner.start();
		spinner.text = `${chalk.bold('Downloading')}`;
		const $ = cheerio.load(res.body);
		const shuffleURL = shuffleImage($('a.thumbnail_cont img').attr('src'));
		const randomMedia = mediaName(shuffleURL);
		mkdirp(random, err => {
			if (err) { /* not needed */ }
		});
		const createRandomWolly = fs.createWriteStream(random + randomMedia);
		// for simplifying we can use got.stream
		http.get(shuffleURL, (res, cb) => {
			res.pipe(createRandomWolly);
			createRandomWolly.on('finish', () => {
				setTimeout(() => {
					console.log(`${chalk.bold.cyan(pre)}Download Complete!\n`);
				});
				spinner.stop();
				createRandomWolly.close(cb);
			});
		});
	}).catch(err => {
		if (err) {
			process.exit(1);
			console.error(err);
		}
	});
}

mkdirp(daily, err => {
	if (err) {
		process.exit(1);
	}
});

if (arg === '-w' || arg === '--wolly') {
	got(url).then(res => {
		spinner.start();
		spinner.text = `${chalk.bold('Downloading')}`;
		const $ = cheerio.load(res.body);
		const partURL = mainImage($('.monitor_slider div img').attr('src'));
		const media = mediaName(partURL);
		mkdirp(daily, err => {
			if (err) { /* not needed */ }
		});
		const createWolly = fs.createWriteStream(daily + media);
		http.get(partURL, (res, cb) => {
			res.pipe(createWolly);
			createWolly.on('finish', () => {
				setTimeout(() => {
					console.log(`${chalk.bold.cyan(pre)}Download Complete!\n`);
				});
				spinner.stop();
				createWolly.close(cb);
			});
		});
	}).catch(err => {
		if (err) {
			process.exit(1);
			console.error(err);
		}
	});
}

mkdirp(custom, err => {
	if (err) {
		process.exit(1);
	}
});

if (arg === '-d' || arg === '--download') {
	if (!prevArg) {
		logUpdate(`${chalk.bold.red(pre)}${chalk.dim('Wallpaper\'s URL required\n')}`);
		process.exit(1);
	}
	if (isURL(prevArg) === false) {
		logUpdate(`${chalk.bold.red(pre)}${chalk.dim('Invalid URL\n')}`);
		process.exit(1);
	}
	if (prevArg.indexOf('https:') === 0) {
		prevArg = prevArg.replace('https:', 'http:');
	}
	mkdirp(custom, err => {
		if (err) { /* not needed */ }
	});
	const wollyDownloadName = mediaName(prevArg);
	const downloadWolly = fs.createWriteStream(custom + wollyDownloadName);
	http.get(prevArg, (res, cb) => {
		res.pipe(downloadWolly);
		downloadWolly.on('finish', () => {
			setTimeout(() => {
				console.log(`${chalk.bold.cyan(pre)}Download Complete!\n`);
			});
			spinner.stop();
			downloadWolly.close(cb);
		});
	});
}

if (arg === '-l' || arg === '--link') {
	wolly().then(wollyLink => {
		const inf = [];
		const wollyMage = (prefix, key) => {
			if (wollyLink[key]) {
				inf.push(`${prefix}${chalk.dim(wollyLink[key])}`);
			}
		};
		wollyMage(`${chalk.cyan.bold(pre)}`, 'wolly');
		setTimeout(() => {
			console.log(inf.join('\n'));
			console.log();
		});
		spinner.stop();
	});
}

if (arg === '-r' || arg === '--random') {
	wolly.random().then(shuffleLink => {
		const inf = [];
		const shuffWollyImage = (prefix, key) => {
			if (shuffleLink[key]) {
				inf.push(`${prefix}${chalk.dim(shuffleLink[key])}`);
			}
		};
		shuffWollyImage(`${chalk.cyan.bold(pre)}`, 'shuffleWolly');
		setTimeout(() => {
			console.log(inf.join('\n'));
			console.log();
		});
		spinner.stop();
	});
}

if (arg === '-b' || arg === '--bulk') {
	got(shuffle).then(res => {
		const $ = cheerio.load(res.body);
		$('a.thumbnail_cont span').each(function () {
			let a = $(this).prev();
			const link = shuffleImage(a.attr('src'));
			setTimeout(() => {
				console.log(`${chalk.bold.cyan(pre)}${chalk.dim(link)}`);
			});

			spinner.stop();
		});
		console.log(`${chalk.dim('  Double click on links to select them.\n')}`);
	});
}

mkdirp(dailyLink, err => {
	if (err) {
		process.exit(1);
	}
});

if (arg === '-1' && prevArg === '--save') {
	got(url).then(res => {
		const $ = cheerio.load(res.body);
		const saveURL = mainImage($('.monitor_slider div img').attr('src'));
		const buffer = new Buffer(`wallpaper of the day: \n\n${saveURL}`);
		mkdirp(dailyLink, err => {
			if (err) {
				process.exit(1);
			}
		});
		const stream = fs.createWriteStream(dailyLink + fileNumber);
		stream.once('open', () => {
			stream.write(buffer);
			stream.end();
			setTimeout(() => {
				console.log(`${chalk.bold.cyan(pre)}${chalk.dim('Link saved!')}\n`);
			});
			spinner.stop();
		});
	});
} else if (arg === '-1') {
	wolly().then(urls => {
		setTimeout(() => {
			console.log(JSON.stringify(urls).replace('"wolly":', ''), '\n');
		});
		spinner.stop();
	});
}

mkdirp(diffLink, err => {
	if (err) {
		process.exit(1);
	}
});

if (arg === '-2' && prevArg === '--save') {
	got(url).then(res => {
		const $ = cheerio.load(res.body);
		const shuffleLinks = shuffleImage($('a.thumbnail_cont img').attr('src'));
		const buffer = new Buffer(`Random Wallpaper: \n\n${shuffleLinks}`);
		mkdirp(diffLink, err => {
			if (err) {
				process.exit(1);
			}
		});
		const stream = fs.createWriteStream(diffLink + randomLinkFile);
		stream.once('open', () => {
			stream.write(buffer);
			stream.end();
			setTimeout(() => {
				console.log(`${chalk.bold.cyan(pre)}${chalk.dim('Link saved!')}\n`);
			});
			spinner.stop();
		});
	});
} else if (arg === '-2') {
	wolly.random().then(randURLs => {
		setTimeout(() => {
			console.log(JSON.stringify(randURLs).replace('"shuffleWolly":', ''), '\n');
		});
		spinner.stop();
	});
}

if (arg === '-3') {
	got(url).then(res => {
		const $ = cheerio.load(res.body);
		$('a.thumbnail_cont span').each(function () {
			let a = $(this).prev();
			const link = shuffleImage(a.attr('src'));
			setTimeout(() => {
				console.log(JSON.stringify('{' + link + '}'));
			});
			spinner.stop();
		});
	});
}

if (arg === '--version' || arg === '-v') {
	console.log(`${chalk.bold.cyan(pre)}${chalk.dim('Current Wolly version:')}`, require('./package.json').version, `\n`);

	process.exit(1);
}
