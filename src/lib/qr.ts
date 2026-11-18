import { zlibSync } from 'fflate';
import { encode, renderSVG } from 'uqr';

export function qrSvg(text: string, dark = '#000000'): string {
	return renderSVG(text, {
		ecc: 'M',
		border: 2,
		pixelSize: 8,
		blackColor: dark,
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

export function qrPng(
	text: string,
	options?: { scale?: number; dark?: [number, number, number] }
): Uint8Array {
	const qr = encode(text, { ecc: 'M', border: 2 });
	const scale = options?.scale ?? 16;
	const dim = qr.size * scale;
	const dark = options?.dark ?? [0, 0, 0];
	const raw = new Uint8Array((1 + dim * 3) * dim);
	let offset = 0;
	for (let y = 0; y < dim; y++) {
		raw[offset++] = 0;
		const row = qr.data[Math.floor(y / scale)];
		for (let x = 0; x < dim; x++) {
			const on = row[Math.floor(x / scale)];
			raw[offset++] = on ? dark[0] : 255;
			raw[offset++] = on ? dark[1] : 255;
			raw[offset++] = on ? dark[2] : 255;
		}
	}
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
