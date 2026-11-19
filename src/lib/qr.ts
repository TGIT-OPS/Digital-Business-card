import { unzlibSync, zlibSync } from 'fflate';
import { encode, renderSVG } from 'uqr';

export type QrTemplate = 'black' | 'red' | 'logo';

const DARK: Record<QrTemplate, [number, number, number]> = {
	black: [0, 0, 0],
	red: [0xb3, 0, 0],
	logo: [0xb3, 0, 0]
};

export function qrSvg(text: string, template: QrTemplate = 'black'): string {
	return renderSVG(text, {
		ecc: 'H',
		border: 2,
		pixelSize: 8,
		blackColor: template === 'black' ? '#000000' : '#B30000',
		whiteColor: '#ffffff'
	});
}

function crc32(bytes: Uint8Array): number {
	let crc = ~0;
	for (let i = 0; i < bytes.length; i++) {
		crc ^= bytes[i];
		for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
	}
	return ~crc >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
	const name = new TextEncoder().encode(type);
	const length = new Uint8Array(4);
	new DataView(length.buffer).setUint32(0, data.length);
	const body = new Uint8Array(name.length + data.length);
	body.set(name, 0);
	body.set(data, name.length);
	const crc = new Uint8Array(4);
	new DataView(crc.buffer).setUint32(0, crc32(body));
	const out = new Uint8Array(4 + body.length + 4);
	out.set(length, 0);
	out.set(body, 4);
	out.set(crc, 4 + body.length);
	return out;
}

function encodeRgb(raw: Uint8Array, dim: number): Uint8Array {
	const compressed = zlibSync(raw, { level: 9 });
	const ihdr = new Uint8Array(13);
	const view = new DataView(ihdr.buffer);
	view.setUint32(0, dim);
	view.setUint32(4, dim);
	ihdr[8] = 8;
	ihdr[9] = 2;
	const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
	const parts = [signature, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', new Uint8Array())];
	const png = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
	let cursor = 0;
	for (const part of parts) {
		png.set(part, cursor);
		cursor += part.length;
	}
	return png;
}

type Rgba = { width: number; height: number; data: Uint8Array };

function paeth(a: number, b: number, c: number) {
	const p = a + b - c;
	const pa = Math.abs(p - a);
	const pb = Math.abs(p - b);
	const pc = Math.abs(p - c);
	if (pa <= pb && pa <= pc) return a;
	if (pb <= pc) return b;
	return c;
}

export function decodePng(bytes: Uint8Array): Rgba {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	const width = view.getUint32(16);
	const height = view.getUint32(20);
	const color = bytes[25];
	let offset = 8;
	const idat: Uint8Array[] = [];
	while (offset < bytes.length) {
		const length = view.getUint32(offset);
		const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);
		if (type === 'IDAT') idat.push(bytes.slice(offset + 8, offset + 8 + length));
		if (type === 'IEND') break;
		offset += 12 + length;
	}
	const packed = new Uint8Array(idat.reduce((n, part) => n + part.length, 0));
	let cursor = 0;
	for (const part of idat) {
		packed.set(part, cursor);
		cursor += part.length;
	}
	const inflated = unzlibSync(packed);
	const channels = color === 6 ? 4 : 3;
	const stride = width * channels;
	const data = new Uint8Array(width * height * 4);
	let src = 0;
	let prev = new Uint8Array(stride);
	for (let y = 0; y < height; y++) {
		const filter = inflated[src++];
		const row = inflated.slice(src, src + stride);
		src += stride;
		const cur = new Uint8Array(stride);
		for (let i = 0; i < stride; i++) {
			const left = i >= channels ? cur[i - channels] : 0;
			const up = prev[i];
			const ul = i >= channels ? prev[i - channels] : 0;
			const value = row[i];
			cur[i] =
				filter === 1 ? (value + left) & 255
				: filter === 2 ? (value + up) & 255
				: filter === 3 ? (value + Math.floor((left + up) / 2)) & 255
				: filter === 4 ? (value + paeth(left, up, ul)) & 255
				: value;
		}
		for (let x = 0; x < width; x++) {
			const i = (y * width + x) * 4;
			const j = x * channels;
			data[i] = cur[j];
			data[i + 1] = cur[j + 1];
			data[i + 2] = cur[j + 2];
			data[i + 3] = channels === 4 ? cur[j + 3] : 255;
		}
		prev = cur;
	}
	return { width, height, data };
}

function blitLogo(rgb: Uint8Array, dim: number, logo: Uint8Array) {
	const image = decodePng(logo);
	const mark = Math.round(dim * 0.21);
	const pad = Math.round(mark * 0.16);
	const plate = mark + pad * 2;
	const ox = Math.round((dim - plate) / 2);
	const oy = Math.round((dim - plate) / 2);
	const radius = Math.round(plate * 0.18);
	for (let y = 0; y < plate; y++) {
		for (let x = 0; x < plate; x++) {
			const dx = Math.min(x, plate - 1 - x);
			const dy = Math.min(y, plate - 1 - y);
			if (dx < radius && dy < radius && (radius - dx) ** 2 + (radius - dy) ** 2 > radius * radius) continue;
			const i = ((oy + y) * dim + (ox + x)) * 3;
			rgb[i] = 255;
			rgb[i + 1] = 255;
			rgb[i + 2] = 255;
		}
	}
	for (let y = 0; y < mark; y++) {
		for (let x = 0; x < mark; x++) {
			const sx = Math.min(image.width - 1, Math.floor((x / mark) * image.width));
			const sy = Math.min(image.height - 1, Math.floor((y / mark) * image.height));
			const p = (sy * image.width + sx) * 4;
			const alpha = image.data[p + 3] / 255;
			if (alpha < 0.1) continue;
			const i = ((oy + pad + y) * dim + (ox + pad + x)) * 3;
			rgb[i] = Math.round(image.data[p] * alpha + 255 * (1 - alpha));
			rgb[i + 1] = Math.round(image.data[p + 1] * alpha + 255 * (1 - alpha));
			rgb[i + 2] = Math.round(image.data[p + 2] * alpha + 255 * (1 - alpha));
		}
	}
}

export function qrPng(
	text: string,
	options?: { scale?: number; template?: QrTemplate; logo?: Uint8Array | null }
): Uint8Array {
	const template = options?.template ?? 'black';
	const qr = encode(text, { ecc: 'H', border: 2 });
	const scale = options?.scale ?? 12;
	const dim = qr.size * scale;
	const dark = DARK[template];
	const pixels = new Uint8Array(dim * dim * 3);
	for (let y = 0; y < dim; y++) {
		const row = qr.data[Math.floor(y / scale)];
		for (let x = 0; x < dim; x++) {
			const on = row[Math.floor(x / scale)];
			const i = (y * dim + x) * 3;
			pixels[i] = on ? dark[0] : 255;
			pixels[i + 1] = on ? dark[1] : 255;
			pixels[i + 2] = on ? dark[2] : 255;
		}
	}
	if (template === 'logo' && options?.logo) blitLogo(pixels, dim, options.logo);
	const raw = new Uint8Array((1 + dim * 3) * dim);
	let offset = 0;
	for (let y = 0; y < dim; y++) {
		raw[offset++] = 0;
		raw.set(pixels.subarray(y * dim * 3, (y + 1) * dim * 3), offset);
		offset += dim * 3;
	}
	return encodeRgb(raw, dim);
}
