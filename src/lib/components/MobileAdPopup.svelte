<script>
	// MobileAdPopup — פרסומת משלמת בנייד, מצוירת מאותו כרטיס משותף
	// (MobileAdCard) שהמפרסם עורך בשלב 7 בבילדר. קריאה בלבד כאן.
	// טריגר עדין בכוונה: פעם אחת בלבד לכל ביקור (sessionStorage), בנייד בלבד,
	// ורק אחרי הניווט הראשון של הגולש בתוך האתר - לא בטעינה ראשונה ולא בכל דף.
	// נסגר בלחיצה על הכפתור העגול, או אוטומטית אחרי COUNTDOWN שניות.
	import { onDestroy } from "svelte";
	import { afterNavigate } from "$app/navigation";
	import MobileAdCard from "$lib/components/MobileAdCard.svelte";
	import { parseAdStyle, legacyAdStyle } from "$lib/adStyle.js";
	import { parseAdImageFit } from "$lib/adImageFit.js";

	/** @type {{ approvedAds?: any[] }} */
	let { approvedAds = [] } = $props();

	const COUNTDOWN = 5;
	const SEEN_KEY = "mobile_ad_popup_seen_v1";

	/** @type {any | null} */
	let ad = $state(null);
	let countdown = $state(COUNTDOWN);
	/** @type {ReturnType<typeof setInterval> | undefined} */
	let timer;

	function close() {
		ad = null;
		clearInterval(timer);
	}

	function alreadySeen() {
		try {
			return sessionStorage.getItem(SEEN_KEY) === "1";
		} catch {
			return true;
		}
	}

	afterNavigate((nav) => {
		// רק ניווט של הגולש בתוך האתר (לא טעינה ראשונה), פעם אחת לביקור
		if (nav.type === "enter" || ad || alreadySeen()) return;
		if (typeof window === "undefined" || !window.matchMedia("(max-width: 768px)").matches) return;
		const path = nav.to?.url.pathname ?? "";
		if (path.startsWith("/admin") || path.startsWith("/ads/") || path.startsWith("/advertise")) return;
		const pool = (approvedAds ?? []).filter((/** @type {any} */ a) => a.mainImage && !a.shop);
		if (!pool.length) return;
		try {
			sessionStorage.setItem(SEEN_KEY, "1");
		} catch {
			return;
		}
		ad = pool[Math.floor(Math.random() * pool.length)];
		countdown = COUNTDOWN;
		timer = setInterval(() => {
			countdown -= 1;
			if (countdown <= 0) close();
		}, 1000);
	});

	onDestroy(() => clearInterval(timer));
</script>

{#if ad}
	<div class="mp-backdrop" role="dialog" aria-modal="true">
		<button type="button" class="mp-scrim" aria-label="✕" onclick={close}></button>
		<div class="mp-card">
			<MobileAdCard
				title={ad.title}
				subtitle={ad.subtitle ?? ""}
				cta={ad.cta ?? ""}
				image={ad.mainImage}
				imageFit={parseAdImageFit(ad.mainImageFit)}
				logo={ad.logo ?? ""}
				gradient={ad.gradient}
				st={parseAdStyle(ad.adStyle) ?? legacyAdStyle(ad.title)}
				showCta={!!ad.cta}
				{countdown}
				onclose={close}
				href={`/ads/${ad.id}`}
				onctaclick={close}
			/>
		</div>
	</div>
{/if}

<style>
	.mp-backdrop {
		position: fixed; inset: 0; z-index: 1400; display: flex;
		align-items: center; justify-content: center; padding: 1rem;
	}
	.mp-scrim { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.7); border: 0; padding: 0; }
	.mp-card { position: relative; width: 100%; max-width: 384px; }
	@media (min-width: 769px) {
		.mp-backdrop { display: none; }
	}
</style>
