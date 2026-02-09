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
			<div class="right-branding">
				<div class="logo-container">
					<img src="/assets/logo.png" alt="לוגו" class="main-logo" />
				</div>
				<div class="titles">
					<h1 class="main-title">רכישות קבוצתיות יוצאים לחירות</h1>
					<p class="sub-title">
						הצטרף והוזל עכשיו את ההוצאות החודשיות שלך
					</p>
				</div>
			</div>

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
			<a
				href="https://www.melecshop.com/"
				target="_blank"
				class="ad-card neighborhoods-ad"
			>
			</a>

			<a
				href="https://chat.whatsapp.com/FWz0ha6fRqxEjDLzFVq7jI"
				target="_blank"
				class="ad-card groups-ad"
			>
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
</div>

<style>
	/* Styles will be moved to app.css for better organization, 
	   but basic layout logic stays here */
</style>
