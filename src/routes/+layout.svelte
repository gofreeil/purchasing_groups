<script>
	import { onMount } from "svelte";
	import favicon from "$lib/assets/favicon.svg";
	import "../app.css?v=1.0.2";
	import { lang, t } from "$lib/i18n.js";
	import { isLoggedIn } from "$lib/user.js";
	import AdsSidebar from "$lib/components/AdsSidebar.svelte";
	import RightAdBanner from "$lib/components/RightAdBanner.svelte";
	import MobileAdsDrawer from "$lib/components/MobileAdsDrawer.svelte";

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

				<button
					class="login-header-btn"
					onclick={() => ($isLoggedIn = !$isLoggedIn)}
				>
					{#if $isLoggedIn}
						{$lang === "he"
							? "התנתק"
							: $lang === "ru"
								? "Выйти"
								: "Logout"}
					{:else}
						{$t.login}
					{/if}
				</button>

				<a
					href="https://docs.google.com/forms/d/e/1FAIpQLSeK7H6wdZnAddeD7TuQwutsEYAT3AKkMh6L82gX797DVw8sRQ/viewform?usp=dialog"
					target="_blank"
					class="add-business-btn">{$t.addOffer}</a
				>
			</div>
		</div>
	</header>

	<div class="main-layout">
		<!-- Right Ad Banner (wide screens) -->
		<RightAdBanner />

		<!-- Main Content Area -->
		<main class="content-area">
			{@render children()}
		</main>

		<!-- Sidebar for Ads (desktop) -->
		<AdsSidebar />
	</div>

	<!-- Mobile ads drawer + tab -->
	<MobileAdsDrawer />

	<!-- Footer -->
	<footer class="main-footer">
		<div class="footer-container">
			<a
				href="https://www.melecshop.com/"
				target="_blank"
				rel="noopener noreferrer"
				class="footer-brand"
			>
				<img
					src="/assets/yotzim-lecherut.png"
					alt="יוצאים לחירות"
					class="footer-brand-img"
				/>
				<span class="footer-brand-text">{$t.footer.clickForActivity}</span>
			</a>

			<nav class="footer-links" aria-label="ניווט תחתון">
				<a href="/privacy">{$t.footer.privacy}</a>
				<span class="dot">|</span>
				<a href="mailto:freedomhasbegun@gmail.com"
					>{$t.footer.contactUs}</a
				>
				<span class="dot">|</span>
				<a href="/satisfaction">{$t.satisfaction.title}</a>
			</nav>

			<p class="footer-copy">
				&copy; {new Date().getFullYear()} {$t.title}
			</p>
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

	.login-header-btn {
		background: transparent;
		border: 1px solid var(--border-color);
		color: var(--text-white);
		padding: 0.5rem 1.2rem;
		border-radius: 8px;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 600;
		transition: all 0.2s;
	}

	.login-header-btn:hover {
		background: rgba(250, 204, 21, 0.1);
		border-color: #facc15;
		color: #facc15;
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
