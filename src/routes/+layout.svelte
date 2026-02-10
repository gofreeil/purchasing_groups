<script>
	import { onMount } from "svelte";
	import favicon from "$lib/assets/favicon.svg";
	import "../app.css";
	import { lang, t } from "$lib/i18n.js";

	let { children } = $props();

	/**
	 * @param {string} newLang
	 */
	function toggleLang(newLang) {
		$lang = newLang;
		// Update HTML lang attribute for accessibility and RTL
		if (typeof document !== "undefined") {
			document.documentElement.lang = newLang;
			document.documentElement.dir = newLang === "he" ? "rtl" : "ltr";
		}
	}

	// Set direction on initial load
	onMount(() => {
		if (typeof document !== "undefined") {
			document.documentElement.lang = $lang;
			document.documentElement.dir = $lang === "he" ? "rtl" : "ltr";
		}
	});

	let showLangMenu = $state(false);

	/**
	 * @param {MouseEvent} event
	 */
	function handleClickOutside(event) {
		if (
			showLangMenu &&
			event.target instanceof Element &&
			!event.target.closest(".lang-selector")
		) {
			showLangMenu = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{$t.title}</title>
</svelte:head>

<div class="app-wrapper">
	<!-- Header -->
	<header class="main-header">
		<div class="header-container">
			<a href="/" class="right-branding">
				<div class="logo-container">
					<img
						src="/assets/logo.png"
						alt={$t.logoAlt}
						class="main-logo"
					/>
				</div>
				<div class="titles">
					<h1 class="main-title">{$t.title}</h1>
					<p class="sub-title">
						{$t.subtitle}
					</p>
				</div>
			</a>

			<div class="left-actions">
				<div class="lang-selector-container">
					<button
						class="lang-selector-btn"
						onclick={() => (showLangMenu = !showLangMenu)}
					>
						{#if $lang === "he"}
							<img
								src="https://flagcdn.com/24x18/il.png"
								alt="IL"
								class="flag-icon"
							/> עברית
						{:else if $lang === "en"}
							<img
								src="https://flagcdn.com/24x18/us.png"
								alt="US"
								class="flag-icon"
							/> English
						{:else}
							<img
								src="https://flagcdn.com/24x18/ru.png"
								alt="RU"
								class="flag-icon"
							/> Русский
						{/if}
						<span class="chevron">⌄</span>
					</button>

					{#if showLangMenu}
						<div class="lang-dropdown">
							<button
								onclick={() => {
									toggleLang("he");
									showLangMenu = false;
								}}
							>
								<img
									src="https://flagcdn.com/24x18/il.png"
									alt="IL"
									class="flag-icon"
								/> עברית
							</button>
							<button
								onclick={() => {
									toggleLang("en");
									showLangMenu = false;
								}}
							>
								<img
									src="https://flagcdn.com/24x18/us.png"
									alt="US"
									class="flag-icon"
								/> English
							</button>
							<button
								onclick={() => {
									toggleLang("ru");
									showLangMenu = false;
								}}
							>
								<img
									src="https://flagcdn.com/24x18/ru.png"
									alt="RU"
									class="flag-icon"
								/> Русский
							</button>
						</div>
					{/if}
				</div>

				<a
					href="https://docs.google.com/forms/d/e/1FAIpQLSeK7H6wdZnAddeD7TuQwutsEYAT3AKkMh6L82gX797DVw8sRQ/viewform?usp=dialog"
					target="_blank"
					class="add-business-btn">{$t.addOffer}</a
				>
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
					<p>{$t.sidebar.whatsapp}</p>
				</div>
			</a>

			<!-- Neighborhoods Ad (Second) -->
			<a
				href="https://www.melecshop.com/page/peace-on-earth_VRHH"
				target="_blank"
				class="ad-card neighborhoods-ad"
			>
				<div class="ad-content-whatsapp">
					<p>{$t.sidebar.neighborhoods}</p>
				</div>
			</a>

			<!-- New Special Ad (Third) -->
			<a
				href="https://index-chi-sage.vercel.app/"
				target="_blank"
				class="ad-card special-ad"
			>
				<div class="ad-content-whatsapp">
					<p>{$t.sidebar.craftsmen}</p>
				</div>
			</a>

			<!-- Community Investment Ad (New) -->
			<a
				href="https://chat.whatsapp.com/ECzrpGuufdd1ODIwO4YPWM"
				target="_blank"
				class="ad-card investments-community-ad"
			>
				<div class="ad-content-whatsapp">
					<p>{$t.sidebar.investmentsCommunity}</p>
				</div>
			</a>

			<!-- Grow Food Ad (Fifth) -->
			<div class="ad-card grow-food-ad">
				<div class="ribbon-wrapper">
					<div class="ribbon">{$t.sidebar.soonTag}</div>
				</div>
				<div class="ad-content-whatsapp">
					<p>{$t.sidebar.growFood}</p>
				</div>
			</div>

			<div class="ad-status">
				{$t.sidebar.sponsored}
			</div>

			<div class="promo-placeholder">
				<div class="plus-icon">+</div>
				<p class="promo-text">
					{$t.sidebar.yourAdHere}
				</p>
				<div class="contact-links">
					<a href="mailto:support@melecshop.com"
						>{$t.sidebar.advertise}</a
					>
					<a href="mailto:support@melecshop.com"
						>{$t.sidebar.contact}</a
					>
				</div>
			</div>
		</aside>
	</div>

	<!-- Footer -->
	<footer class="main-footer">
		<div class="footer-container">
			<div class="footer-top">
				<span>{$t.footer.clickForActivity}</span>
				<a
					href="https://www.melecshop.com/"
					target="_blank"
					class="liberty-link"
				>
					{$t.footer.libertyLink}
				</a>
			</div>

			<div class="footer-links">
				<a href="mailto:support@melecshop.com">{$t.footer.contactUs}</a>
				<span class="dot">|</span>
				<a href="/privacy">{$t.footer.privacy}</a>
			</div>
		</div>
	</footer>
</div>

<style>
	.lang-selector-container {
		position: relative;
	}

	.lang-selector-btn {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid var(--border-color);
		color: var(--text-white);
		padding: 0.5rem 1rem;
		border-radius: 8px;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-size: 0.9rem;
		transition: all 0.2s;
	}

	.lang-selector-btn:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	.lang-dropdown {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		background: var(--bg-header);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
		display: flex;
		flex-direction: column;
		width: 140px;
		z-index: 1001;
		animation: slideDown 0.2s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.lang-dropdown button {
		background: none;
		border: none;
		color: var(--text-white);
		padding: 0.8rem 1rem;
		display: flex;
		align-items: center;
		gap: 0.8rem;
		cursor: pointer;
		text-align: right;
		font-size: 0.9rem;
		transition: background 0.2s;
	}

	.lang-dropdown button:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.chevron {
		font-size: 0.8rem;
		opacity: 0.7;
	}
</style>
