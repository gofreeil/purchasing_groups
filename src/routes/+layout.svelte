<script>
	import { onMount } from "svelte";
	import { page } from "$app/stores";
	const favicon = "/assets/קבוצות-רכישה.png";
	import "../app.css?v=1.0.3";
	import { lang, t } from "$lib/i18n.js";
	import AdsSidebar from "$lib/components/AdsSidebar.svelte";
	import RightAdBanner from "$lib/components/RightAdBanner.svelte";
	import MobileAdsDrawer from "$lib/components/MobileAdsDrawer.svelte";

	let { data, children } = $props();

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
	let showUserMenu = $state(false); // תפריט המשתמש בהדר (החלף פרופיל / התנתק)

	// שם תצוגה ידידותי. לעולם לא להציג מזהה אוטומטי כמו "google_1164663...".
	// סדר העדפה: שם אמיתי → החלק שלפני @ באימייל → username אנושי → "משתמש".
	const AUTO_ID = /^(google|facebook|apple|community|local)[_-]/i;
	/** @param {string|null|undefined} s */
	function humanOrEmpty(s) {
		if (!s || AUTO_ID.test(s)) return "";
		return s;
	}
	let displayName = $derived.by(() => {
		const u = data?.user;
		if (!u) return "";
		const emailLocal = u.email && !AUTO_ID.test(u.email) ? u.email.split("@")[0] : "";
		return humanOrEmpty(u.name) || emailLocal || humanOrEmpty(u.username) || "משתמש";
	});
	// אות ראשונה לעיגול ה-fallback כשאין תמונת פרופיל
	let avatarInitial = $derived((displayName || "U").charAt(0).toUpperCase());

	// ברכת SSO מקהילה: מופיעה כש-?welcome=community ויש משתמש מזוהה.
	let showWelcome = $state(false);
	onMount(() => {
		if (
			$page.url.searchParams.get("welcome") === "community" &&
			data?.user
		) {
			showWelcome = true;
			// מנקה את הפרמטר מה-URL בלי לטעון מחדש
			const url = new URL(window.location.href);
			url.searchParams.delete("welcome");
			history.replaceState(history.state, "", url);
			setTimeout(() => (showWelcome = false), 6000);
		}
	});

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
		if (
			showUserMenu &&
			event.target instanceof Element &&
			!event.target.closest(".user-menu")
		) {
			showUserMenu = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

{#if showWelcome && data?.user}
	<div class="welcome-toast" role="status">
		<span class="welcome-emoji">🎉</span>
		<span>
			{$lang === "he"
				? `ברוך הבא, ${data.user.username || data.user.email}! זיהינו אותך דרך קהילת יוצאים לחירות.`
				: $lang === "ru"
					? `Добро пожаловать, ${data.user.username || data.user.email}!`
					: `Welcome, ${data.user.username || data.user.email}!`}
		</span>
		<button
			class="welcome-close"
			onclick={() => (showWelcome = false)}
			aria-label="סגור">×</button
		>
	</div>
{/if}

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
						src="/assets/קבוצות-רכישה.png"
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

				{#if data?.user}
					<div class="user-menu">
						<button
							class="login-header-btn user-menu-btn"
							onclick={() => (showUserMenu = !showUserMenu)}
							title={data.user.email || displayName}
							aria-label={displayName}
						>
							{#if data.user.avatar_url}
								<img class="user-avatar" src={data.user.avatar_url} alt="" referrerpolicy="no-referrer" />
							{:else}
								<span class="user-avatar user-avatar-fallback" aria-hidden="true">{avatarInitial}</span>
							{/if}
							{#if data.user.app_role === 'super_admin'}<span class="user-admin-badge" title="מנהל">🔑</span>{/if}
							<span class="chevron">⌄</span>
						</button>

						{#if showUserMenu}
							<div class="user-dropdown">
								<a
									class="user-dropdown-item"
									href={`/login?returnTo=${encodeURIComponent($page.url.pathname)}`}
									onclick={() => (showUserMenu = false)}
								>
									🔄 {$lang === "he"
										? "החלף פרופיל"
										: $lang === "ru"
											? "Сменить профиль"
											: "Switch profile"}
								</a>
								<a
									class="user-dropdown-item"
									href={`/auth/logout?returnTo=${encodeURIComponent($page.url.pathname)}`}
									onclick={() => (showUserMenu = false)}
								>
									🚪 {$lang === "he"
										? "התנתק"
										: $lang === "ru"
											? "Выйти"
											: "Logout"}
								</a>
							</div>
						{/if}
					</div>
				{:else}
					<a
						class="login-header-btn"
						href={`/login?returnTo=${encodeURIComponent($page.url.pathname)}`}
					>
						{$t.login}
					</a>
				{/if}
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
				href="https://gofreeil.com/"
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
	.welcome-toast {
		position: fixed;
		top: 1rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 1000;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		max-width: 90vw;
		background: linear-gradient(135deg, #16a34a, #15803d);
		color: #fff;
		padding: 0.8rem 1.1rem;
		border-radius: 12px;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
		font-weight: 600;
		font-size: 0.95rem;
		animation: welcome-in 0.35s ease;
	}
	.welcome-emoji {
		font-size: 1.3rem;
	}
	.welcome-close {
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.85);
		font-size: 1.4rem;
		line-height: 1;
		cursor: pointer;
		padding: 0 0.2rem;
	}
	@keyframes welcome-in {
		from {
			opacity: 0;
			transform: translate(-50%, -12px);
		}
		to {
			opacity: 1;
			transform: translate(-50%, 0);
		}
	}

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

	/* תפריט משתמש בהדר */
	.user-menu {
		position: relative;
	}
	.user-menu-btn {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.3rem 0.6rem;
	}
	.user-avatar {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		object-fit: cover;
		border: 1px solid var(--border-color);
		flex-shrink: 0;
		display: block;
	}
	.user-avatar-fallback {
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #facc15, #fb923c);
		color: #1a1a1a;
		font-weight: 800;
		font-size: 0.95rem;
		line-height: 1;
		border: none;
	}
	.user-admin-badge {
		font-size: 0.85rem;
		line-height: 1;
	}
	.user-dropdown {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		background: var(--bg-header);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
		display: flex;
		flex-direction: column;
		min-width: 160px;
		z-index: 1001;
		overflow: hidden;
		animation: slideDown 0.2s ease-out;
	}
	.user-dropdown-item {
		background: none;
		border: none;
		color: var(--text-white);
		padding: 0.8rem 1rem;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		cursor: pointer;
		text-align: right;
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 600;
		transition: background 0.2s, color 0.2s;
	}
	.user-dropdown-item:hover {
		background: rgba(250, 204, 21, 0.1);
		color: #facc15;
	}
</style>
