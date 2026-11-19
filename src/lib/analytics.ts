export type EventRow = { created_at: string; event_type: string; country: string | null; city: string | null };

export type DayStat = { day: string; views: number; saves: number; clicks: number; leads: number };

export function rollup(rows: EventRow[]) {
	const days = new Map<string, DayStat>();
	const places = new Map<string, number>();
	for (const row of rows) {
		const day = row.created_at.slice(0, 10);
		const stat = days.get(day) ?? { day, views: 0, saves: 0, clicks: 0, leads: 0 };
		if (row.event_type === 'view') stat.views += 1;
		else if (row.event_type === 'save') stat.saves += 1;
		else if (row.event_type === 'lead') stat.leads += 1;
		else if (row.event_type.startsWith('click_')) stat.clicks += 1;
		days.set(day, stat);
		const place = [row.city, row.country].filter(Boolean).join(', ');
		if (place) places.set(place, (places.get(place) ?? 0) + 1);
	}
	return {
		days: [...days.values()].sort((a, b) => a.day.localeCompare(b.day)),
		places: [...places.entries()].map(([place, total]) => ({ place, total })).sort((a, b) => b.total - a.total)
	};
}

export function analyticsCsv(days: DayStat[]) {
	const lines = ['day,views,saves,clicks,leads'];
	for (const day of days) lines.push([day.day, day.views, day.saves, day.clicks, day.leads].join(','));
	return lines.join('\n');
}
