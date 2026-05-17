<script>
	import { onMount } from "svelte";
	import { ads } from "$lib/adsData.js";

	let open = $state(false);

	// ---- Swipe gestures (Drawer) ----
	let drawerTouchStartX = 0;
	let drawerTouchStartY = 0;

	/** @param {TouchEvent} e */
	function onDrawerTouchStart(e) {
		drawerTouchStartX = e.touches[0].clientX;
		drawerTouchStartY = e.touches[0].clientY;
	}

	// על הדרואר: משיכה שמאלה → סגור
	/** @param {TouchEvent} e */
	function onDrawerTouchEnd(e) {
		const dx = e.changedTouches[0].clientX - drawerTouchStartX;
		const dy = e.changedTouches[0].clientY - drawerTouchStartY;
		if (dx < -50 && Math.abs(dx) > Math.abs(dy)) {
			open = false;
		}
	}

	// ---- לשונית: גרירה אנכית + פתיחה ----
	let tabY = $state(0);
	let tabDragging = $state(false);
	let tabDragStartClientY = 0;
	let tabDragStartTabY = 0;
	let tabTouchStartX = 0;
	let tabTouchStartY = 0;

	onMount(() => {
		// ברירת מחדל: השליש התחתון של המסך
		tabY = Math.round((window.innerHeight * 2) / 3);
	});

	/** @param {TouchEvent} e */
	function onTabTouchStart(e) {
		tabTouchStartX = e.touches[0].clientX;
		tabTouchStartY = e.touches[0].clientY;
		tabDragStartClientY = e.touches[0].clientY;
		tabDragStartTabY = tabY;
		tabDragging = false;
	}

	/** @param {TouchEvent} e */
	function onTabTouchMove(e) {
		const dx = e.touches[0].clientX - tabTouchStartX;
		const dy = e.touches[0].clientY - tabDragStartClientY;
		if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 20) {
			tabDragging = true;
			let newY = tabDragStartTabY + dy;
			newY = Math.max(60, Math.min(window.innerHeight - 60, newY));
			tabY = newY;
		}
	}

	/** @param {TouchEvent} e */
	function onTabTouchEnd(e) {
		const dx = e.changedTouches[0].clientX - tabTouchStartX;
		const dy = e.changedTouches[0].clientY - tabTouchStartY;
		const totalMove = Math.sqrt(dx * dx + dy * dy);

		const isTap = totalMove < 15;
		const isSwipeRight = dx > 35 && Math.abs(dx) > Math.abs(dy);

		if (!tabDragging && (isTap || isSwipeRight)) {
			open = true;
			e.preventDefault();
		}
		tabDragging = false;
	}

	$effect(() => {
		/** @param {KeyboardEvent} e */
		function handleKeydown(e) {
			if (e.key === "Escape" && open) {
				open = false;
			}
		}
		document.addEventListener("keydown", handleKeydown);
		return () => document.removeEventListener("keydown", handleKeydown);
	});
</script>

<!-- מוצג רק בנייד -->
<div class="mobile-ads-root" dir="rtl">
	<!-- Overlay כהה כשפתוח -->
	{#if open}
		<button
			class="overlay"
			onclick={() => (open = false)}
			aria-label="סגור פרסומות"
		></button>
	{/if}

	<!-- Drawer -->
	<div
		class="drawer"
		class:drawer-open={open}
		role="dialog"
		aria-modal="true"
		aria-label="ההטבות מהקהילה הארצית"
		aria-hidden={!open}
		ontouchstart={onDrawerTouchStart}
		ontouchend={onDrawerTouchEnd}
	>
		<div class="section-title section-title-first">
			הטבות ארציות <span class="title-gold">יוצאים לחירות</span>
			<button
				type="button"
				class="close-btn"
				onclick={() => (open = false)}
				aria-label="סגור"
			>×</button>
		</div>

		<!-- רשימת פרסומות -->
		<div class="ads-list">
			{#each ads as ad (ad.id)}
				<a
					href={ad.href}
					target="_blank"
					rel="noopener noreferrer"
					class="ad-card"
					onclick={() => (open = false)}
				>
					<div class="ad-img-wrap">
						<img
							src={ad.image}
							alt={ad.title}
							class="ad-img"
							decoding="async"
						/>
					</div>
					<div class="ad-body">
						<p class="ad-title">{ad.title}</p>
						<p class="ad-desc">{ad.description}</p>
						<span class="ad-cta" title={ad.hover ?? undefined}
							>← {ad.cta}</span
						>
					</div>
				</a>
			{/each}

			<!-- מקום פרסום ריק -->
			<a
				href="mailto:freedomhasbegun@gmail.com"
				class="ad-card ad-empty"
				onclick={() => (open = false)}
			>
				<div class="ad-empty-inner">
					<span class="ad-empty-icon">📌</span>
					<p class="ad-empty-text">מקום פרסום</p>
					<p class="ad-empty-sub">לחץ לפרסם כאן</p>
				</div>
			</a>
		</div>
	</div>

	<!-- לשונית קטנה בצד שמאל (נראית כשה-Drawer סגור) -->
	{#if !open && tabY > 0}
		<button
			class="tab"
			class:tab-dragging={tabDragging}
			style="top: {tabY}px; transform: translateY(-50%);"
			onclick={() => (open = true)}
			ontouchstart={onTabTouchStart}
			ontouchmove={onTabTouchMove}
			ontouchend={onTabTouchEnd}
			aria-label="פתח הטבות מהקהילה"
		>
			<span class="tab-text">הטבות מהקהילה</span>
		</button>
	{/if}
</div>

<style>
	/* מוצג רק בנייד / טאבלט */
	.mobile-ads-root {
		display: contents;
	}

	@media (min-width: 769px) {
		.mobile-ads-root {
			display: none;
		}
	}

	/* ---- Overlay ---- */
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.55);
		z-index: 1100;
		cursor: pointer;
		border: none;
		padding: 0;
	}

	/* ---- Drawer ---- */
	.drawer {
		position: fixed;
		top: 0;
		left: 0;
		height: 100dvh;
		width: min(340px, 92vw);
		background: linear-gradient(180deg, #0a0f1e 0%, #070b14 100%);
		border-right: 1px solid rgba(99, 102, 241, 0.2);
		z-index: 1200;
		display: flex;
		flex-direction: column;
		transform: translateX(-100%);
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 8px 0 32px rgba(0, 0, 0, 0.5);
	}

	.drawer-open {
		transform: translateX(0);
	}

	/* ---- כותרת סקציה ---- */
	.section-title {
		font-size: 1.15rem;
		font-weight: 900;
		background: linear-gradient(90deg, #38bdf8, #818cf8, #a78bfa);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		text-align: center;
		padding: 0.9rem 1.25rem 0.6rem;
		letter-spacing: 0.05em;
		flex-shrink: 0;
		position: relative;
	}

	.section-title-first {
		padding-top: 0.7rem;
		padding-bottom: 0.5rem;
	}

	.title-gold {
		color: #fbbf24;
		-webkit-text-fill-color: #fbbf24;
	}

	.close-btn {
		position: absolute;
		top: 50%;
		left: 0.6rem;
		transform: translateY(-50%);
		width: 28px;
		height: 28px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: rgba(99, 102, 241, 0.15);
		border: 1px solid rgba(99, 102, 241, 0.35);
		border-radius: 50%;
		color: #e0e7ff;
		font-size: 1.05rem;
		font-weight: 700;
		line-height: 1;
		cursor: pointer;
		padding: 0;
		-webkit-text-fill-color: #e0e7ff;
		transition: background 0.2s, border-color 0.2s;
	}

	.close-btn:hover {
		background: rgba(99, 102, 241, 0.3);
		border-color: rgba(99, 102, 241, 0.6);
	}

	/* ---- רשימת פרסומות ---- */
	.ads-list {
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
		flex: 1;
		min-height: 0;
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		scrollbar-width: thin;
		scrollbar-color: rgba(99, 102, 241, 0.3) transparent;
	}

	/* ---- כרטיס פרסומת ---- */
	.ad-card {
		display: flex;
		gap: 0.75rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(99, 102, 241, 0.15);
		border-radius: 0.75rem;
		text-decoration: none;
		transition: background 0.2s, border-color 0.2s, transform 0.15s;
		padding: 0.75rem;
		align-items: stretch;
	}

	.ad-card:hover {
		background: rgba(99, 102, 241, 0.12);
		border-color: rgba(99, 102, 241, 0.35);
		transform: scale(1.01);
	}

	.ad-img-wrap {
		position: relative;
		width: 88px;
		min-height: 88px;
		border-radius: 0.5rem;
		overflow: hidden;
		flex-shrink: 0;
		background: #1e293b;
	}

	.ad-img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.ad-body {
		flex: 1;
		min-width: 0;
	}

	.ad-title {
		font-size: 0.9rem;
		font-weight: 700;
		color: #f1f5f9;
		margin: 0 0 0.2rem;
		line-height: 1.3;
		white-space: normal;
		word-break: break-word;
	}

	.ad-desc {
		font-size: 0.75rem;
		color: #94a3b8;
		margin: 0 0 0.3rem;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		line-height: 1.4;
	}

	.ad-cta {
		display: inline-block;
		font-size: 0.7rem;
		color: #a5b4fc;
		font-weight: 600;
		background: rgba(99, 102, 241, 0.12);
		border-radius: 4px;
		padding: 0.15rem 0.45rem;
	}

	/* ---- כרטיס ריק ---- */
	.ad-empty {
		justify-content: center;
		border-style: dashed;
		border-color: rgba(99, 102, 241, 0.3);
		background: transparent;
	}

	.ad-empty-inner {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
		padding: 0.5rem;
	}

	.ad-empty-icon {
		font-size: 1.3rem;
	}
	.ad-empty-text {
		font-size: 0.75rem;
		font-weight: 600;
		color: #6366f1;
		margin: 0;
	}
	.ad-empty-sub {
		font-size: 0.65rem;
		color: #64748b;
		margin: 0;
	}

	/* ---- לשונית ---- */
	.tab {
		position: fixed;
		left: 0;
		z-index: 1050;
		background: linear-gradient(180deg, #4f46e5, #7c3aed);
		border: none;
		border-radius: 0 10px 10px 0;
		padding: 0.75rem 0.4rem;
		cursor: grab;
		box-shadow: 2px 0 6px rgba(79, 70, 229, 0.25);
		transition: padding 0.2s, box-shadow 0.2s;
		touch-action: none;
		user-select: none;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
	}

	.tab:hover {
		box-shadow: 2px 0 10px rgba(79, 70, 229, 0.45);
	}

	.tab-dragging {
		cursor: grabbing;
		opacity: 0.85;
		transition: none;
	}

	.tab-text {
		writing-mode: vertical-rl;
		text-orientation: mixed;
		transform: rotate(180deg);
		font-size: 0.65rem;
		font-weight: 700;
		color: #fff;
		letter-spacing: 0.06em;
	}
</style>
