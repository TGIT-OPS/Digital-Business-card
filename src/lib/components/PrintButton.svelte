<script lang="ts">
	import { buildCardPdf } from '#lib/print-pdf';

	let {
		slug,
		name,
		title,
		department,
		company,
		phone,
		email,
		website,
		address,
		addressLines,
		blurb,
		tagline,
		services,
		companyEmail,
		posterPath,
		cardUrl,
		primary,
		accent,
		showWhatsapp,
		logoPath,
		logoLightPath
	}: {
		slug: string;
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
		posterPath: string | null;
		cardUrl: string;
		primary: string;
		accent: string;
		showWhatsapp: boolean;
		logoPath: string | null;
		logoLightPath: string | null;
	} = $props();

	let busy = $state(false);
	let message = $state('');

	async function bytes(url: string) {
		const response = await fetch(url);
		if (!response.ok) throw new Error('missing');
		return new Uint8Array(await response.arrayBuffer());
	}

	async function optionalBytes(path: string | null) {
		if (!path) return null;
		const response = await fetch(`/media/${path}`);
		if (!response.ok) return null;
		return new Uint8Array(await response.arrayBuffer());
	}

	async function download() {
		busy = true;
		message = '';
		try {
			const [regular, bold, italic, semibold, phoneIcon, mail, globe, pin, logo, logoLight, poster] = await Promise.all([
				bytes('/fonts/selawk.ttf'),
				bytes('/fonts/selawkb.ttf'),
				bytes('/fonts/selawk.ttf'),
				bytes('/fonts/selawksb.ttf'),
				bytes('/print/phone.png'),
				bytes('/print/mail.png'),
				bytes('/print/globe.png'),
				bytes('/print/pin.png'),
				optionalBytes(logoPath),
				optionalBytes(logoLightPath),
				optionalBytes(posterPath)
			]);
			const pdf = await buildCardPdf({
				name, title, department, company, phone, email, website, address, addressLines, blurb, tagline, services, companyEmail, cardUrl,
				primary, accent, showWhatsapp, logo, logoLight, poster,
				fonts: { regular, bold, italic, semibold },
				icons: { phone: phoneIcon, mail, globe, pin }
			});
			const blob = new Blob([pdf.buffer as ArrayBuffer], { type: 'application/pdf' });
			const link = document.createElement('a');
			link.href = URL.createObjectURL(blob);
			link.download = `${slug}-card.pdf`;
			link.click();
			URL.revokeObjectURL(link.href);
		} catch {
			message = 'Could not build the PDF.';
		} finally {
			busy = false;
		}
	}
</script>

<button class="btn btn-outline" type="button" onclick={download} disabled={busy}>
	{busy ? 'Preparing PDF…' : 'Print card PDF'}
</button>
{#if message}<span class="hint">{message}</span>{/if}
