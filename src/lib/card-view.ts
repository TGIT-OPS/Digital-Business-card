import {
	cardPublicUrl,
	displayUrl,
	formatAddress,
	mapsHref,
	normalizeSocials,
	safeHttpUrl,
	storagePublicUrl,
	telHref,
	whatsappHref,
	type SocialLink
} from './format';
import { parseVideoUrl, vimeoEmbed, youtubeEmbed, youtubePoster } from './video';

export type Colors = {
	primary: string;
	accent: string;
	pale: string;
	ink: string;
	paper: string;
	muted: string;
};

export type LayoutTemplate = 'classic' | 'bold' | 'minimal';
export type VideoMode = 'none' | 'file' | 'youtube' | 'vimeo';

export type CompanySource = {
	name: string;
	logo_path?: string | null;
	logo_light_path?: string | null;
	color_primary: string;
	color_accent: string;
	color_pale: string;
	color_ink: string;
	color_paper: string;
	color_muted: string;
	layout_template: string;
	phone?: string | null;
	email?: string | null;
	website?: string | null;
	whatsapp?: string | null;
	address_line?: string | null;
	city?: string | null;
	postal_code?: string | null;
	country?: string | null;
	about?: string | null;
	mission?: string | null;
	social_links?: unknown;
	video_mode?: string | null;
	video_path?: string | null;
	video_url?: string | null;
	video_poster_path?: string | null;
	video_autoplay?: boolean | null;
	theme_mode?: string | null;
	theme_path?: string | null;
	theme_poster_path?: string | null;
	tagline?: string | null;
};

export type CardSource = {
	slug: string;
	name: string;
	title?: string | null;
	department?: string | null;
	phone?: string | null;
	whatsapp?: string | null;
	email?: string | null;
	website?: string | null;
	photo_path?: string | null;
	use_company_colors?: boolean | null;
	color_primary?: string | null;
	color_accent?: string | null;
	color_pale?: string | null;
	color_ink?: string | null;
	color_paper?: string | null;
	color_muted?: string | null;
	video_mode?: string | null;
	video_path?: string | null;
	video_url?: string | null;
	video_poster_path?: string | null;
	video_autoplay?: boolean | null;
	header_mode?: string | null;
	header_path?: string | null;
	header_poster_path?: string | null;
};

export type ProductSource = {
	title: string;
	description?: string | null;
	is_example?: boolean | null;
};

export type VideoView = {
	kind: 'file' | 'youtube' | 'vimeo';
	src: string;
	poster: string | null;
	autoplay: boolean;
};

export type ThemeView = {
	kind: 'video' | 'gif';
	src: string;
	poster: string | null;
};

export type CardView = {
	name: string;
	title: string;
	department: string;
	companyName: string;
	phone: string;
	email: string;
	websiteLabel: string;
	websiteUrl: string | null;
	whatsappUrl: string | null;
	telUrl: string | null;
	mailUrl: string | null;
	photoUrl: string | null;
	logoUrl: string | null;
	logoLightUrl: string | null;
	about: string;
	mission: string;
	products: { title: string; description: string; is_example: boolean }[];
	address: string;
	addressLines: string[];
	mapsUrl: string | null;
	cardUrl: string;
	qrUrl: string | null;
	template: LayoutTemplate;
	colors: Colors;
	socials: SocialLink[];
	footer: string;
	video: VideoView | null;
	theme: ThemeView | null;
	tagline: string;
	companyEmail: string;
	slug: string;
};

const TEMPLATES = new Set(['classic', 'bold', 'minimal']);

export function companyColors(company: CompanySource): Colors {
	return {
		primary: company.color_primary,
		accent: company.color_accent,
		pale: company.color_pale,
		ink: company.color_ink,
		paper: company.color_paper,
		muted: company.color_muted
	};
}

export function resolveColors(
	company: CompanySource,
	card?: Pick<
		CardSource,
		| 'use_company_colors'
		| 'color_primary'
		| 'color_accent'
		| 'color_pale'
		| 'color_ink'
		| 'color_paper'
		| 'color_muted'
	> | null
): Colors {
	const base = companyColors(company);
	if (!card || card.use_company_colors !== false) return base;
	return {
		primary: card.color_primary || base.primary,
		accent: card.color_accent || base.accent,
		pale: card.color_pale || base.pale,
		ink: card.color_ink || base.ink,
		paper: card.color_paper || base.paper,
		muted: card.color_muted || base.muted
	};
}

function videoFrom(
	mode: string | null | undefined,
	path: string | null | undefined,
	url: string | null | undefined,
	posterPath: string | null | undefined,
	autoplay: boolean | null | undefined,
	supabaseUrl: string
): VideoView | null {
	if (mode === 'file' && path) {
		const src = storagePublicUrl(supabaseUrl, path);
		if (!src) return null;
		return {
			kind: 'file',
			src,
			poster: storagePublicUrl(supabaseUrl, posterPath),
			autoplay: Boolean(autoplay)
		};
	}
	if (mode === 'youtube' || mode === 'vimeo') {
		const parsed = parseVideoUrl(url);
		if (!parsed) return null;
		const poster = storagePublicUrl(supabaseUrl, posterPath) || (parsed.mode === 'youtube' ? youtubePoster(parsed.id) : null);
		return {
			kind: parsed.mode,
			src: parsed.mode === 'youtube' ? youtubeEmbed(parsed.id, Boolean(autoplay)) : vimeoEmbed(parsed.id, Boolean(autoplay)),
			poster,
			autoplay: Boolean(autoplay)
		};
	}
	return null;
}

export function buildCardView(options: {
	company: CompanySource;
	card: CardSource;
	products: ProductSource[];
	baseUrl: string;
	supabaseUrl: string;
	colors?: Colors;
	video?: VideoView | null;
	theme?: ThemeView | null;
}): CardView {
	const { company, card, products, baseUrl, supabaseUrl } = options;
	const phone = card.phone || company.phone || '';
	const email = card.email || company.email || '';
	const website = safeHttpUrl(card.website || company.website);
	const address = formatAddress(company);
	const addressLines = [company.address_line, [company.city, company.postal_code].filter(Boolean).join(' ')].filter(
		(line): line is string => Boolean(line)
	);
	if (company.country && company.country !== company.city) addressLines.push(company.country);
	const template = TEMPLATES.has(company.layout_template)
		? (company.layout_template as LayoutTemplate)
		: 'classic';
	const cardVideo = videoFrom(
		card.video_mode,
		card.video_path,
		card.video_url,
		card.video_poster_path,
		card.video_autoplay,
		supabaseUrl
	);
	const companyVideo = videoFrom(
		company.video_mode,
		company.video_path,
		company.video_url,
		company.video_poster_path,
		company.video_autoplay,
		supabaseUrl
	);
	let theme: ThemeView | null = null;
	if (card.header_mode === 'video' && card.header_path) {
		const src = storagePublicUrl(supabaseUrl, card.header_path);
		if (src) {
			theme = {
				kind: 'video',
				src,
				poster: storagePublicUrl(supabaseUrl, card.header_poster_path)
			};
		}
	} else if ((company.theme_mode === 'video' || company.theme_mode === 'gif') && company.theme_path) {
		const src = storagePublicUrl(supabaseUrl, company.theme_path);
		if (src) {
			theme = {
				kind: company.theme_mode,
				src,
				poster: storagePublicUrl(supabaseUrl, company.theme_poster_path)
			};
		}
	}
	const site = displayUrl(website);
	return {
		name: card.name,
		title: card.title || '',
		department: card.department || '',
		companyName: company.name,
		phone,
		email,
		websiteLabel: site,
		websiteUrl: website,
		whatsappUrl: whatsappHref(card.whatsapp || company.whatsapp, phone),
		telUrl: telHref(phone),
		mailUrl: email ? `mailto:${email}` : null,
		photoUrl: storagePublicUrl(supabaseUrl, card.photo_path),
		logoUrl: storagePublicUrl(supabaseUrl, company.logo_path),
		logoLightUrl: storagePublicUrl(supabaseUrl, company.logo_light_path),
		about: company.about || '',
		mission: company.mission || '',
		products: products
			.filter((item) => item.title.trim())
			.map((item) => ({
				title: item.title,
				description: item.description || '',
				is_example: Boolean(item.is_example)
			})),
		address,
		addressLines,
		mapsUrl: mapsHref(address),
		cardUrl: cardPublicUrl(baseUrl, card.slug),
		qrUrl: card.slug ? `/c/${card.slug}/qr.svg` : null,
		template,
		colors: options.colors ?? resolveColors(company, card),
		socials: normalizeSocials(company.social_links),
		footer: [company.name, site].filter(Boolean).join(' · '),
		video: options.video === undefined ? cardVideo || companyVideo : options.video,
		theme: options.theme === undefined ? theme : options.theme,
		tagline: company.tagline || '',
		companyEmail: company.email || '',
		slug: card.slug
	};
}
