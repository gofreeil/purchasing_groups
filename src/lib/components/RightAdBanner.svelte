<script>
	import { onMount } from "svelte";

	let currentGroup = $state(0);
	let totalSwaps = $state(0);
	const MAX_SWAPS = 8;

	// 12 מקומות פרסום פנויים, כל אחד בגוון אחר.
	const slots = [
		{ border: "rgba(249,115,22,0.3)", bg: "rgba(124,45,18,0.1)", text: "#fb923c", btn: "#ea580c" },
		{ border: "rgba(59,130,246,0.3)", bg: "rgba(30,58,138,0.1)", text: "#60a5fa", btn: "#2563eb" },
		{ border: "rgba(34,197,94,0.3)", bg: "rgba(20,83,45,0.1)", text: "#4ade80", btn: "#16a34a" },
		{ border: "rgba(245,158,11,0.3)", bg: "rgba(120,53,15,0.1)", text: "#fbbf24", btn: "#d97706" },
		{ border: "rgba(168,85,247,0.3)", bg: "rgba(88,28,135,0.1)", text: "#c084fc", btn: "#9333ea" },
		{ border: "rgba(239,68,68,0.3)", bg: "rgba(127,29,29,0.1)", text: "#f87171", btn: "#dc2626" },
		{ border: "rgba(99,102,241,0.3)", bg: "rgba(49,46,129,0.1)", text: "#818cf8", btn: "#4f46e5" },
		{ border: "rgba(20,184,166,0.3)", bg: "rgba(19,78,74,0.1)", text: "#2dd4bf", btn: "#0d9488" },
		{ border: "rgba(236,72,153,0.3)", bg: "rgba(131,24,67,0.1)", text: "#f472b6", btn: "#db2777" },
		{ border: "rgba(234,179,8,0.3)", bg: "rgba(113,63,18,0.1)", text: "#facc15", btn: "#ca8a04" },
		{ border: "rgba(16,185,129,0.3)", bg: "rgba(6,78,59,0.1)", text: "#34d399", btn: "#059669" },
		{ border: "rgba(217,70,239,0.3)", bg: "rgba(112,26,117,0.1)", text: "#e879f9", btn: "#c026d3" },
	];

	const VIEW_MS = 14000;   // כמה זמן כל קבוצה נשארת על המסך (החלפה איטית)
	const FADE_MS = 900;     // אורך הדעיכה בין קבוצה לקבוצה — חייב להתאים ל-CSS

	let fading = $state(false);

	onMount(() => {
		let fadeTimer;
		// דעיכה החוצה → החלפת הקבוצה בזמן שהטור שקוף → דעיכה פנימה.
		// כך אין קפיצה: המשבצות לא מתחלפות מול העין אלא מתוך שקיפות מלאה.
		const interval = setInterval(() => {
			if (totalSwaps < MAX_SWAPS) {
				fading = true;
				fadeTimer = setTimeout(() => {
					currentGroup = (currentGroup + 1) % 3;
					totalSwaps++;
					fading = false;
				}, FADE_MS);
			} else {
				clearInterval(interval);
			}
		}, VIEW_MS);
		return () => {
			clearInterval(interval);
			clearTimeout(fadeTimer);
		};
	});

	let displayed = $derived(slots.slice(currentGroup * 4, currentGroup * 4 + 4));
</script>

<aside class="right-ad-banner" aria-label="פרסומות">
	<h4 class="right-ad-title">תוכן שיווקי</h4>
	<div class="right-ad-list" class:fading>
		{#each displayed as slot, index (currentGroup * 4 + index)}
			<a
				href="/advertise"
				class="right-ad-card"
				style="border-color: {slot.border}; background: {slot.bg};"
				aria-label="מקום פרסום פנוי - לפרטים על פרסום באתר"
			>
				<div class="right-ad-num">{currentGroup * 4 + index + 1}</div>
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
		{/each}
	</div>
</aside>

<style>
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

	.right-ad-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		/* דעיכה רכה בין קבוצות המודעות — הערך חייב להתאים ל-FADE_MS שבסקריפט */
		opacity: 1;
		transition: opacity 900ms ease-in-out;
	}
	.right-ad-list.fading {
		opacity: 0;
	}
	@media (prefers-reduced-motion: reduce) {
		.right-ad-list {
			transition-duration: 1ms;
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
