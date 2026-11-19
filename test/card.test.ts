import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import test from 'node:test';
import { buildCardPdf, PRINT_PAGE } from '../src/lib/print-pdf.ts';
import { qrPng, qrSvg } from '../src/lib/qr.ts';
import { parseVideoUrl } from '../src/lib/video.ts';
import { buildVCard } from '../src/lib/vcard.ts';

const URL = 'https://cards.tgitsolutions.com/c/manoharan';

test('vCard imports as Manoharan at TGIT', () => {
	const card = buildVCard({
		name: 'Manoharan',
		title: 'IT Manager',
		company: 'TGIT Pte Ltd',
		phone: '+65 80151060',
		email: 'support@tgitsolutions.com',
		website: 'https://tgitsolutions.com',
		street: '101 Eunos Ave 3',
		city: 'Singapore',
		postal: '409835',
		country: 'Singapore',
		note: URL
	});
	assert.match(card, /\r\n/);
	assert.ok(card.startsWith('BEGIN:VCARD\r\nVERSION:3.0\r\n'));
	assert.ok(card.includes('FN:Manoharan'));
	assert.ok(card.includes('TEL;TYPE=WORK,VOICE:+6580151060'));
	assert.ok(card.includes('ORG:TGIT Pte Ltd'));
	assert.ok(card.endsWith('END:VCARD\r\n'));
	fs.mkdirSync('test/tmp', { recursive: true });
	fs.writeFileSync('test/tmp/manoharan.vcf', card);
	const parsed = spawnSync('python3', ['-c', `
import vobject
c = vobject.readOne(open('test/tmp/manoharan.vcf').read())
assert c.fn.value == 'Manoharan'
assert '80151060' in c.tel.value
assert c.email.value == 'support@tgitsolutions.com'
assert c.org.value[0] == 'TGIT Pte Ltd'
print('ok')
`]);
	assert.equal(parsed.status, 0, parsed.stderr.toString());
});

test('QR templates decode to the public card URL', () => {
	const svg = qrSvg(URL, 'red');
	assert.match(svg, /^<svg/);
	assert.match(svg, /#B30000/i);
	fs.mkdirSync('test/tmp', { recursive: true });
	const logo = fs.readFileSync('static/brand/tgit-logo.png');
	for (const template of ['black', 'red', 'logo'] as const) {
		const png = qrPng(URL, { scale: 12, template, logo: template === 'logo' ? logo : null });
		assert.equal(png[0], 137);
		const file = `test/tmp/qr-${template}.png`;
		fs.writeFileSync(file, png);
		const decoded = spawnSync('python3', ['-c', `
from PIL import Image
from pyzbar.pyzbar import decode
hits = decode(Image.open('${file}'))
assert hits, 'no code'
text = hits[0].data.decode()
assert text == '${URL}', text
print(text)
`]);
		assert.equal(decoded.status, 0, `${template}: ${decoded.stderr.toString()}`);
	}
});

test('print PDF is two pages of 55 by 90 millimetres', async () => {
	const fonts = {
		regular: fs.readFileSync('static/fonts/selawk.ttf'),
		bold: fs.readFileSync('static/fonts/selawkb.ttf'),
		italic: fs.readFileSync('static/fonts/selawk.ttf'),
		semibold: fs.readFileSync('static/fonts/selawksb.ttf')
	};
	const icons = {
		phone: fs.readFileSync('static/print/phone.png'),
		mail: fs.readFileSync('static/print/mail.png'),
		globe: fs.readFileSync('static/print/globe.png'),
		pin: fs.readFileSync('static/print/pin.png')
	};
	const pdf = await buildCardPdf({
		name: 'Manoharan Pethappan',
		title: 'IT Manager',
		department: '',
		company: 'TGIT Pte Ltd',
		phone: '+65 8015 1060',
		email: 'manoharan@tgitsolutions.com',
		website: 'tgitsolutions.com',
		address: '#08-01, 101 Eunos Avenue 3, Singapore 409538',
		addressLines: ['#08-01, 101 Eunos Avenue 3', 'Singapore 409538'],
		blurb: 'Trusted provider of enterprise IT solutions since 2016.',
		tagline: 'Transforming IT into reality',
		services: ['Managed IT and support', 'ERP solutions', 'Infrastructure and cloud', 'Microsoft 365 and Teams', 'CCTV and door access', 'Products and licences'],
		companyEmail: '',
		cardUrl: URL,
		poster: fs.readFileSync('static/brand/tgit-hand-poster.jpg'),
		primary: '#FF0000',
		accent: '#FFCF37',
		showWhatsapp: true,
		logo: fs.readFileSync('static/brand/tgit-logo.png'),
		logoLight: fs.readFileSync('static/brand/tgit-logo-white.png'),
		fonts,
		icons
	});
	fs.mkdirSync('test/tmp', { recursive: true });
	fs.writeFileSync('test/tmp/manoharan-card.pdf', pdf);
	const { PDFDocument } = await import('pdf-lib');
	const doc = await PDFDocument.load(pdf);
	assert.equal(doc.getPageCount(), 2);
	for (const page of doc.getPages()) {
		const size = page.getSize();
		assert.ok(Math.abs(size.width - PRINT_PAGE.width) < 0.2);
		assert.ok(Math.abs(size.height - PRINT_PAGE.height) < 0.2);
	}
});

test('only YouTube and Vimeo links are accepted', () => {
	assert.equal(parseVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')?.id, 'dQw4w9WgXcQ');
	assert.equal(parseVideoUrl('https://youtu.be/dQw4w9WgXcQ')?.mode, 'youtube');
	assert.equal(parseVideoUrl('https://vimeo.com/123456789')?.mode, 'vimeo');
	assert.equal(parseVideoUrl('https://evil.example/watch?v=dQw4w9WgXcQ'), null);
	assert.equal(parseVideoUrl('javascript:alert(1)'), null);
});

test('public card motion can be reduced', () => {
	const css = fs.readFileSync('src/lib/public.css', 'utf8');
	assert.match(css, /prefers-reduced-motion:\s*reduce/);
	assert.match(css, /prefers-reduced-motion:\s*no-preference/);
	assert.match(css, /\.pc-theme/);
});
