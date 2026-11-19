import fontkit from '@pdf-lib/fontkit';
import { BlendMode, PDFDocument, rgb, type PDFFont, type PDFImage, type PDFPage, type RGB } from 'pdf-lib';
import { encode } from 'uqr';

const MM = 72 / 25.4;
const PAGE_W = 55 * MM;
const PAGE_H = 90 * MM;

export type PrintInput = {
	name: string;
	title: string;
	department: string;
	company: string;
	phone: string;
	email: string;
	website: string;
	address: string;
	addressLines: string[];
	blurb: string;
	tagline: string;
	services: string[];
	companyEmail: string;
	cardUrl: string;
	primary: string;
	accent: string;
	showWhatsapp: boolean;
	logo?: Uint8Array | null;
	logoLight?: Uint8Array | null;
	poster?: Uint8Array | null;
	fonts: {
		regular: Uint8Array;
		bold: Uint8Array;
		italic: Uint8Array;
		semibold: Uint8Array;
	};
	icons: {
		phone: Uint8Array;
		mail: Uint8Array;
		globe: Uint8Array;
		pin: Uint8Array;
	};
};

type Pill = {
	label: string;
	value: string;
	icon: 'phone' | 'mail' | 'globe' | 'pin';
	badge?: boolean;
};

function hexRgb(hex: string, mix = 0): RGB {
	const raw = hex.replace('#', '');
	const n = Number.parseInt(raw, 16);
	const r = ((n >> 16) & 255) / 255;
	const g = ((n >> 8) & 255) / 255;
	const b = (n & 255) / 255;
	return rgb(r * (1 - mix), g * (1 - mix), b * (1 - mix));
}

function printGold(accent: string): RGB {
	const key = accent.toUpperCase();
	if (key === '#FFCF37' || key === '#E8B954') return rgb(232 / 255, 185 / 255, 84 / 255);
	return hexRgb(accent);
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
	const words = text.split(/\s+/).filter(Boolean);
	const lines: string[] = [];
	let line = '';
	for (const word of words) {
		const next = line ? `${line} ${word}` : word;
		if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
			lines.push(line);
			line = word;
		} else {
			line = next;
		}
	}
	if (line) lines.push(line);
	return lines;
}

async function embedAny(doc: PDFDocument, bytes: Uint8Array): Promise<PDFImage | null> {
	if (bytes.length < 4) return null;
	try {
		if (bytes[0] === 0x89 && bytes[1] === 0x50) return await doc.embedPng(bytes);
		if (bytes[0] === 0xff && bytes[1] === 0xd8) return await doc.embedJpg(bytes);
	} catch {
		return null;
	}
	return null;
}

function fit(image: PDFImage, maxW: number, maxH: number) {
	const scale = Math.min(maxW / image.width, maxH / image.height);
	return { w: image.width * scale, h: image.height * scale };
}

function roundRect(x: number, y: number, w: number, h: number, r: number) {
	const radius = Math.min(r, w / 2, h / 2);
	return [
		`M ${x + radius} ${y}`,
		`H ${x + w - radius}`,
		`Q ${x + w} ${y} ${x + w} ${y + radius}`,
		`V ${y + h - radius}`,
		`Q ${x + w} ${y + h} ${x + w - radius} ${y + h}`,
		`H ${x + radius}`,
		`Q ${x} ${y + h} ${x} ${y + h - radius}`,
		`V ${y + radius}`,
		`Q ${x} ${y} ${x + radius} ${y}`,
		'Z'
	].join(' ');
}

export async function buildCardPdf(input: PrintInput): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	doc.registerFontkit(fontkit);
	doc.setTitle(`${input.name} · ${input.company}`);
	doc.setAuthor(input.company || 'TGIT Nexus');
	const regular = await doc.embedFont(input.fonts.regular);
	const bold = await doc.embedFont(input.fonts.bold);
	const italic = await doc.embedFont(input.fonts.italic);
	const semibold = await doc.embedFont(input.fonts.semibold);
	const icons = {
		phone: await embedAny(doc, input.icons.phone),
		mail: await embedAny(doc, input.icons.mail),
		globe: await embedAny(doc, input.icons.globe),
		pin: await embedAny(doc, input.icons.pin)
	};
	const logo = input.logo ? await embedAny(doc, input.logo) : null;
	const logoLight = input.logoLight ? await embedAny(doc, input.logoLight) : null;
	const poster = input.poster ? await embedAny(doc, input.poster) : null;
	const gold = printGold(input.accent);
	const red = input.primary.toUpperCase() === '#FF0000' ? rgb(1, 0, 0) : hexRgb(input.primary);
	const maroon = hexRgb('#5C100C');
	const ink = rgb(0.1, 0.1, 0.1);
	const white = rgb(1, 1, 1);

	const front = doc.addPage([PAGE_W, PAGE_H]);
	const back = doc.addPage([PAGE_W, PAGE_H]);
	const fonts = { regular, bold, italic, semibold };
	drawV2Front(front, input, fonts, logo, poster, icons, gold, red, maroon, ink, white);
	drawV2Back(back, input, fonts, logo, logoLight, gold, red, maroon, ink, white);
	return doc.save();
}

const WAVE_EDGE = 17.5 * MM;
const WAVE_DIP = 24.5 * MM;

function waveCover(colorTop: number): string {
	return `M 0 ${WAVE_EDGE} C ${PAGE_W * 0.2} ${WAVE_EDGE}, ${PAGE_W * 0.34} ${WAVE_DIP}, ${PAGE_W / 2} ${WAVE_DIP} C ${PAGE_W * 0.66} ${WAVE_DIP}, ${PAGE_W * 0.8} ${WAVE_EDGE}, ${PAGE_W} ${WAVE_EDGE} L ${PAGE_W} ${colorTop} L 0 ${colorTop} Z`;
}

function waveStroke(): string {
	return `M 0 ${WAVE_EDGE} C ${PAGE_W * 0.2} ${WAVE_EDGE}, ${PAGE_W * 0.34} ${WAVE_DIP}, ${PAGE_W / 2} ${WAVE_DIP} C ${PAGE_W * 0.66} ${WAVE_DIP}, ${PAGE_W * 0.8} ${WAVE_EDGE}, ${PAGE_W} ${WAVE_EDGE}`;
}

function paintV2Header(page: PDFPage, gold: RGB, red: RGB, poster: PDFImage | null, logoLight: PDFImage | null) {
	page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: gold });
	page.drawRectangle({ x: 0, y: PAGE_H - WAVE_DIP, width: PAGE_W, height: WAVE_DIP, color: red });
	if (poster) {
		const boxH = WAVE_DIP + 2 * MM;
		const scale = Math.max(PAGE_W / poster.width, boxH / poster.height);
		const w = poster.width * scale;
		const h = poster.height * scale;
		page.drawImage(poster, {
			x: (PAGE_W - w) / 2,
			y: PAGE_H - boxH + (boxH - h) / 2,
			width: w,
			height: h
		});
		page.drawRectangle({
			x: 0,
			y: PAGE_H - WAVE_DIP - 1,
			width: PAGE_W,
			height: WAVE_DIP + 1,
			color: red,
			blendMode: BlendMode.Multiply
		});
	}
	page.drawSvgPath(waveCover(PAGE_H), { x: 0, y: PAGE_H, color: gold });
	page.drawSvgPath(waveStroke(), { x: 0, y: PAGE_H, borderColor: rgb(0.78, 0, 0), borderWidth: 1.35 });
	if (!poster && logoLight) {
		const box = fit(logoLight, 32 * MM, 9 * MM);
		page.drawImage(logoLight, {
			x: (PAGE_W - box.w) / 2,
			y: PAGE_H - 6 * MM - box.h,
			width: box.w,
			height: box.h,
			opacity: 0.4
		});
	}
}

function drawStripe(page: PDFPage, red: RGB) {
	const band = 1.55 * MM;
	page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: band, color: rgb(1, 1, 0.63) });
	page.drawRectangle({ x: 0, y: band, width: PAGE_W, height: band, color: rgb(0.94, 0.76, 0.29) });
	page.drawRectangle({ x: 0, y: band * 2, width: PAGE_W, height: band, color: red });
}

function drawV2Front(
	page: PDFPage,
	input: PrintInput,
	fonts: { regular: PDFFont; bold: PDFFont; italic: PDFFont; semibold: PDFFont },
	logo: PDFImage | null,
	poster: PDFImage | null,
	icons: Record<Pill['icon'], PDFImage | null>,
	gold: RGB,
	red: RGB,
	maroon: RGB,
	ink: RGB,
	white: RGB
) {
	paintV2Header(page, gold, red, poster, null);
	let top = WAVE_DIP + 1.6 * MM;
	if (logo) {
		const box = fit(logo, 26 * MM, 6.2 * MM);
		page.drawImage(logo, { x: (PAGE_W - box.w) / 2, y: PAGE_H - top - box.h, width: box.w, height: box.h });
		top += box.h + 1.5 * MM;
	}
	let nameSize = 9.5;
	const maxText = PAGE_W - 8 * MM;
	while (nameSize > 8 && fonts.bold.widthOfTextAtSize(input.name || ' ', nameSize) > maxText) nameSize -= 0.3;
	const nameW = fonts.bold.widthOfTextAtSize(input.name || ' ', nameSize);
	page.drawText(input.name || ' ', { x: (PAGE_W - nameW) / 2, y: textY(top, nameSize), size: nameSize, font: fonts.bold, color: maroon });
	top += nameSize + 1.6 * MM;
	if (input.title) {
		const w = fonts.semibold.widthOfTextAtSize(input.title, 7);
		page.drawText(input.title, { x: (PAGE_W - w) / 2, y: textY(top, 7), size: 7, font: fonts.semibold, color: ink });
		top += 3.2 * MM;
	}
	if (input.company) {
		const w = fonts.italic.widthOfTextAtSize(input.company, 7);
		page.drawText(input.company, { x: (PAGE_W - w) / 2, y: textY(top, 7), size: 7, font: fonts.italic, color: maroon });
		top += 3.4 * MM;
	}
	const qrSize = 13.2 * MM;
	drawQr(page, input.cardUrl, top, qrSize, rgb(0, 0, 0), white);
	top += qrSize + 1.3 * MM;
	const caption = 'Scan to view our company profile';
	let cap = 5.3;
	while (cap > 4.2 && fonts.semibold.widthOfTextAtSize(caption, cap) > PAGE_W - 8 * MM) cap -= 0.15;
	const capW = fonts.semibold.widthOfTextAtSize(caption, cap);
	page.drawText(caption, { x: (PAGE_W - capW) / 2, y: textY(top, cap), size: cap, font: fonts.semibold, color: maroon });
	top += 3.3 * MM;
	const tiles: Pill[] = [];
	if (input.email) tiles.push({ label: 'EMAIL', value: input.email, icon: 'mail' });
	if (input.phone) tiles.push({ label: 'PHONE', value: input.phone, icon: 'phone' });
	if (input.website) tiles.push({ label: 'WEBSITE', value: input.website, icon: 'globe' });
	const tileH = 5.7 * MM;
	for (const tile of tiles) {
		drawPill(page, tile, top, tileH, fonts.semibold, fonts.bold, icons, maroon, red, white, rgb(0, 0, 0), true);
		top += tileH + 1.05 * MM;
	}
	drawStripe(page, red);
}

function drawV2Back(
	page: PDFPage,
	input: PrintInput,
	fonts: { regular: PDFFont; bold: PDFFont; italic: PDFFont; semibold: PDFFont },
	logo: PDFImage | null,
	logoLight: PDFImage | null,
	gold: RGB,
	red: RGB,
	maroon: RGB,
	ink: RGB,
	white: RGB
) {
	paintV2Header(page, gold, red, null, logoLight);
	void white;
	let top = WAVE_DIP + 2.4 * MM;
	if (logo) {
		const box = fit(logo, 26 * MM, 6.6 * MM);
		page.drawImage(logo, { x: (PAGE_W - box.w) / 2, y: PAGE_H - top - box.h, width: box.w, height: box.h });
		top += box.h + 1.2 * MM;
		page.drawRectangle({ x: (PAGE_W - 12 * MM) / 2, y: PAGE_H - top - 0.7 * MM, width: 12 * MM, height: 0.7 * MM, color: red });
		top += 2.4 * MM;
	}
	const tagline = input.tagline || '';
	if (tagline) {
		const lines = wrap(tagline, fonts.bold, 8, PAGE_W - 10 * MM);
		for (const line of lines.slice(0, 2)) {
			const w = fonts.bold.widthOfTextAtSize(line, 8);
			page.drawText(line, { x: (PAGE_W - w) / 2, y: textY(top, 8), size: 8, font: fonts.bold, color: ink });
			top += 3.4 * MM;
		}
		top += 1.2 * MM;
	}
	const services = input.services.filter(Boolean).slice(0, 8);
	const size = 7.1;
	for (const service of services) {
		const text = service.length > 42 ? service.slice(0, 41) + '…' : service;
		const textW = fonts.regular.widthOfTextAtSize(text, size);
		const block = 2.2 * MM + 1.6 * MM + textW;
		const x = (PAGE_W - block) / 2;
		page.drawRectangle({ x, y: PAGE_H - top - 2.3 * MM, width: 2.1 * MM, height: 2.1 * MM, color: red });
		page.drawText(text, { x: x + 3.6 * MM, y: textY(top, size), size, font: fonts.regular, color: ink });
		top += 3.5 * MM;
	}
	top += 1.2 * MM;
	page.drawRectangle({ x: 8 * MM, y: PAGE_H - top, width: PAGE_W - 16 * MM, height: 0.6 * MM, color: red });
	top += 3 * MM;
	const companyW = fonts.bold.widthOfTextAtSize(input.company || '', 8);
	page.drawText(input.company || '', { x: (PAGE_W - companyW) / 2, y: textY(top, 8), size: 8, font: fonts.bold, color: ink });
	top += 3.6 * MM;
	for (const line of input.addressLines) {
		const w = fonts.regular.widthOfTextAtSize(line, 6.4);
		page.drawText(line, { x: (PAGE_W - w) / 2, y: textY(top, 6.4), size: 6.4, font: fonts.regular, color: ink });
		top += 2.8 * MM;
	}
	drawStripe(page, red);
}

function paintHeader(page: PDFPage, gold: RGB, red: RGB, logoLight: PDFImage | null) {
	page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: gold });
	const edge = 18.4 * MM;
	const dip = 23 * MM;
	const wave = `M 0 0 H ${PAGE_W} V ${edge} C ${PAGE_W * 0.8} ${edge}, ${PAGE_W * 0.66} ${dip}, ${PAGE_W / 2} ${dip} C ${PAGE_W * 0.34} ${dip}, ${PAGE_W * 0.2} ${edge}, 0 ${edge} Z`;
	page.drawSvgPath(wave, { x: 0, y: PAGE_H, color: red });
	if (logoLight) {
		const box = fit(logoLight, 34 * MM, 10.5 * MM);
		page.drawImage(logoLight, {
			x: (PAGE_W - box.w) / 2,
			y: PAGE_H - 4.2 * MM - box.h,
			width: box.w,
			height: box.h,
			opacity: 0.38
		});
	}
}

function textY(top: number, size: number) {
	return PAGE_H - top - size * 0.82;
}

function drawFront(
	page: PDFPage,
	input: PrintInput,
	fonts: { regular: PDFFont; bold: PDFFont; italic: PDFFont; semibold: PDFFont },
	logo: PDFImage | null,
	icons: Record<Pill['icon'], PDFImage | null>,
	pills: Pill[],
	maroon: RGB,
	ink: RGB,
	red: RGB,
	white: RGB,
	green: RGB
) {
	let top = 26.2 * MM;
	if (logo) {
		const box = fit(logo, 30 * MM, 8.2 * MM);
		page.drawImage(logo, {
			x: (PAGE_W - box.w) / 2,
			y: PAGE_H - top - box.h,
			width: box.w,
			height: box.h
		});
		top += box.h + 3.2 * MM;
	}

	const blockTop = top;
	const textX = 10.2 * MM;
	const maxText = PAGE_W - textX - 4 * MM;
	let nameSize = 13;
	while (nameSize > 8 && fonts.bold.widthOfTextAtSize(input.name || ' ', nameSize) > maxText) nameSize -= 0.4;
	page.drawText(input.name || ' ', {
		x: textX,
		y: textY(top, nameSize),
		size: nameSize,
		font: fonts.bold,
		color: maroon
	});
	top += nameSize + 2.4;
	if (input.title) {
		page.drawText(input.title, {
			x: textX,
			y: textY(top, 7.4),
			size: 7.4,
			font: fonts.semibold,
			color: ink
		});
		top += 10;
	}
	if (input.department) {
		page.drawText(input.department, {
			x: textX,
			y: textY(top, 6.6),
			size: 6.6,
			font: fonts.regular,
			color: ink
		});
		top += 9;
	}
	if (input.company) {
		page.drawText(input.company, {
			x: textX,
			y: textY(top, 7.1),
			size: 7.1,
			font: fonts.italic,
			color: maroon
		});
		top += 10;
	}
	const barH = Math.max(top - blockTop, 8 * MM);
	page.drawRectangle({
		x: 7.2 * MM,
		y: PAGE_H - blockTop - barH + 1,
		width: 1.15 * MM,
		height: barH,
		color: red
	});
	top += 3.2 * MM;

	const heights = pills.map((pill) => pillHeight(pill, fonts.semibold));
	const gaps = Math.max(pills.length - 1, 0);
	let gap = 2.15 * MM;
	const natural = heights.reduce((sum, height) => sum + height, 0) + gaps * gap;
	const room = PAGE_H - 6.5 * MM - top;
	if (natural > room && gaps) gap = Math.max(1.1 * MM, (room - heights.reduce((s, h) => s + h, 0)) / gaps);
	for (let i = 0; i < pills.length; i++) {
		drawPill(page, pills[i], top, heights[i], fonts.semibold, fonts.bold, icons, maroon, red, white, green);
		top += heights[i] + (i < pills.length - 1 ? gap : 0);
	}
}

function drawBack(
	page: PDFPage,
	input: PrintInput,
	fonts: { regular: PDFFont; bold: PDFFont; semibold: PDFFont },
	icons: Record<Pill['icon'], PDFImage | null>,
	pills: Pill[],
	maroon: RGB,
	white: RGB,
	green: RGB,
	red: RGB
) {
	let top = 24.4 * MM;
	const company = (input.company || '').toUpperCase();
	let companySize = 10;
	while (companySize > 7 && fonts.bold.widthOfTextAtSize(company || ' ', companySize) > PAGE_W - 8 * MM) {
		companySize -= 0.3;
	}
	const companyW = fonts.bold.widthOfTextAtSize(company || ' ', companySize);
	page.drawText(company || ' ', {
		x: (PAGE_W - companyW) / 2,
		y: textY(top, companySize),
		size: companySize,
		font: fonts.bold,
		color: maroon
	});
	top += companySize + 2.1 * MM;

	if (input.blurb) {
		let size = 5.6;
		let lines = wrap(input.blurb, fonts.regular, size, PAGE_W - 9 * MM);
		while (lines.length > 3 && size > 4.8) {
			size -= 0.15;
			lines = wrap(input.blurb, fonts.regular, size, PAGE_W - 9 * MM);
		}
		lines = lines.slice(0, 3);
		for (const line of lines) {
			const width = fonts.regular.widthOfTextAtSize(line, size);
			page.drawText(line, {
				x: (PAGE_W - width) / 2,
				y: textY(top, size),
				size,
				font: fonts.regular,
				color: maroon
			});
			top += size + 1.05;
		}
		top += 1.2 * MM;
	}

	const heights = pills.map((pill) => pillHeight(pill, fonts.semibold, true));
	const gap = 1.15 * MM;
	const block = heights.reduce((sum, height) => sum + height, 0) + Math.max(heights.length - 1, 0) * gap;
	const pillsTop = PAGE_H - 2.5 * MM - block;
	const qrFloor = pillsTop - 3.7 * MM;
	const qrSize = Math.max(11 * MM, Math.min(17.5 * MM, qrFloor - top - 0.6 * MM));
	const qrTop = qrFloor - qrSize;
	drawQr(page, input.cardUrl, qrTop, qrSize, maroon, white);
	const caption = 'Scan for our products & services';
	const captionSize = 5.8;
	const captionW = fonts.semibold.widthOfTextAtSize(caption, captionSize);
	page.drawText(caption, {
		x: (PAGE_W - captionW) / 2,
		y: textY(qrTop + qrSize + 0.7 * MM, captionSize),
		size: captionSize,
		font: fonts.semibold,
		color: maroon
	});
	let cursor = pillsTop;
	for (let i = 0; i < pills.length; i++) {
		drawPill(page, pills[i], cursor, heights[i], fonts.semibold, fonts.bold, icons, maroon, red, white, green, true);
		cursor += heights[i] + gap;
	}
}

function pillHeight(pill: Pill, font: PDFFont, compact = false): number {
	const inner = PAGE_W - 7.2 * MM - 12 * MM;
	const lines = wrap(pill.value, font, compact ? 6.2 : 6.7, inner);
	if (compact) return lines.length > 1 ? 8.3 * MM : 6.55 * MM;
	return lines.length > 1 ? 9.3 * MM : 7.55 * MM;
}

function drawPill(
	page: PDFPage,
	pill: Pill,
	top: number,
	height: number,
	labelFont: PDFFont,
	valueFont: PDFFont,
	icons: Record<Pill['icon'], PDFImage | null>,
	maroon: RGB,
	red: RGB,
	white: RGB,
	green: RGB,
	compact = false
) {
	const x = 3.5 * MM;
	const w = PAGE_W - 7 * MM;
	const shadow = roundRect(x, top + 0.7, w, height, 3.1 * MM);
	page.drawSvgPath(shadow, { x: 0, y: PAGE_H, color: rgb(0.72, 0.52, 0.16), opacity: 0.18 });
	page.drawSvgPath(roundRect(x, top, w, height, 3.1 * MM), { x: 0, y: PAGE_H, color: white });
	const radius = 3.15 * MM;
	const cx = x + 2.1 * MM + radius;
	const cy = PAGE_H - top - height / 2;
	page.drawCircle({ x: cx, y: cy, size: radius, color: red });
	const icon = icons[pill.icon];
	if (icon) {
		const size = radius * 1.22;
		page.drawImage(icon, { x: cx - size / 2, y: cy - size / 2, width: size, height: size });
	}
	if (pill.badge && icons.phone) {
		const br = 1.45 * MM;
		const bx = cx + radius * 0.62;
		const by = cy - radius * 0.62;
		page.drawCircle({ x: bx, y: by, size: br, color: green, borderColor: white, borderWidth: 0.7 });
		const mark = br * 1.15;
		page.drawImage(icons.phone, { x: bx - mark / 2, y: by - mark / 2, width: mark, height: mark });
	}
	const textX = x + 2.1 * MM + radius * 2 + 2.3 * MM;
	const inner = x + w - 2.2 * MM - textX;
	const valueSize = fitSize(pill.value, valueFont, inner, 6.8);
	const lines = wrap(pill.value, valueFont, valueSize, inner).slice(0, 2);
	page.drawText(pill.label, {
		x: textX,
		y: textY(top + 1.55 * MM, 4.7),
		size: 4.7,
		font: labelFont,
		color: maroon
	});
	let lineTop = top + 3.35 * MM;
	for (const line of lines) {
		page.drawText(line, {
			x: textX,
			y: textY(lineTop, valueSize),
			size: valueSize,
			font: valueFont,
			color: maroon
		});
		lineTop += valueSize + 1.3;
	}
}

function fitSize(text: string, font: PDFFont, maxWidth: number, start: number) {
	let size = start;
	const first = text.split(/\s+/)[0] ?? text;
	while (size > 5 && font.widthOfTextAtSize(first, size) > maxWidth) size -= 0.2;
	return size;
}

function drawQr(page: PDFPage, url: string, top: number, size: number, maroon: RGB, white: RGB) {
	const x = (PAGE_W - size) / 2;
	page.drawSvgPath(roundRect(x, top, size, size, 2.4 * MM), { x: 0, y: PAGE_H, color: white });
	const qr = encode(url, { ecc: 'Q', border: 0 });
	const pad = size * 0.1;
	const cell = (size - pad * 2) / qr.size;
	for (let row = 0; row < qr.size; row++) {
		for (let col = 0; col < qr.size; col++) {
			if (!qr.data[row][col]) continue;
			const px = x + pad + col * cell;
			const py = PAGE_H - top - pad - (row + 1) * cell;
			page.drawRectangle({ x: px, y: py, width: cell * 1.02, height: cell * 1.02, color: maroon });
		}
	}
}

export const PRINT_PAGE = { width: PAGE_W, height: PAGE_H };
