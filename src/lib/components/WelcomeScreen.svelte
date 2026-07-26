<script>
	/**
	 * מסך פתיחה מלא אחרי התחברות — גלובלי (מוצג ב-+layout), כדי שיופיע
	 * בכל יעד נחיתה. מקור-אמת: פרמטר `welcome` ב-URL שנשתל בזרימות ההתחברות:
	 *   welcome=1 | welcome=new  → "ברוכים המצטרפים"
	 *   welcome=back             → "ברוכים השבים"
	 * בשני המצבים מוצגת רשת הלוגואים של כל אתרי הרשת (networkSites —
	 * הרשימה הקנונית המלאה, כולל האתר הנוכחי עצמו).
	 *
	 * עצמאי בכוונה: קורא את ה-URL דרך window.location ב-onMount (לא $app/stores).
	 *
	 * הערת התאמה מקומית: ב-purchasing_groups אין Tailwind (העיצוב ב-CSS ידני עם
	 * משתני CSS), אין preprocess ל-TS, ו-community-callback הוא endpoint צד-שרת שאינו
	 * יכול לקרוא localStorage. לכן: הרכיב כתוב ב-JS רגיל עם CSS ממודר, שדה color מוחל
	 * כ-inline background, והבחנת "מצטרף חדש / שב" עבור welcome=new מבוצעת כאן
	 * (gofreeil-welcomed) — המקום היחיד בצד-הלקוח בזרימה: דפדפן שכבר בורך פעם
	 * מקבל "ברוכים השבים" במקום "ברוכים המצטרפים".
	 */
	import { onMount } from 'svelte';
	import { networkSites } from '$lib/networkSites';

	let { userName = '' } = $props();

	const WELCOME_MS = 7000;
	// לוגו האתר — המשתנה היחיד שמשתנה בין אתרי הרשת
	const LOGO_SRC = '/assets/קבוצות-רכישה.png';

	/** @type {'new' | 'back' | null} */
	let kind = $state(null);
	let visible = $state(false);
	let fill = $state(false);
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let timer;

	function stripParam() {
		try {
			const url = new URL(window.location.href);
			url.searchParams.delete('welcome');
			history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`);
		} catch {
			/* ignore */
		}
	}

	function dismiss() {
		if (timer) clearTimeout(timer);
		visible = false;
		stripParam();
	}

	onMount(() => {
		const p = new URLSearchParams(window.location.search).get('welcome');
		/** @type {'new' | 'back' | null} */
		let k = p === '1' || p === 'new' ? 'new' : p === 'back' ? 'back' : null;
		if (!k) return;
		// ברכת "מצטרפים" מוצגת רק בביקור הראשון בדפדפן זה; דפדפן שכבר בורך מקבל
		// במקומה "ברוכים השבים" (המקבילה צד-הלקוח להבחנת new/back שנעשית באתרים
		// אחרים ברשת בתוך ה-callback עצמו). "back" מפורש מוצג תמיד כפי שהוא.
		try {
			if (k === 'new' && localStorage.getItem('gofreeil-welcomed')) k = 'back';
		} catch {
			/* localStorage חסום — ממשיכים ומציגים כ"מצטרפים" */
		}
		kind = k;
		visible = true;
		try {
			localStorage.setItem('gofreeil-welcomed', '1');
		} catch {
			/* ignore */
		}
		requestAnimationFrame(() => (fill = true));
		timer = setTimeout(dismiss, WELCOME_MS);
		return () => {
			if (timer) clearTimeout(timer);
		};
	});
</script>

{#if visible && kind}
	<div class="welcome-overlay {kind}" role="dialog" aria-modal="true" dir="rtl">
		<button type="button" class="welcome-close" onclick={dismiss} aria-label="סגירה">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true" focusable="false">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>

		<div class="welcome-inner">
			<div class="welcome-content">
				{#if kind === 'new'}
					<img src={LOGO_SRC} alt="לוגו האתר" class="welcome-logo" />
					<h2 class="welcome-title">
						<span class="welcome-emoji" aria-hidden="true">🎉</span>
						<span>ברוכים המצטרפים</span>
					</h2>
					<p class="welcome-text">
						נרשמת בהצלחה — ומעכשיו אתה מוכר בכל אתרי רשת יוצאים לחירות, ללא צורך בהזדהות נוספת.
					</p>
					<p class="welcome-tagline">יוצאים לחירות מוכיחים שעולם חדש הוא אפשרי</p>
				{:else}
					<div class="welcome-wave">👋</div>
					<h2 class="welcome-title welcome-title-back">
						ברוכים השבים{userName.trim() ? `, ${userName.trim()}` : ''}!
					</h2>
					<p class="welcome-text">טוב לראות אותך שוב ברשת יוצאים לחירות.</p>
				{/if}
				<!-- לוגואים של כל האתרים ברשת (הרשימה הקנונית המלאה, כולל האתר
				     הנוכחי) — מוצגים בשני המצבים (מצטרפים + שבים). flex-wrap עם
				     מרכוז כדי שהשורה האחרונה (חלקית) תתמרכז ולא תישאר צמודה לצד -->
				<div class="welcome-grid" aria-label="אתרי רשת יוצאים לחירות">
					{#each networkSites as site (site.id)}
						<a
							class="welcome-tile"
							href={site.href}
							target="_blank"
							rel="noopener noreferrer"
							title={site.title}
						>
							<div class="welcome-tile-img" style="background: {site.color}">
								<img src={site.image} alt={site.title} loading="lazy" />
							</div>
							<span class="welcome-tile-title">{site.title}</span>
						</a>
					{/each}
				</div>
			</div>
		</div>

		<!-- פס זמן — מתמלא עד סוף המסך (7 שניות) ואז המסך נסגר -->
		<div class="welcome-progress">
			<div class="welcome-progress-bar" style="width: {fill ? '100%' : '0%'}; transition: width {WELCOME_MS}ms linear;"></div>
		</div>
	</div>
{/if}

<style>
	.welcome-overlay {
		position: fixed;
		inset: 0;
		z-index: 1300;
		overflow-y: auto;
	}
	.welcome-overlay.new {
		background: linear-gradient(to bottom right, #172554, #070b14, #3b0764);
	}
	.welcome-overlay.back {
		background: linear-gradient(to bottom right, #022c22, #070b14, #172554);
	}

	.welcome-close {
		position: fixed;
		top: 1rem;
		left: 1rem;
		z-index: 1310;
		display: flex;
		width: 2.5rem;
		height: 2.5rem;
		align-items: center;
		justify-content: center;
		border: none;
		border-radius: 9999px;
		background: rgba(255, 255, 255, 0.1);
		color: #e5e7eb;
		cursor: pointer;
		transition: background-color 0.2s, color 0.2s;
	}
	.welcome-close:hover {
		background: rgba(255, 255, 255, 0.2);
		color: #fff;
	}
	.welcome-close svg {
		width: 1.25rem;
		height: 1.25rem;
	}

	.welcome-inner {
		min-height: 100%;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding: 3.5rem 1rem;
	}
	.welcome-content {
		width: 100%;
		max-width: 28rem;
		text-align: center;
	}

	.welcome-logo {
		margin: 0 auto 1rem;
		display: block;
		width: 5rem;
		height: 5rem;
		border-radius: 9999px;
		object-fit: cover;
		background: #fff;
		box-shadow: 0 0 0 2px rgba(192, 132, 252, 0.4), 0 10px 15px -3px rgba(0, 0, 0, 0.3);
	}

	.welcome-title {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		color: #fff;
		font-weight: 900;
		font-size: 1.5rem;
		line-height: 2rem;
		margin: 0 0 0.75rem;
	}
	.welcome-title-back {
		display: block;
	}
	.welcome-emoji {
		font-size: 1.25rem;
	}

	.welcome-wave {
		font-size: 3.75rem;
		line-height: 1;
		margin-bottom: 1rem;
	}

	.welcome-text {
		color: #e5e7eb;
		font-size: 1rem;
		line-height: 1.625;
		max-width: 36rem;
		margin: 0 auto 1.25rem;
	}

	.welcome-tagline {
		color: #e9d5ff;
		font-size: 0.875rem;
		font-weight: 700;
		letter-spacing: 0.025em;
		margin: 0 0 1rem;
	}

	.welcome-grid {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.625rem;
	}

	.welcome-tile {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.375rem;
		border-radius: 0.75rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		padding: 0.5rem;
		transition: background 0.2s, border-color 0.2s, transform 0.2s;
		flex-grow: 0;
		flex-basis: calc(33.333% - 0.47rem);
	}
	.welcome-tile:hover {
		background: rgba(255, 255, 255, 0.1);
		transform: translateY(-2px);
	}
	/* צבע מסגרת ה-hover לפי מצב הברכה — סגול למצטרפים, אמרלד לשבים */
	.new .welcome-tile:hover {
		border-color: rgba(192, 132, 252, 0.4);
	}
	.back .welcome-tile:hover {
		border-color: rgba(52, 211, 153, 0.4);
	}

	.welcome-tile-title {
		font-size: 11px;
		line-height: 1.2;
		font-weight: 600;
		color: #e5e7eb;
		text-align: center;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.welcome-tile-img {
		width: 100%;
		aspect-ratio: 4 / 3;
		overflow: hidden;
		border-radius: 0.5rem;
	}
	.welcome-tile-img img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s;
	}
	.welcome-tile:hover .welcome-tile-img img {
		transform: scale(1.05);
	}

	.welcome-progress {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: 0.375rem;
		background: rgba(255, 255, 255, 0.1);
		z-index: 1310;
	}
	.welcome-progress-bar {
		height: 100%;
	}
	.new .welcome-progress-bar {
		background: #c084fc;
	}
	.back .welcome-progress-bar {
		background: #34d399;
	}

	@media (min-width: 640px) {
		.welcome-tile {
			flex-basis: calc(25% - 0.52rem);
		}
	}
	@media (min-width: 768px) {
		.welcome-inner {
			align-items: center;
		}
		.welcome-tile {
			flex-basis: calc(20% - 0.55rem);
		}
		.welcome-tagline {
			font-size: 1rem;
		}
	}
</style>
