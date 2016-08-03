import childProcess from 'child_process';
import test from 'ava';

test.cb('main', t => {
	const cp = childProcess.spawn('./cli.js', {stdio: 'inherit'});

	cp.on('error', t.ifError);

	cp.on('close', code => {
		t.is(code, 0);
		t.end();
	});
});

test.cb('wolly', t => {
	childProcess.execFile('./cli.js', ['--wolly'], {
		cwd: __dirname
	}, (err, stdout) => {
		t.ifError(err);
		t.true(stdout === '\n› Download Complete!\n\n');
		t.end();
	});
});

test.cb('link', t => {
	childProcess.execFile('./cli.js', ['--link'], {
		cwd: __dirname
	}, (err, stdout) => {
		t.ifError(err);
		t.true(stdout === '\n\n\n');
		t.end();
	});
});

test.cb('random', t => {
	childProcess.execFile('./cli.js', ['--random'], {
		cwd: __dirname
	}, (err, stdout) => {
		t.ifError(err);
		t.true(stdout === '\n\n\n');
		t.end();
	});
});

test.cb('saveWolly', t => {
	childProcess.execFile('./cli.js', ['-1'], {
		cwd: __dirname
	}, (err, stdout) => {
		t.ifError(err);
		t.true(stdout === `\n{\"wallpaper\":\"http://www.thepaperwall.com/wallpapers/nature/big/big_299018df9599217649fa1f0c4370b5a5d4d1262c.jpg\"} \n\n`);
		t.end();
	});
});

test.cb('exportWolly', t => {
	childProcess.execFile('./cli.js', ['-1 --save'], {
		cwd: __dirname
	}, (err, stdout) => {
		t.ifError(err);
		t.true(stdout === `\n› $ wolly --help\n\n`);
		t.end();
	});
});
