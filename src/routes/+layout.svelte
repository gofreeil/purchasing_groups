<script>
	import favicon from "$lib/assets/favicon.svg";
	import "../app.css";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>רכישות קבוצתיות יוצאים לחירות</title>
</svelte:head>

<div class="app-wrapper">
	<!-- Header -->
	<header class="main-header">
		<div class="header-container">
			<a href="/" class="right-branding">
				<div class="logo-container">
					<img src="/assets/logo.png" alt="לוגו" class="main-logo" />
				</div>
				<div class="titles">
					<h1 class="main-title">רכישות קבוצתיות יוצאים לחירות</h1>
					<p class="sub-title">
						הצטרף והוזל עכשיו את ההוצאות החודשיות שלך
					</p>
				</div>
			</a>

			<div class="left-actions">
				<a
					href="https://docs.google.com/forms/d/e/1FAIpQLSe2wvCp484_PyoJyDZ_n8GupIQVy00ozt5rxOhsWklr7UPkXQ/viewform?usp=header"
					target="_blank"
					class="add-business-btn">+ הוסף הצעה</a
				>

				<a href="/auth/login" class="login-link">התחברות</a>
				<div class="lang-selector">
					עברית IL <span class="chevron">⌄</span>
				</div>
			</div>
		</div>
	</header>

	<div class="main-layout">
		<!-- Main Content Area -->
		<main class="content-area">
			{@render children()}
		</main>

		<!-- Sidebar for Ads -->
		<aside class="sidebar-ads">
			<!-- WhatsApp Ad (First) -->
			<a
				href="https://chat.whatsapp.com/FWz0ha6fRqxEjDLzFVq7jI"
				target="_blank"
				class="ad-card groups-ad"
			>
				<div class="ad-content-whatsapp">
					<p>
						הצטרף עכשיו לקבוצת הווצאפ השקטה שלנו כדי להיות שותף
						בהנחות החודשיות
					</p>
				</div>
			</a>

			<!-- Neighborhoods Ad (Second) -->
			<a
				href="https://www.melecshop.com/page/peace-on-earth_VRHH"
				target="_blank"
				class="ad-card neighborhoods-ad"
			>
				<div class="ad-content-whatsapp">
					<p>
						הצטרף לפרוייקט ועדי השכונות לקידום חברה מתוקנת שבה העם
						שולט על מוסדותיו
					</p>
				</div>
			</a>

			<!-- New Special Ad (Third) -->
			<a
				href="https://index-chi-sage.vercel.app/"
				target="_blank"
				class="ad-card special-ad"
			>
				<div class="ad-content-whatsapp">
					<p>רוצה הנחה אצל בעלי מקצוע כשירים?</p>
				</div>
			</a>

			<!-- Investment Ad (Fourth) -->
			<a
				href="https://www.melecshop.com/page/investment"
				target="_blank"
				class="ad-card investment-ad"
			>
				<div class="ad-content-whatsapp">
					<p>השקעות קבוצתיות בעסקים ונדל"ן</p>
				</div>
			</a>

			<div class="ad-status">תוכן שיווקי</div>

			<div class="promo-placeholder">
				<div class="plus-icon">+</div>
				<p class="promo-text">מקום פרסום זה יכול להיות שלך</p>
				<div class="contact-links">
					<a href="mailto:support@melecshop.com">רוצים לפרסם כאן?</a>
					<a href="mailto:support@melecshop.com">צור קשר</a>
				</div>
			</div>
		</aside>
	</div>

	<!-- Footer -->
	<footer class="main-footer">
		<div class="footer-container">
			<div class="footer-top">
				<span>לכלל פעילות התנועה החברתית יוצאים לחירות הקלק:</span>
				<a
					href="https://www.melecshop.com/"
					target="_blank"
					class="liberty-link"
				>
					יוצאים לחירות בונים עולם חדש!
				</a>
			</div>

			<div class="footer-links">
				<a href="mailto:support@melecshop.com">צור קשר</a>
				<span class="dot">·</span>
				<a href="/privacy">מדיניות פרטיות</a>
			</div>
		</div>
	</footer>
</div>

<style>
	/* Styles will be moved to app.css for better organization, 
	   but basic layout logic stays here */
</style>
