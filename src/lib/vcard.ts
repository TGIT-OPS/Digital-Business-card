export type VCardInput = {
	name: string;
	title?: string | null;
	department?: string | null;
	company?: string | null;
	phone?: string | null;
	whatsapp?: string | null;
	email?: string | null;
	website?: string | null;
	street?: string | null;
	city?: string | null;
	postal?: string | null;
	country?: string | null;
	note?: string | null;
};

function esc(value: string): string {
	return value
		.replace(/\\/g, '\\\\')
		.replace(/\r\n|\r|\n/g, '\\n')
		.replace(/,/g, '\\,')
		.replace(/;/g, '\\;');
}

function fold(line: string): string {
	const chars = Array.from(line);
	if (chars.length <= 74) return line;
	const parts: string[] = [];
	let current = '';
	for (const ch of chars) {
		if (current.length >= 74) {
			parts.push(current);
			current = ' ' + ch;
		} else {
			current += ch;
		}
	}
	if (current) parts.push(current);
	return parts.join('\r\n');
}

function nameParts(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length <= 1) return `${esc(parts[0] || name)};`;
	const family = parts.pop() ?? '';
	return `${esc(family)};${esc(parts.join(' '))}`;
}

function phoneDigits(value: string): string {
	const keep = value.replace(/[^\d+]/g, '');
	return keep;
}

export function buildVCard(input: VCardInput): string {
	const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${esc(input.name)}`, `N:${nameParts(input.name)};;;`];
	if (input.title) lines.push(`TITLE:${esc(input.title)}`);
	if (input.department) lines.push(`ROLE:${esc(input.department)}`);
	if (input.company) lines.push(`ORG:${esc(input.company)}`);
	if (input.phone) lines.push(`TEL;TYPE=WORK,VOICE:${phoneDigits(input.phone)}`);
	const wa = (input.whatsapp ?? '').replace(/\D/g, '');
	const phoneDigitsOnly = (input.phone ?? '').replace(/\D/g, '');
	if (wa && wa !== phoneDigitsOnly) lines.push(`TEL;TYPE=CELL:${wa.startsWith('+') ? wa : `+${wa}`}`);
	if (input.email) lines.push(`EMAIL;TYPE=INTERNET:${esc(input.email)}`);
	if (input.website) lines.push(`URL:${esc(input.website)}`);
	if (input.street || input.city || input.postal || input.country) {
		lines.push(
			`ADR;TYPE=WORK:;;${esc(input.street ?? '')};${esc(input.city ?? '')};;${esc(input.postal ?? '')};${esc(input.country ?? '')}`
		);
	}
	if (input.note) lines.push(`NOTE:${esc(input.note)}`);
	lines.push('END:VCARD');
	return lines.map(fold).join('\r\n') + '\r\n';
}
