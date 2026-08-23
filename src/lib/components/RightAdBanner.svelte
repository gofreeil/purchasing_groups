<script>
	import { onMount } from "svelte";
	import { adImgFit, parseAdImageFit } from "$lib/adImageFit.js";
	import { AD_SLOT_COUNT, AD_SLOT_COLORS } from "$lib/adSlots.js";

	// פרסומות מאושרות של מפרסמים. הטור הימני הוא המקום היחיד שלהן -
	// הטור השמאלי שמור לאתרי רשת "יוצאים לחירות" בלבד.
	// הקישור פנימי, לדף הנחיתה /ads/[id] שנבנה ב-builder.
	let { approvedAds = [] } = $props();

	let paidAds = $derived(
		(approvedAds ?? []).filter((/** @type {any} */ a) => a.mainImage),
	);

	let currentGroup = $state(0);

	// צבעי 16 המקומות מגיעים מ-$lib/adSlots.js: ארבע משפחות צבע שחוזרות
	// כל ארבעה מקומות, כך שכל קבוצה שמוצגת (PER_GROUP) נראית באותן ארבע
	// משפחות. אותו מקור משמש גם את בורר המקום במסך הניהול.

	const VIEW_MS = 7000;    // כמה זמן כל קבוצה נשארת על המסך — חצי מהקצב הישן (14 ש׳)
	const PER_GROUP = 4;     // כמה מקומות (פרסומות ופנויים) נראים בו-זמנית

	/** @typedef {{ num: number, ad?: any, tpl?: (typeof AD_SLOT_COLORS)[number] }} BoardCell */

	// לוח 16 המקומות בסדר מספרי: מקום שנתפס מציג את הפרסומת, מקום פנוי
	// מציג משבצת "יכול להיות שלך". פרסומת מאושרת *תופסת* מקום - סך
	// הכרטיסים הוא תמיד 16 בדיוק. המספר מגיע מהשרת (נקבע במסך הניהול);
	// מודעה ותיקה בלי מספר ממלאת את המספר הפנוי הנמוך ביותר.
	let board = $derived.by(() => {
		/** @type {Set<number>} */
		const taken = new Set();
		for (const a of paidAds) {
			if (typeof a.slot === "number" && a.slot >= 1) taken.add(a.slot);
		}
		let nextFree = 1;
		/** @type {Map<number, any>} */
		const byNum = new Map();
		/** @type {BoardCell[]} */
		const overflow = [];
		for (const a of paidAds) {
			let num = typeof a.slot === "number" && a.slot >= 1 ? a.slot : 0;
			// בלי מספר, או בהתנגשות נדירה - המספר הפנוי הנמוך ביותר
			if (num === 0 || byNum.has(num)) {
				while (taken.has(nextFree)) nextFree++;
				num = nextFree;
				taken.add(num);
			}
			if (num <= AD_SLOT_COUNT) byNum.set(num, a);
			else overflow.push({ num, ad: a });
		}
		/** @type {BoardCell[]} */
		const cells = [];
		for (let n = 1; n <= AD_SLOT_COUNT; n++) {
			const ad = byNum.get(n);
			// תבניות הצבע קבועות למספר: משבצת 7 שומרת על הצבעים שלה
			// גם כשמקומות לפניה נתפסים
			cells.push(ad ? { num: n, ad } : { num: n, tpl: AD_SLOT_COLORS[(n - 1) % AD_SLOT_COLORS.length] });
		}
		// מעבר ל-16 (גלישה) - בסוף הלוח, כדי שפרסומת לא תיעלם
		return [...cells, ...overflow];
	});
	let groupCount = $derived(Math.max(1, Math.ceil(board.length / PER_GROUP)));

	onMount(() => {
		// ההחלפה עצמה היא מיזוג שקיפות (crossfade) שקורה כולו ב-CSS —
		// כאן רק מקדמים את מספר הקבוצה, בלי מכונת מצבים של דעיכה.
		// הסבב רץ כל עוד הדף פתוח: גם הפרסומות המשולמות מתחלפות בו, ולכן
		// עצירה הייתה מקבעת קבוצה אחת ומסתירה לצמיתות את הפרסומות שבאחרות.
		const interval = setInterval(() => {
			if (groupCount <= 1) return;
			currentGroup = (currentGroup + 1) % groupCount;
		}, VIEW_MS);
		return () => clearInterval(interval);
	});

	// שינוי במספר הקבוצות תוך כדי סבב (למשל אישור פרסומת) לא משאיר את
	// הטור ריק עד לסיבוב הבא
	let safeGroup = $derived(currentGroup % groupCount);

	// הלוח בקבוצות של 4 לפי הסדר המספרי (1-4, 5-8, 9-12, 13-16). כל
	// הקבוצות מרונדרות זו על גבי זו ורק הפעילה נראית, כך שההחלפה היא
	// מיזוג עדין בין שתי שכבות ולא החלפת תוכן מול העין.
	let groups = $derived(
		Array.from({ length: groupCount }, (_, g) =>
			board.slice(g * PER_GROUP, (g + 1) * PER_GROUP),
		),
	);
</script>

<aside class="right-ad-banner" aria-label="פרסומות">
	<h4 class="right-ad-title">תוכן שיווקי</h4>

	<!-- לוח 16 המקומות בסדר מספרי, בקבוצות של 4 (1-4, 5-8, 9-12, 13-16).
	     כל הכרטיסים מתחלפים בסבב כרגיל - פרסומות ומשבצות פנויות יחד:
	     פרסומת שנקבעה למקום 5 מופיעה עם קבוצת 5-8, בין 6 ל-8, וסך
	     המקומות הוא 16 בדיוק. כל הקבוצות שוכבות זו על זו באותו תא grid;
	     ההחלפה היא מיזוג שקיפות איטי בין השכבות - בלי רגע ריק. -->
	<div class="right-ad-stage">
		{#each groups as grp, gi}
		<div class="right-ad-list" class:active={gi === safeGroup}>
		{#each grp as cell (cell.num)}
			{#if cell.ad}
				{@const ad = cell.ad}
				<a class="paid-ad" href="/ads/{ad.id}" aria-label="{ad.title} – {ad.subtitle}">
					<div class="paid-ad-media">
						<img
							src={ad.mainImage}
							alt={ad.title}
							loading="lazy"
							decoding="async"
							use:adImgFit={parseAdImageFit(ad.mainImageFit)}
						/>
						<div class="paid-ad-hover">
							<strong>{ad.title}</strong>
							<span>{ad.subtitle}</span>
						</div>
					</div>
					<div class="paid-ad-cta" style="background: {ad.gradient || 'linear-gradient(135deg,#f59e0b,#ea580c)'}">
						{ad.cta || ad.title}
					</div>
				</a>
			{:else if cell.tpl}
				{@const slot = cell.tpl}
				<a
					href="/advertise"
					class="right-ad-card"
					style="border-color: {slot.border}; background: {slot.bg};"
					aria-label="מקום פרסום פנוי - לפרטים על פרסום באתר"
				>
					<!-- מספר המקום הפנוי - בדיוק המספרים שלא נתפסו ע"י פרסומות -->
					<div class="right-ad-num">{cell.num}</div>
					<div class="right-ad-emoji">📢</div>
					<div class="right-ad-vtext">
						<span class="right-ad-vmain" style="color: {slot.text}">
							מקום פרסום זה
						</span>
						<span class="right-ad-vsub" style="color: {slot.text}">
							- יכול להיות שלך
						</span>
					</div>
					<span
						class="right-ad-btn"
						style="background: {slot.btn}"
					>
						לפרטים
					</span>
				</a>
			{/if}
		{/each}
		</div>
		{/each}
	</div>
</aside>

<style>
	/* פרסומת משלמת: אותו יחס שהבילדר מציג בתצוגה החיה (144/450), כדי
	   שהחיתוך והזום שהמפרסם כיוון שם לא יישברו כאן. */
	.paid-ad {
		display: block;
		overflow: hidden;
		border-radius: 0.5rem;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.35);
		transition: transform 0.2s ease;
	}
	.paid-ad:hover {
		transform: scale(1.05);
	}
	.paid-ad-media {
		position: relative;
		width: 100%;
		aspect-ratio: 144 / 450;
		overflow: hidden;
	}
	.paid-ad-media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: opacity 1.5s;
	}
	.paid-ad:hover .paid-ad-media img {
		opacity: 0;
	}
	.paid-ad-hover {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		padding: 0 0.75rem;
		text-align: center;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		opacity: 0;
		transition: opacity 1.5s;
	}
	.paid-ad:hover .paid-ad-hover {
		opacity: 1;
	}
	.paid-ad-hover strong {
		color: #fff;
		font-size: 0.875rem;
		font-weight: 700;
	}
	.paid-ad-hover span {
		color: #e5e7eb;
		font-size: 0.75rem;
	}
	.paid-ad-cta {
		padding: 0.625rem 0.5rem;
		text-align: center;
		color: #fff;
		font-size: 0.75rem;
		font-weight: 700;
		line-height: 1.2;
	}

	.right-ad-banner {
		width: 144px;
		flex-shrink: 0;
		position: sticky;
		top: 150px;
		height: fit-content;
		text-align: center;
		padding-bottom: 2rem;
	}

	.right-ad-title {
		font-size: 0.75rem;
		font-weight: 700;
		color: #fbbf24;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		margin: 0 0 0.75rem;
		padding: 0 0.5rem;
	}

	/* מעבר עדין בין קבוצות הלוח: כל הקבוצות שוכבות זו על זו באותו תא
	   grid, וההחלפה היא מיזוג שקיפות איטי (crossfade) - הקבוצה הנכנסת
	   מופיעה בהדרגה בזמן שהיוצאת נמוגה. אין רגע שבו הטור ריק, אין הבזק
	   ואין שום תזוזה. */
	.right-ad-stage {
		display: grid;
	}
	.right-ad-list {
		grid-area: 1 / 1;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		opacity: 0;
		visibility: hidden;
		pointer-events: none;
		transition:
			opacity 1800ms ease-in-out,
			visibility 0s linear 1800ms;
	}
	.right-ad-list.active {
		opacity: 1;
		visibility: visible;
		pointer-events: auto;
		transition: opacity 1800ms ease-in-out;
	}
	@media (prefers-reduced-motion: reduce) {
		.right-ad-list,
		.right-ad-list.active {
			transition: none;
		}
	}

	.right-ad-card {
		position: relative;
		height: 490px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
		border-radius: 16px;
		border: 2px dashed;
		padding: 1.5rem 0.75rem;
		overflow: hidden;
		text-decoration: none;
	}

	.right-ad-num {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		font-size: 0.8rem;
		font-weight: 900;
		color: rgba(255, 255, 255, 0.6);
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 999px;
		padding: 0.15rem 0.6rem;
	}

	.right-ad-emoji {
		font-size: 1.875rem;
		margin-top: 1rem;
		z-index: 1;
		transition: transform 0.3s;
	}

	.right-ad-card:hover .right-ad-emoji {
		transform: scale(1.25);
	}

	.right-ad-vtext {
		position: absolute;
		top: 50%;
		left: 50%;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		pointer-events: none;
		transform: translate(-50%, -50%) rotate(-90deg);
		white-space: nowrap;
	}

	.right-ad-vmain {
		font-size: 1.5rem;
		font-weight: 900;
		letter-spacing: 0.05em;
	}

	.right-ad-vsub {
		font-size: 1rem;
		font-weight: 700;
		opacity: 0.9;
	}

	.right-ad-btn {
		margin-bottom: 1rem;
		z-index: 1;
		border-radius: 999px;
		padding: 0.5rem 1.25rem;
		font-size: 0.875rem;
		font-weight: 700;
		color: #fff;
		text-decoration: none;
		box-shadow: 0 10px 20px rgba(0, 0, 0, 0.35);
		transition: transform 0.2s;
	}

	.right-ad-btn:hover {
		transform: scale(1.05);
	}

	/* מוצג בדסקטופ/טאבלט - יחד עם סיידבר הפרסומות השמאלי */
	@media (max-width: 768px) {
		.right-ad-banner {
			display: none;
		}
	}

	/* בטאבלט - מעט צר יותר כדי להשאיר מקום לתוכן */
	@media (max-width: 1100px) and (min-width: 769px) {
		.right-ad-banner {
			width: 116px;
		}
	}
</style>
