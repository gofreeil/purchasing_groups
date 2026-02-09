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
			<div class="left-actions">
				<button class="add-business-btn">+ הוסף עסק</button>
				<button class="policy-btn">
					<span class="icon">📄</span>
					מדיניות הקהילה
				</button>
				<button class="login-link">התחברות</button>
				<div class="lang-selector">
					עברית IL <span class="chevron">⌄</span>
				</div>
			</div>

			<div class="right-branding">
				<div class="titles">
					<h1 class="main-title">רכישות קבוצתיות יוצאים לחירות</h1>
					<p class="sub-title">
						בהנחות והטבות ייחודיות לחברי יוצאים לחירות
					</p>
				</div>
				<div class="logo-container">
					<img src="/assets/logo.png" alt="לוגו" class="main-logo" />
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
			<div class="ad-card neighborhoods-ad">
				<div class="ad-content">
					<h3>הצטרף לועדי השכונות בארץ</h3>
					<p>חזק את כוחו של עם ישראל במכלול הטבות ייחודיות!</p>
				</div>
			</div>

			<div class="ad-card groups-ad">
				<div class="ad-content">
					<h3>רכישות קבוצתיות</h3>
					<p>
						הצטרפו לקבוצת רכישה והוזילו מיד את ההוצאות החודשיות שלך
					</p>
				</div>
			</div>

			<div class="ad-status">תוכן שיווקי</div>

			<div class="promo-placeholder">
				<div class="plus-icon">+</div>
				<p class="promo-text">מקום פרסום זה יכול להיות שלך</p>
				<div class="contact-links">
					<a href="#">רוצים לפרסם כאן?</a>
					<a href="#">צור קשר</a>
				</div>
			</div>
		</aside>
	</div>
</div>

<style>
	/* Styles will be moved to app.css for better organization, 
	   but basic layout logic stays here */
</style>
