/**
 * Local Supabase-compatible stack for development:
 * GoTrue (Auth) + PostgREST + a small Storage server, behind http://127.0.0.1:54321
 *
 * Requires PostgreSQL on localhost. Linux x64 downloads the Auth and PostgREST binaries.
 * Hosted Supabase is the path in the README; this is only for running the app on this machine.
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import os from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DATA = path.join(ROOT, '.data');
const BIN = path.join(DATA, 'bin');
const STORAGE = path.join(DATA, 'storage', 'media');
const LOGS = path.join(DATA, 'logs');
const SECRET_FILE = path.join(DATA, 'jwt-secret');
const PORT = 54321;
const AUTH_PORT = 9999;
const REST_PORT = 3001;

fs.mkdirSync(BIN, { recursive: true });
fs.mkdirSync(STORAGE, { recursive: true });
fs.mkdirSync(LOGS, { recursive: true });

if (await listening(PORT)) {
	console.log(`Local API already listening on http://127.0.0.1:${PORT}`);
	process.exit(0);
}

const secret = fs.existsSync(SECRET_FILE) ? fs.readFileSync(SECRET_FILE, 'utf8').trim() : randomBytes(32).toString('hex');
fs.writeFileSync(SECRET_FILE, secret);

await ensureBinaries();
await psqlFile(path.join(ROOT, 'supabase/local/roles.sql'));
await runAuth(['migrate']);
await psql(`grant execute on all functions in schema auth to anon, authenticated, service_role, authenticator;`);
await psqlFile(path.join(ROOT, 'supabase/migrations/20261118120000_init.sql'));

const dbAuth = 'postgres://postgres:postgres@127.0.0.1:5432/postgres?sslmode=disable';
const dbRest = 'postgres://authenticator:postgres@127.0.0.1:5432/postgres?sslmode=disable';
if (!(await listening(AUTH_PORT))) start('auth', path.join(BIN, 'auth'), ['serve'], {
	cwd: BIN,
	env: {
		...process.env,
		GOTRUE_API_HOST: '127.0.0.1',
		GOTRUE_API_PORT: String(AUTH_PORT),
		API_EXTERNAL_URL: `http://127.0.0.1:${PORT}`,
		GOTRUE_DB_DRIVER: 'postgres',
		GOTRUE_DB_DATABASE_URL: dbAuth,
		GOTRUE_SITE_URL: 'http://127.0.0.1:5173',
		GOTRUE_URI_ALLOW_LIST: 'http://127.0.0.1:5173,http://localhost:5173',
		GOTRUE_DISABLE_SIGNUP: 'true',
		GOTRUE_JWT_ADMIN_ROLES: 'service_role',
		GOTRUE_JWT_AUD: 'authenticated',
		GOTRUE_JWT_EXP: '86400',
		GOTRUE_JWT_SECRET: secret,
		GOTRUE_EXTERNAL_EMAIL_ENABLED: 'true',
		GOTRUE_MAILER_AUTOCONFIRM: 'true',
		GOTRUE_EXTERNAL_PHONE_ENABLED: 'false',
		GOTRUE_SMTP_ADMIN_EMAIL: 'admin@localhost',
		GOTRUE_MAILER_URLPATHS_INVITE: '/auth/v1/verify',
		GOTRUE_MAILER_URLPATHS_CONFIRMATION: '/auth/v1/verify',
		GOTRUE_MAILER_URLPATHS_RECOVERY: '/auth/v1/verify',
		GOTRUE_MAILER_URLPATHS_EMAIL_CHANGE: '/auth/v1/verify',
		GOTRUE_DB_MIGRATIONS_PATH: path.join(BIN, 'migrations')
	}
});
if (!(await listening(REST_PORT))) start('postgrest', path.join(BIN, 'postgrest'), [], {
	env: {
		...process.env,
		PGRST_DB_URI: dbRest,
		PGRST_DB_SCHEMAS: 'public',
		PGRST_DB_ANON_ROLE: 'anon',
		PGRST_DB_EXTRA_SEARCH_PATH: 'public',
		PGRST_JWT_SECRET: secret,
		PGRST_SERVER_HOST: '127.0.0.1',
		PGRST_SERVER_PORT: String(REST_PORT)
	}
});

await waitFor(AUTH_PORT);
await waitFor(REST_PORT);

const gateway = http.createServer((req, res) => {
	cors(res);
	if (req.method === 'OPTIONS') {
		res.writeHead(204);
		res.end();
		return;
	}
	const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);
	if (url.pathname.startsWith('/auth/v1')) return proxy(req, res, AUTH_PORT, '/auth/v1');
	if (url.pathname.startsWith('/rest/v1')) return proxy(req, res, REST_PORT, '/rest/v1');
	if (url.pathname.startsWith('/storage/v1')) return storage(req, res, url);
	res.writeHead(404);
	res.end('not found');
});
gateway.listen(PORT, '127.0.0.1');

const envPath = path.join(ROOT, '.env');
if (!fs.existsSync(envPath)) {
	const now = Math.floor(Date.now() / 1000);
	const anon = sign({ role: 'anon', iss: 'tgit-local', iat: now, exp: now + 60 * 60 * 24 * 365 * 5 }, secret);
	const service = sign({ role: 'service_role', iss: 'tgit-local', iat: now, exp: now + 60 * 60 * 24 * 365 * 5 }, secret);
	const password = `local-${randomBytes(9).toString('hex')}`;
	fs.writeFileSync(
		envPath,
		[
			`PUBLIC_SUPABASE_URL=http://127.0.0.1:${PORT}`,
			`PUBLIC_SUPABASE_ANON_KEY=${anon}`,
			`SUPABASE_SERVICE_ROLE_KEY=${service}`,
			`SUPER_ADMIN_EMAIL=admin@tgitsolutions.com`,
			`SUPER_ADMIN_PASSWORD=${password}`,
			`PUBLIC_BASE_URL=http://127.0.0.1:5173`,
			''
		].join('\n')
	);
	console.log('Wrote .env for local development.');
	console.log('Super admin email: admin@tgitsolutions.com');
	console.log('Super admin password:', password);
}
console.log(`Local API http://127.0.0.1:${PORT}`);
console.log('Next: npm run seed && npm run dev');

function sign(payload, key) {
	const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
	const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
	const data = `${header}.${body}`;
	return `${data}.${createHmac('sha256', key).update(data).digest('base64url')}`;
}

function verify(token) {
	const parts = token.split('.');
	if (parts.length !== 3) return null;
	const expected = createHmac('sha256', secret).update(`${parts[0]}.${parts[1]}`).digest('base64url');
	const a = Buffer.from(expected);
	const b = Buffer.from(parts[2]);
	if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
	const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
	if (payload.exp && payload.exp < Date.now() / 1000) return null;
	return payload;
}

function cors(res) {
	res.setHeader('access-control-allow-origin', '*');
	res.setHeader('access-control-allow-headers', 'authorization, apikey, content-type, x-upsert, x-client-info, prefer, accept, cache-control, range');
	res.setHeader('access-control-allow-methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
	res.setHeader('access-control-expose-headers', 'content-range, range');
}

function proxy(req, res, port, strip) {
	const target = (req.url || '/').replace(strip, '') || '/';
	const headers = { ...req.headers, host: `127.0.0.1:${port}` };
	const upstream = http.request({ hostname: '127.0.0.1', port, path: target, method: req.method, headers }, (up) => {
		cors(res);
		res.writeHead(up.statusCode || 502, up.headers);
		up.pipe(res);
	});
	upstream.on('error', (error) => {
		res.writeHead(502);
		res.end(error.message);
	});
	req.pipe(upstream);
}

function storage(req, res, url) {
	if (req.method === 'POST' && url.pathname === '/storage/v1/bucket') {
		const payload = verifyBearer(req);
		if (!payload || !['service_role', 'authenticated'].includes(payload.role)) return deny(res);
		res.writeHead(200, { 'content-type': 'application/json' });
		res.end(JSON.stringify({ name: 'media' }));
		return;
	}
	const publicPrefix = '/storage/v1/object/public/media/';
	const objectPrefix = '/storage/v1/object/media/';
	if ((req.method === 'GET' || req.method === 'HEAD') && url.pathname.startsWith(publicPrefix)) {
		return sendFile(req, res, safePath(decodeURIComponent(url.pathname.slice(publicPrefix.length))));
	}
	if ((req.method === 'POST' || req.method === 'PUT') && url.pathname.startsWith(objectPrefix)) {
		const payload = verifyBearer(req);
		if (!payload || !['service_role', 'authenticated'].includes(payload.role)) return deny(res);
		const rel = safePath(decodeURIComponent(url.pathname.slice(objectPrefix.length)));
		if (!rel) return deny(res);
		const file = path.join(STORAGE, rel);
		fs.mkdirSync(path.dirname(file), { recursive: true });
		const chunks = [];
		req.on('data', (chunk) => chunks.push(chunk));
		req.on('end', () => {
			fs.writeFileSync(file, Buffer.concat(chunks));
			res.writeHead(200, { 'content-type': 'application/json' });
			res.end(JSON.stringify({ Id: rel, Key: `media/${rel}` }));
		});
		return;
	}
	res.writeHead(404, { 'content-type': 'application/json' });
	res.end(JSON.stringify({ message: 'Not found', error: 'not_found' }));
}

function verifyBearer(req) {
	const header = req.headers.authorization || '';
	const token = header.startsWith('Bearer ') ? header.slice(7) : '';
	return token ? verify(token) : null;
}

function deny(res) {
	res.writeHead(401, { 'content-type': 'application/json' });
	res.end(JSON.stringify({ message: 'Unauthorized', error: 'unauthorized' }));
}

function safePath(value) {
	const rel = value.split('/').filter(Boolean).join('/');
	if (!rel || rel.includes('..')) return '';
	return rel;
}

function sendFile(req, res, rel) {
	if (!rel) {
		res.writeHead(404);
		res.end();
		return;
	}
	const file = path.join(STORAGE, rel);
	if (!file.startsWith(STORAGE) || !fs.existsSync(file)) {
		res.writeHead(404);
		res.end();
		return;
	}
	const stat = fs.statSync(file);
	const type = file.endsWith('.png') ? 'image/png' : file.endsWith('.jpg') || file.endsWith('.jpeg') ? 'image/jpeg' : file.endsWith('.webp') ? 'image/webp' : file.endsWith('.gif') ? 'image/gif' : file.endsWith('.mp4') ? 'video/mp4' : 'application/octet-stream';
	const range = req.headers.range;
	if (range) {
		const match = /bytes=(\d+)-(\d*)/.exec(range);
		if (!match) {
			res.writeHead(416);
			res.end();
			return;
		}
		const start = Number(match[1]);
		const end = match[2] ? Number(match[2]) : stat.size - 1;
		res.writeHead(206, {
			'content-type': type,
			'content-range': `bytes ${start}-${end}/${stat.size}`,
			'accept-ranges': 'bytes',
			'content-length': end - start + 1,
			'cache-control': 'public, max-age=3600'
		});
		fs.createReadStream(file, { start, end }).pipe(res);
		return;
	}
	res.writeHead(req.method === 'HEAD' ? 200 : 200, {
		'content-type': type,
		'content-length': stat.size,
		'accept-ranges': 'bytes',
		'cache-control': 'public, max-age=3600'
	});
	if (req.method === 'HEAD') res.end();
	else fs.createReadStream(file).pipe(res);
}

function start(name, command, args, options) {
	const log = fs.openSync(path.join(LOGS, `${name}.log`), 'a');
	const child = spawn(command, args, {
		...options,
		detached: true,
		stdio: ['ignore', log, log]
	});
	child.unref();
	fs.appendFileSync(path.join(DATA, 'pids'), `${name} ${child.pid}\n`);
}

function runAuth(args) {
	return new Promise((resolve, reject) => {
		const child = spawn(path.join(BIN, 'auth'), args, {
			cwd: BIN,
			env: {
				...process.env,
				GOTRUE_DB_DRIVER: 'postgres',
				GOTRUE_DB_DATABASE_URL: 'postgres://postgres:postgres@127.0.0.1:5432/postgres?sslmode=disable',
				GOTRUE_JWT_SECRET: secret,
				GOTRUE_SITE_URL: 'http://127.0.0.1:5173',
				API_EXTERNAL_URL: `http://127.0.0.1:${PORT}`,
				GOTRUE_DB_MIGRATIONS_PATH: path.join(BIN, 'migrations')
			}
		});
		let err = '';
		child.stderr.on('data', (chunk) => (err += chunk));
		child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(err || `auth exited ${code}`))));
	});
}

function psql(sql) {
	return new Promise((resolve, reject) => {
		const child = spawn('sudo', ['-u', 'postgres', 'psql', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-c', sql], { stdio: 'inherit' });
		child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('psql failed'))));
	});
}

function psqlFile(file) {
	return new Promise((resolve, reject) => {
		const child = spawn('sudo', ['-u', 'postgres', 'psql', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-f', file], { stdio: 'inherit' });
		child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`psql ${file} failed`))));
	});
}

function listening(port) {
	return new Promise((resolve) => {
		const socket = http.request({ hostname: '127.0.0.1', port, path: '/', method: 'GET', timeout: 400 }, (res) => {
			res.resume();
			resolve(true);
		});
		socket.on('error', () => resolve(false));
		socket.on('timeout', () => {
			socket.destroy();
			resolve(false);
		});
		socket.end();
	});
}

async function waitFor(port) {
	for (let attempt = 0; attempt < 40; attempt++) {
		if (await listening(port)) return;
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	throw new Error(`Nothing accepted connections on port ${port}. See .data/logs`);
}

async function ensureBinaries() {
	if (fs.existsSync(path.join(BIN, 'auth')) && fs.existsSync(path.join(BIN, 'postgrest')) && fs.existsSync(path.join(BIN, 'migrations'))) return;
	const cached = '/tmp/bins';
	if (fs.existsSync(path.join(cached, 'auth')) && fs.existsSync(path.join(cached, 'postgrest'))) {
		fs.copyFileSync(path.join(cached, 'auth'), path.join(BIN, 'auth'));
		fs.copyFileSync(path.join(cached, 'postgrest'), path.join(BIN, 'postgrest'));
		fs.cpSync(path.join(cached, 'migrations'), path.join(BIN, 'migrations'), { recursive: true });
		fs.chmodSync(path.join(BIN, 'auth'), 0o755);
		fs.chmodSync(path.join(BIN, 'postgrest'), 0o755);
		return;
	}
	if (os.arch() !== 'x64' || os.platform() !== 'linux') {
		throw new Error('Automatic local binaries are provided for Linux x64. Use hosted Supabase on other systems.');
	}
	await download(
		'https://github.com/supabase/auth/releases/download/v2.198.0/auth-v2.198.0-amd64.tar.xz',
		path.join(DATA, 'auth.tar.xz')
	);
	await download(
		'https://github.com/PostgREST/postgrest/releases/download/v16.6/postgrest-v16.6-linux-static-x86-64.tar.xz',
		path.join(DATA, 'postgrest.tar.xz')
	);
	await extract(path.join(DATA, 'auth.tar.xz'), BIN);
	await extract(path.join(DATA, 'postgrest.tar.xz'), BIN);
	fs.chmodSync(path.join(BIN, 'auth'), 0o755);
	fs.chmodSync(path.join(BIN, 'postgrest'), 0o755);
}

function download(url, dest) {
	if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) return Promise.resolve();
	return new Promise((resolve, reject) => {
		const file = fs.createWriteStream(dest);
		const getter = url.startsWith('https:') ? https.get : http.get;
		getter(url, (res) => {
			if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
				file.close();
				fs.rmSync(dest, { force: true });
				download(res.headers.location, dest).then(resolve, reject);
				return;
			}
			res.pipe(file);
			file.on('finish', () => file.close(() => resolve()));
		}).on('error', reject);
	});
}

function extract(archive, dest) {
	return new Promise((resolve, reject) => {
		const child = spawn('tar', ['-xJf', archive, '-C', dest]);
		child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('tar failed'))));
	});
}
