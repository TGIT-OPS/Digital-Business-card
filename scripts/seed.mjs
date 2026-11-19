import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

loadEnv(path.resolve('.env'));

const url = process.env.PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
const password = process.env.SUPER_ADMIN_PASSWORD || '';
if (!url || !key) {
	console.error('Set PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
	process.exit(1);
}

const COMPANY_ID = 'a0a0a0a0-0000-4000-8000-0000000000a1';
const CARD_ID = 'a0a0a0a0-0000-4000-8000-0000000000b1';
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const { error: bucketError } = await supabase.storage.createBucket('media', { public: true });
if (bucketError && !/already exists/i.test(bucketError.message)) {
	console.warn('Bucket:', bucketError.message);
}

if (email && password) {
	let userId = null;
	const created = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
	if (created.data?.user) userId = created.data.user.id;
	else {
		const listed = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
		userId = listed.data?.users?.find((user) => (user.email || '').toLowerCase() === email)?.id ?? null;
		if (!userId) {
			console.error(created.error?.message || 'Could not create the super admin.');
			process.exit(1);
		}
		console.log('Super admin already exists. Password was left unchanged.');
	}
	const { error } = await supabase.from('profiles').upsert({ id: userId, email, role: 'super_admin' });
	if (error) {
		console.error(error.message);
		process.exit(1);
	}
	console.log('Super admin:', email);
} else {
	console.log('Skipped login creation. Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD to create it.');
}

const company = {
	id: COMPANY_ID,
	name: 'TGIT Pte Ltd',
	slug: 'tgit',
	phone: '+65 80151060',
	email: 'support@tgitsolutions.com',
	website: 'https://tgitsolutions.com',
	whatsapp: 'https://wa.me/6580151060',
	address_line: '#08-01, 101 Eunos Avenue 3',
	city: 'Singapore',
	postal_code: '409538',
	country: 'Singapore',
	about: 'Trusted provider of enterprise IT solutions since 2016, delivering cutting-edge hardware, software, and managed services across South Asia.',
	mission: 'At TGIT Pte Ltd, our mission is to deliver innovative IT solutions that empower businesses. We strive to enhance operational efficiency and drive growth through technology.',
	tagline: 'Transforming IT into reality',
	layout_template: 'classic',
	active: true,
	color_primary: '#FF0000',
	color_accent: '#FFCF37',
	color_pale: '#FFFFA1',
	color_ink: '#000000',
	color_paper: '#FFFFFF',
	color_muted: '#E6E6E6'
};

const SERVICES = [
	'Managed IT and support',
	'ERP solutions',
	'Infrastructure and cloud',
	'Microsoft 365 and Teams',
	'CCTV and door access',
	'Products and licences'
];

const { data: existing } = await supabase.from('companies').select('id, logo_path, logo_light_path').eq('slug', 'tgit').maybeSingle();
let companyId = existing?.id ?? COMPANY_ID;
if (!existing) {
	const { error } = await supabase.from('companies').insert(company);
	if (error) {
		console.error(error.message);
		process.exit(1);
	}
	console.log('Created TGIT Pte Ltd');
} else {
	companyId = existing.id;
	const { error: updateError } = await supabase.from('companies').update({
		phone: company.phone,
		email: company.email,
		website: company.website,
		whatsapp: company.whatsapp,
		address_line: company.address_line,
		city: company.city,
		postal_code: company.postal_code,
		country: company.country,
		tagline: company.tagline,
		about: company.about,
		mission: company.mission
	}).eq('id', companyId);
	if (updateError) console.error(updateError.message);
	else console.log('Updated TGIT Pte Ltd details.');
}

const logoPath = `logos/${companyId}/logo.png`;
const lightPath = `logos/${companyId}/logo-light.png`;
const headerPath = `videos/companies/${companyId}/header.mp4`;
const posterPath = `videos/companies/${companyId}/header-poster.jpg`;
if (!existing?.logo_path) {
	await upload(logoPath, 'static/brand/tgit-logo.png', 'image/png');
	await upload(lightPath, 'static/brand/tgit-logo-white.png', 'image/png');
	await supabase.from('companies').update({ logo_path: logoPath, logo_light_path: lightPath }).eq('id', companyId);
	console.log('Uploaded the TGIT logo');
}
await upload(headerPath, 'static/brand/tgit-hand-loop.mp4', 'video/mp4');
await upload(posterPath, 'static/brand/tgit-hand-poster.jpg', 'image/jpeg');
await supabase.from('companies').update({
	theme_mode: 'video',
	theme_path: headerPath,
	theme_poster_path: posterPath
}).eq('id', companyId);
console.log('Uploaded the TGIT header video');

await supabase.from('products').delete().eq('company_id', companyId);
const { error: productError } = await supabase.from('products').insert(
	SERVICES.map((title, sort_order) => ({
		company_id: companyId,
		title,
		description: '',
		is_example: false,
		sort_order
	}))
);
if (productError) console.error(productError.message);
else console.log('Set TGIT services');

const cardFields = {
	company_id: companyId,
	slug: 'manoharan',
	name: 'Manoharan Pethappan',
	title: 'IT Manager',
	department: 'Information Technology',
	phone: '+65 8015 1060',
	qr_template: 'logo',
	slug_locked: true,
	whatsapp: 'https://wa.me/6580151060',
	email: 'manoharan@tgitsolutions.com',
	website: 'https://tgitsolutions.com',
	active: true
};
const { data: card } = await supabase.from('cards').select('id').eq('slug', 'manoharan').maybeSingle();
if (!card) {
	const { error } = await supabase.from('cards').insert({ id: CARD_ID, ...cardFields });
	if (error) console.error(error.message);
	else console.log('Created Manoharan Pethappan’s card at /c/manoharan');
} else {
	const { error } = await supabase.from('cards').update(cardFields).eq('id', card.id);
	if (error) console.error(error.message);
	else console.log('Updated Manoharan Pethappan’s card.');
}

const { data: template } = await supabase
	.from('card_templates')
	.select('id')
	.eq('company_id', companyId)
	.eq('name', 'TGIT Classic v8')
	.maybeSingle();
let templateId = template?.id;
if (!templateId) {
	const created = await supabase
		.from('card_templates')
		.insert({
			company_id: companyId,
			name: 'TGIT Classic v8',
			layout: 'classic',
			locked_fields: ['layout', 'palette'],
			defaults: { qr_template: 'logo', tagline: 'Transforming IT into reality', department: 'Information Technology' },
			is_default: true
		})
		.select('id')
		.single();
	if (created.error) console.error(created.error.message);
	templateId = created.data?.id;
}
if (templateId) {
	await supabase.from('card_templates').update({ is_default: false }).eq('company_id', companyId).neq('id', templateId);
	await supabase.from('card_templates').update({ is_default: true }).eq('id', templateId);
	await supabase.from('cards').update({ template_id: templateId }).eq('slug', 'manoharan');
	console.log('TGIT Classic v8 is the default template.');
}

console.log('Seed finished.');

async function upload(objectPath, filePath, contentType) {
	const bytes = fs.readFileSync(path.resolve(filePath));
	const { error } = await supabase.storage.from('media').upload(objectPath, bytes, {
		upsert: true,
		contentType,
		cacheControl: '3600'
	});
	if (error) throw new Error(error.message);
}

function loadEnv(file) {
	if (!fs.existsSync(file)) return;
	for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
		const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
		if (!match || process.env[match[1]]) continue;
		process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
	}
}
