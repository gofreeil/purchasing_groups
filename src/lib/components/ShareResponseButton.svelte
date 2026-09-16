<script>
	// ============================================================
	// ShareResponseButton.svelte — כפתור "שיתוף חכם" לתגובה בודדת.
	// בנייד פותח את דיאלוג השיתוף של המכשיר (וואטסאפ/טלגרם/פייסבוק...)
	// עם דירוג + תגובה + עיקרי הקבוצה + קישור ייעודי לתגובה.
	// בדסקטופ (בלי navigator.share) - מעתיק את אותו טקסט ללוח ומציג טוסט.
	// הקישור (/details/<campaign>?r=<id>) מציג את התגובה בתצוגה המקדימה
	// - ראה $lib/shareResponse.js.
	// ============================================================
	import { shareResponse } from '$lib/shareResponse.js';

	/** @type {{ campaignSlug: string, campaignTitle: string, response: import('$lib/shareResponse.js').SatisfactionResponse, highlights?: string[], label?: string }} */
	let { campaignSlug, campaignTitle, response, highlights = [], label = 'שתף' } = $props();

	let busy = $state(false);
	/** @type {'copied' | 'failed' | null} */
	let toast = $state(null);
	/** @type {ReturnType<typeof setTimeout> | null} */
	let toastTimer = null;

	async function onShare() {
		if (busy) return;
		busy = true;
		try {
			const result = await shareResponse({ campaignSlug, campaignTitle, response, highlights });
			if (result === 'copied' || result === 'failed') {
				toast = result;
				if (toastTimer) clearTimeout(toastTimer);
				toastTimer = setTimeout(() => (toast = null), 2400);
			}
		} finally {
			busy = false;
		}
	}
</script>

<button
	type="button"
	class="share-btn"
	onclick={onShare}
	disabled={busy}
	title="שיתוף התגובה ברשתות החברתיות"
	aria-label="שיתוף התגובה"
>
	<svg class="share-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
		<circle cx="18" cy="5" r="3" />
		<circle cx="6" cy="12" r="3" />
		<circle cx="18" cy="19" r="3" />
		<path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
	</svg>
	<span class="share-label">{label}</span>
</button>

{#if toast}
	<div class="share-toast" role="status" aria-live="polite">
		{#if toast === 'copied'}
			✅ התגובה והקישור הועתקו - אפשר להדביק בכל מקום
		{:else}
			⚠️ לא הצלחנו להעתיק - נסו שוב
		{/if}
	</div>
{/if}

<style>
	.share-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		background: rgba(37, 211, 102, 0.1);
		border: 1px solid rgba(37, 211, 102, 0.45);
		color: #86efac;
		padding: 0.3rem 0.75rem;
		border-radius: 999px;
		font-size: 0.85rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
		transition: background 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
	}
	.share-btn:hover:not(:disabled) {
		background: rgba(37, 211, 102, 0.2);
		border-color: rgba(37, 211, 102, 0.8);
	}
	.share-btn:active:not(:disabled) {
		transform: scale(0.96);
	}
	.share-btn:disabled {
		opacity: 0.7;
		cursor: default;
	}
	.share-icon {
		width: 1rem;
		height: 1rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
		flex-shrink: 0;
	}

	.share-toast {
		position: fixed;
		bottom: 28px;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(10, 17, 40, 0.96);
		color: #facc15;
		padding: 0.85rem 1.3rem;
		border-radius: 14px;
		border: 2px solid rgba(250, 204, 21, 0.6);
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 22px rgba(250, 204, 21, 0.35);
		font-weight: 700;
		font-size: 0.95rem;
		z-index: 9999;
		max-width: calc(100vw - 32px);
		text-align: center;
		animation: share-toast-in 0.25s ease-out;
	}
	@keyframes share-toast-in {
		from { opacity: 0; transform: translate(-50%, 12px); }
		to { opacity: 1; transform: translate(-50%, 0); }
	}
</style>
