<script>
	import { ads } from "$lib/adsData.js";

	// פרסומות מאושרות של מפרסמים (מ-Strapi) - מוצגות לפני פרסומות השותפים.
	// הקישור שלהן פנימי - לדף הנחיתה /ads/[id] שנבנה ב-builder.
	let { approvedAds = [] } = $props();

	let merged = $derived([
		...approvedAds.map((/** @type {any} */ a) => ({
			id: `sub-${a.id}`,
			title: a.title,
			description: a.subtitle,
			cta: a.cta || a.title,
			hover: a.hover || undefined,
			href: `/ads/${a.id}`,
			target: "_self",
			image: a.mainImage,
			color: a.gradient || "linear-gradient(135deg, #f59e0b, #ea580c)",
		})),
		...ads.map((a) => ({ ...a, target: "_blank" })),
	]);
</script>

<aside class="ads-sidebar" aria-label="פרסומות ושותפים">
	<h4 class="ads-sidebar-title">מתקדמים לחברה מתוקנת ועצמאית</h4>
	<div class="ads-sidebar-list">
		{#each merged as ad (ad.id)}
			<a
				href={ad.href}
				target={ad.target}
				rel={ad.target === "_blank" ? "noopener noreferrer" : undefined}
				aria-label="{ad.title} – {ad.description}{ad.target === '_blank' ? ' (נפתח בחלון חדש)' : ''}"
				class="ad-item"
			>
				<div class="ad-image-wrap">
					<img
						src={ad.image}
						alt={ad.title}
						class="ad-image"
						class:ad-image-short={ad.id === 5 || ad.id === 10}
						class:ad-image-trim={ad.id === 1 || ad.id === 3}
					/>
					<div class="ad-image-overlay">
						<h3>{ad.title}</h3>
						<p>{ad.description}</p>
					</div>
				</div>
				<div class="ad-cta-bar" style="background: {ad.color}">
					<p>{ad.cta}</p>
					{#if ad.hover}
						<span class="ad-tooltip">{ad.hover}</span>
					{/if}
				</div>
			</a>
		{/each}

		<!-- קריאה למפרסמים חדשים - מובילה לדף המחשבון והפרסום -->
		<a href="/advertise" class="advertise-cta">
			<span class="advertise-cta-icon">📢</span>
			<span class="advertise-cta-text">רוצים לפרסם כאן?</span>
			<span class="advertise-cta-sub">לחצו למחירון ולהעלאת פרסומת</span>
		</a>
	</div>
</aside>

<style>
	.ads-sidebar {
		width: 280px;
		flex-shrink: 0;
		position: sticky;
		top: 150px;
		height: fit-content;
		text-align: center;
		padding-bottom: 2rem;
	}

	.ads-sidebar-title {
		font-size: 0.75rem;
		font-weight: 700;
		color: #fbbf24;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		margin: 0 0 0.75rem;
		padding: 0 0.5rem;
	}

	.ads-sidebar-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.ad-item {
		display: block;
		overflow: hidden;
		border-radius: 12px;
		box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
		text-decoration: none;
		transition: transform 0.2s;
	}

	.ad-item:hover {
		transform: scale(1.05);
	}

	.ad-image-wrap {
		position: relative;
		overflow: hidden;
		border: 2px solid #facc15;
		border-radius: 0.5rem;
	}

	.ad-image {
		width: 100%;
		height: auto;
		display: block;
		transition: opacity 1.5s;
	}

	.ad-item:hover .ad-image {
		opacity: 0;
	}

	.ad-image-short {
		height: 200px;
		object-fit: cover;
		object-position: center;
	}

	/* קיצוץ מעט מתחתית התמונה - פרסומת "בתי הפיוס" */
	.ad-image-trim {
		object-fit: cover;
		object-position: top;
		aspect-ratio: 1 / 0.82;
	}

	.ad-image-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		padding: 1rem;
		text-align: center;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		opacity: 0;
		transition: opacity 1.5s;
	}

	.ad-item:hover .ad-image-overlay {
		opacity: 1;
	}

	.ad-image-overlay h3 {
		color: #fff;
		font-weight: 700;
		font-size: 1rem;
		margin: 0;
	}

	.ad-image-overlay p {
		color: #e5e7eb;
		font-size: 0.75rem;
		margin: 0;
	}

	.ad-cta-bar {
		position: relative;
		padding: 0.7rem;
		text-align: center;
	}

	.ad-cta-bar p {
		color: #fff;
		font-weight: 700;
		font-size: 0.75rem;
		line-height: 1.3;
		margin: 0;
	}

	.ad-tooltip {
		position: absolute;
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
		margin-bottom: 0.5rem;
		display: none;
		white-space: nowrap;
		background: #111827;
		color: #fff;
		font-size: 0.75rem;
		font-weight: 700;
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		padding: 0.35rem 0.75rem;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
		pointer-events: none;
		z-index: 50;
	}

	.ad-cta-bar:hover .ad-tooltip {
		display: block;
	}

	/* קריאה למפרסמים חדשים */
	.advertise-cta {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
		border: 2px dashed rgba(251, 191, 36, 0.4);
		border-radius: 12px;
		background: rgba(251, 191, 36, 0.05);
		padding: 0.9rem 0.75rem;
		text-decoration: none;
		transition: all 0.2s;
	}
	.advertise-cta:hover {
		border-color: rgba(251, 191, 36, 0.8);
		background: rgba(251, 191, 36, 0.1);
		transform: scale(1.03);
	}
	.advertise-cta-icon {
		font-size: 1.4rem;
	}
	.advertise-cta-text {
		color: #fbbf24;
		font-weight: 900;
		font-size: 0.9rem;
	}
	.advertise-cta-sub {
		color: #94a3b8;
		font-size: 0.7rem;
		font-weight: 600;
	}

	@media (max-width: 768px) {
		.ads-sidebar {
			display: none;
		}
	}

	/* בטאבלט - מעט צר יותר כדי להשאיר מקום לתוכן */
	@media (max-width: 1100px) and (min-width: 769px) {
		.ads-sidebar {
			width: 212px;
		}
	}
</style>
