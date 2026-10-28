<script>
	// ============================================================
	// AdCard — כרטיס פרסומת משלמת. משותף לטור הימני (RightAdBanner) ולתצוגה
	// המקדימה במסך הניהול ובאזור האישי (AdCardPreview), כדי שהתצוגה המקדימה
	// תהיה באמת מה שמוצג באתר: אותן שכבות, מידות, צבעים ועקיפת הלוגו.
	//
	// הכרטיס הוא עותק של כרטיס הפרסומת בקהילה בשכונה - אותן שכבות, מידות
	// וצבעים - כדי שפרסומת שהופצה משם תיראה כאן בדיוק כמו שם. העיצוב
	// שהמפרסם קבע בבילדר (שם או כאן) נוסע עם הפרסומת (_adStyle) ומנורמל
	// באותו מודול משותף; פרסומת ותיקה בלי עיצוב שמור מקבלת את הכלל הישן
	// (כותרת ארוכה ← לוגו מעל רצועת ה-CTA), כמו בקהילה בשכונה.
	//
	// href = קישור (הטור); בלעדיו הכרטיס הוא div.
	// still = עותק סטטי (תצוגה מקדימה): בלי ריחוף, בלי הגדלה ובלי tooltip.
	// ============================================================
	import { adImgFit, parseAdImageFit } from "$lib/adImageFit.js";
	import {
		parseAdStyle, legacyAdStyle, adStyleVars, logoAnchorClass, logoFreeStyle, logoBgStyle, logoSizeStyle, titleSizeStyle, hoverLogoStyle, logoCornerSide,
	} from "$lib/adStyle.js";
	import { logoClearance } from "$lib/logoClearance.js";
	import { gradientStyle } from "$lib/adGradient.js";

	/** @type {{ ad: any, href?: string, still?: boolean }} */
	let { ad, href = undefined, still = false } = $props();

	let st = $derived(parseAdStyle(ad.adStyle) ?? legacyAdStyle(ad.title));
	let cornerSide = $derived(logoCornerSide(st, Boolean(ad.logo)));
</script>

<svelte:element
	this={href ? "a" : "div"}
	{href}
	class="paid-ad"
	class:is-live={!still}
	aria-label={href ? `${ad.title} – ${ad.subtitle ?? ""}` : undefined}
	style={adStyleVars(st)}
>
	<!-- הכותרת ותת-הכותרת עוקפות את הלוגו בכל מיקום שלו (logoClearance) -->
	<div class="paid-ad-media" use:logoClearance={ad}>
		<div class="paid-ad-img">
			{#if ad.mainImage}
				<!-- המיקום/זום שנבחרו בבילדר מוחלים גם כאן — הדמו הוא מה שרואים -->
				<img
					src={ad.mainImage}
					alt={ad.title}
					loading="lazy"
					decoding="async"
					use:adImgFit={parseAdImageFit(ad.mainImageFit)}
				/>
			{/if}
		</div>
		<div class="promo-diag" style={gradientStyle(ad.gradient, "to bottom right")}></div>
		<div
			class="promo-title-top"
			class:has-corner-logo-right={cornerSide === "right"}
			class:has-corner-logo-left={cornerSide === "left"}
			style="transform: translateY({st.titleOffsetY}px);"
		>
			<h3 class="promo-title" style="color: {st.titleColor};{titleSizeStyle(st.titleFontSize)}"><span class="logo-avoid" aria-hidden="true"></span>{ad.title}</h3>
		</div>
		{#if ad.subtitle}
			<div class="promo-sub-wrap">
				<p class="promo-sub"><span class="logo-avoid" data-anchor="bottom" aria-hidden="true"></span>{ad.subtitle}</p>
			</div>
		{/if}
		{#if ad.logo}
			<img
				src={ad.logo}
				alt=""
				loading="lazy"
				decoding="async"
				data-ad-logo
				class="promo-logo {logoAnchorClass(st, 'promo')}"
				class:promo-logo-circle={st.logoShape === "circle"}
				style={logoFreeStyle(st) + logoBgStyle(st.logoBg) + logoSizeStyle(st.logoSize)}
			/>
		{/if}
		{#if !still}
			<div class="paid-ad-hover">
				<div class="paid-ad-hover-body">
					<h3>{ad.title}</h3>
					<p>{ad.subtitle}</p>
				</div>
				{#if ad.logo && st.hoverLogo}
					<img src={ad.logo} alt="" class="promo-hover-logo" style={hoverLogoStyle(st, logoBgStyle(st.logoBg))} />
				{/if}
			</div>
		{/if}
	</div>
	<!-- כרטיס מוצר מהחנות - בלי רצועת המחיר ("₪.. · לצפייה בחנות").
	     גם פרסומת שטקסט הכפתור שלה נמחק מוצגת בלי רצועה -->
	{#if !ad.shop && ad.cta}
	<div class="paid-ad-cta" style={gradientStyle(ad.gradient, "to right")}>
		<p>{ad.cta || ad.title}</p>
		{#if ad.hover && !still}
			<!-- pre-line + max-content: משפט בשורה אחת נשאר בשורה אחת, אבל ירידות
			     שורה שהמפרסם הקליד נשמרות, וטקסט ארוך נגמר ב-max-width במקום לגלוש -->
			<span class="paid-ad-tip">{ad.hover}</span>
		{/if}
	</div>
	{/if}
</svelte:element>

<style>
	/* כרטיס פרסומת משלמת - עותק של הכרטיס בקהילה בשכונה. שם הוא בנוי
	   ממחלקות Tailwind v4 (block overflow-hidden rounded-lg shadow-lg
	   transition-transform hover:scale-105, שכבות ב-transition-opacity
	   duration-[1500ms]); כאן אותם ערכים בדיוק ב-CSS רגיל, כדי שפרסומת
	   שהופצה משם תיראה כאן זהה - גודל, צבע, צל ותנועה. */
	.paid-ad {
		position: relative;
		display: block;
		overflow: hidden;
		border-radius: 0.5rem;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
		transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1);
		text-decoration: none;
	}
	.paid-ad.is-live:hover {
		transform: scale(1.05);
	}
	/* aspect-ratio 144/450 = בדיוק היחס שהבילדר מציג בתצוגה החיה. המפרסם
	   מכוון שם מיקום וזום על מסגרת צרה וגבוהה, ולכן חייבים לשמור את אותו
	   יחס - אחרת החיתוך שהוא בחר נשבר. */
	.paid-ad-media {
		position: relative;
		width: 100%;
		aspect-ratio: 144 / 450;
		overflow: hidden;
	}
	.paid-ad-img {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}
	.paid-ad-img img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.paid-ad-img img,
	.promo-diag,
	.promo-title-top,
	.promo-sub-wrap,
	.paid-ad-media .promo-logo,
	.paid-ad-hover {
		transition: opacity 1500ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.paid-ad.is-live:hover .paid-ad-img img,
	.paid-ad.is-live:hover .promo-diag,
	.paid-ad.is-live:hover .promo-title-top,
	.paid-ad.is-live:hover .promo-sub-wrap,
	.paid-ad.is-live:hover .promo-logo {
		opacity: 0;
	}

	/* שמות המחלקות מתחילים ב-promo ולא ב-ad בכוונה: EasyList מכילה כלל
	   קוסמטי גנרי `##.ad-title` שמסתיר כל אלמנט עם המחלקה הזאת בכל אתר.
	   הערכים זהים ל-.pro-title-top/.pro-title/.ad-logo שבבילדר. */
	.promo-title-top {
		position: absolute;
		inset-inline: 0;
		top: 0;
		z-index: 5;
		padding: 0.55rem 0.7rem 0.85rem;
		text-align: center;
		background: linear-gradient(
			180deg,
			rgba(0, 0, 0, 0.78) 0%,
			rgba(0, 0, 0, 0.45) 55%,
			rgba(0, 0, 0, 0) 100%
		);
		pointer-events: none;
	}
	/* לוגו בפינה העליונה יושב בגובה הכותרת - הריפוד שומר לו מקום.
	   padding פיזי: הדף RTL, והקצה הלוגי הפוך לצד שבו הלוגו נמצא. */
	.promo-title-top.has-corner-logo-right {
		padding-right: 46px;
	}
	.promo-title-top.has-corner-logo-left {
		padding-left: 46px;
	}
	/* הרצועה האלכסונית בתחתית התמונה; הגובה מגיע מ-adStyleVars */
	.promo-diag {
		position: absolute;
		inset: 0;
		clip-path: polygon(
			0 var(--diag-top-left, 88%),
			100% var(--diag-top-right, 78%),
			100% 100%,
			0 100%
		);
		opacity: 0.96;
		pointer-events: none;
	}
	/* פס הברק הלבן שחוצה את האלכסון */
	.promo-diag::after {
		content: "";
		position: absolute;
		inset: 0;
		background: linear-gradient(
			125deg,
			transparent 30%,
			rgba(255, 255, 255, 0.18) 45%,
			transparent 60%
		);
		pointer-events: none;
	}
	/* גודל/רווח/יישור מגיעים מ-adStyleVars — מה שהמפרסם כיוון בשלב 5.
	   ה-fallback הוא הערך שהיה קבוע, כדי שמודעות ותיקות לא ישתנו. */
	.promo-sub-wrap {
		position: absolute;
		inset-inline: 0;
		bottom: 0;
		z-index: 4;
		padding: 0.55rem 0.7rem 1.1rem;
		text-align: var(--sub-align, right);
		pointer-events: none;
	}
	.promo-sub {
		margin: 0;
		color: rgba(255, 255, 255, 0.95);
		font-weight: 600;
		font-size: var(--sub-size, 0.88rem);
		line-height: var(--sub-lh, 1.3);
		text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
	}
	/* משולש בלתי-נראה שגורם לשורה הראשונה להתקצר לפי שיפוע האלכסון.
	   כשהלוגו בצד שמאל, logoClearance מחליף אותו ב-float משולב ומכבה
	   אותו דרך --logo-avoid-tri. */
	.promo-sub::before {
		content: "";
		display: var(--logo-avoid-tri, block);
		float: left;
		width: 28%;
		height: 1.35em;
		shape-outside: polygon(0 0, 100% 0, 0 100%);
	}
	.promo-title {
		margin: 0;
		color: white;
		font-weight: 900;
		font-size: 1.15rem;
		line-height: 1.15;
		letter-spacing: 0.005em;
		text-shadow: 0 2px 10px rgba(0, 0, 0, 0.85), 0 1px 2px rgba(0, 0, 0, 0.95);
	}
	/* ה-float שגורם לטקסט לעקוף את הלוגו - מוצג ומוצב רק ע"י logoClearance */
	.logo-avoid {
		display: none;
	}
	.paid-ad-media .promo-logo {
		position: absolute;
		z-index: 6;
		/* 36px כולל הריפוד - כמו בקהילה בשכונה (שם preflight של Tailwind
		   קובע border-box). בלי זה הלוגו יצא 42px, ועוגן ה-CTA (18px = חצי
		   לוגו) לא היה ממורכז על קצה הרצועה. */
		box-sizing: border-box;
		display: block;
		max-width: none;
		width: 36px;
		height: 36px;
		border-radius: 6px;
		background: white;
		padding: 3px;
		object-fit: contain;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
	}
	/* right/left פיזיים - הדף RTL, עם inset-inline-end הלוגו היה קופץ לשמאל */
	.promo-logo-right {
		top: 6px;
		right: 6px;
		left: auto;
	}
	.promo-logo-left {
		top: 6px;
		left: 6px;
		right: auto;
	}
	/* עוגן "מעל ה-CTA": הלוגו רוכב על הפינה הימנית של הרצועה האלכסונית,
	   מרכזו על --diag-top-right (18px = חצי מגובה הלוגו) */
	.promo-logo-cta {
		top: auto;
		bottom: calc(100% - var(--diag-top-right, 78%) - 18px);
		right: 6px;
		left: auto;
	}
	/* מיקום חופשי שהמפרסם גרר: הנקודה המדויקת מגיעה ב-style inline */
	.promo-logo-free {
		top: auto;
		bottom: auto;
		right: auto;
		left: auto;
	}
	.promo-logo-circle {
		border-radius: 50%;
	}
	/* הלוגו בטקסט הריחוף: המיקום והגודל מגיעים מ-hoverLogoStyle; רקע לבן + ריפוד + צל כמו בקהילה בשכונה */
	.promo-hover-logo {
		box-sizing: border-box;
		max-width: none;
		background: white;
		padding: 3px;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
	}
	/* צד הריחוף: absolute inset-0 flex bg-black/60 backdrop-blur-sm (v4 = 8px) */
	.paid-ad-hover {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.6);
		-webkit-backdrop-filter: blur(8px);
		backdrop-filter: blur(8px);
		opacity: 0;
	}
	.paid-ad.is-live:hover .paid-ad-hover {
		opacity: 1;
	}
	.paid-ad-hover-body {
		position: relative;
		z-index: 10;
		padding-inline: 0.75rem;
		text-align: center;
	}
	.paid-ad-hover h3 {
		margin: 0 0 0.25rem;
		color: #fff;
		font-size: 0.875rem;
		line-height: 1.25rem;
		font-weight: 700;
	}
	.paid-ad-hover p {
		margin: 0;
		color: oklch(92.8% 0.006 264.531);
		font-size: 0.75rem;
		line-height: 1rem;
	}
	/* רצועת ה-CTA: p-2.5 / text-xs / font-bold / leading-tight */
	.paid-ad-cta {
		position: relative;
		padding: 0.625rem;
		text-align: center;
	}
	.paid-ad-cta p {
		margin: 0;
		color: #fff;
		font-size: 0.75rem;
		font-weight: 700;
		line-height: 1.25;
	}
	/* הטקסט בריחוף מעל ה-CTA (hover_text) - בועה כהה מעל הרצועה */
	.paid-ad-tip {
		position: absolute;
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
		margin-bottom: 0.5rem;
		display: none;
		width: max-content;
		max-width: 15rem;
		padding: 0.375rem 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		background: oklch(21% 0.034 264.665);
		color: #fff;
		font-size: 0.75rem;
		line-height: 1rem;
		font-weight: 700;
		text-align: center;
		white-space: pre-line;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
		pointer-events: none;
		z-index: 50;
	}
	.paid-ad-cta:hover .paid-ad-tip {
		display: block;
	}
</style>
