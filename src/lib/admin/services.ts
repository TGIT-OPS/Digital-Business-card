/**
 * Service tiles for the admin Services page and the login strip.
 * Read-only for now: titles come from each company's products in the database,
 * and images are matched here by keyword. Nothing is written to the database.
 */
export type ServiceImage = { key: string; title: string; image: string; match: RegExp };

export const SERVICE_IMAGES: ServiceImage[] = [
	{ key: 'managed-it', title: 'Managed IT & Support', image: '/services/managed-it.webp', match: /managed|support|helpdesk/i },
	{ key: 'erp', title: 'ERP Solutions', image: '/services/erp.webp', match: /erp|business software/i },
	{ key: 'infra-cloud', title: 'Infrastructure & Cloud', image: '/services/infra-cloud.webp', match: /infra|cloud|server|network/i },
	{ key: 'm365-teams', title: 'Microsoft 365 & Teams', image: '/services/m365-teams.webp', match: /microsoft|365|teams|office/i },
	{ key: 'cctv-access', title: 'CCTV & Door Access', image: '/services/cctv-access.webp', match: /cctv|door|access|security|camera/i },
	{ key: 'products-licences', title: 'Products & Licences', image: '/services/products-licences.webp', match: /product|licen[cs]e|hardware/i }
];

export function imageFor(title: string, index = 0) {
	const hit = SERVICE_IMAGES.find((item) => item.match.test(title));
	return (hit ?? SERVICE_IMAGES[index % SERVICE_IMAGES.length]).image;
}
