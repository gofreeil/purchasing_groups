<script>
    import { onMount } from "svelte";
    import { tweened } from "svelte/motion";
    import { cubicOut } from "svelte/easing";
    import { lang, t } from "$lib/i18n.js";

    // הגדר כאן את מספר החברים הנוכחי בקבוצה
    let targetCount = 475;
    const count = tweened(0, {
        duration: 2500, // הגדלת זמן הספירה כדי שתמשיך גם אחרי הטעינה
        easing: cubicOut,
    });

    onMount(() => {
        count.set(targetCount);
    });
</script>

<svelte:head>
    <title>{$t.homepage.title}</title>
</svelte:head>

<div class="top-content">
    <div class="video-container-large">
        <iframe
            src="https://www.youtube.com/embed/pl7kV6-aTEw"
            title="YouTube video player"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
        ></iframe>
    </div>

    <div class="feature-box">
        <ul class="feature-list">
            {#each $t.homepage.features as feature}
                <li>
                    <span class="check">{feature.icon}</span>
                    {feature.text}
                </li>
            {/each}
        </ul>
    </div>
</div>

<div class="whatsapp-counter-final">
    <div class="counter-merge-wrapper fly-in-right">
        <div class="count-big-number">{Math.floor($count)}</div>
        <div class="count-label-text">
            {$t.homepage.membersCount}
        </div>
    </div>
</div>

<div class="section-title">
    <h2>{$t.homepage.ourPurchases}</h2>
</div>

<div class="purchases-list">
    <!-- Cellular -->
    <div class="purchase-card">
        <img
            src="/assets/cellular.jpg"
            alt={$t.purchases.cellular.alt}
            class="purchase-img"
        />
        <div class="purchase-info">
            <h3>
                <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLSfRCs5W7HUuc5vcOuMGqsqaDubzNBn4YuC4UDbvoFmSCdJAiQ/viewform?usp=header"
                    target="_blank">{$t.purchases.cellular.title}</a
                >
            </h3>
            <p>
                {$t.purchases.cellular.desc}
            </p>
        </div>
        <div class="purchase-status">
            <span class="status-label">{$t.purchases.status}</span>
            <span class="status-value" style="color: #4ade80;"
                >{$t.purchases.done}</span
            >
            <span class="status-label">{$t.purchases.canJoin}</span>
            <span class="status-value">{$t.purchases.yes}</span>
            <span class="status-label">{$t.purchases.saved}</span>
            <span class="status-value savings"
                >7,275 {$t.purchases.currencyPerYear}</span
            >
        </div>
    </div>

    <!-- Internet -->
    <div class="purchase-card">
        <img
            src="/assets/internet.jpg"
            alt={$t.purchases.internet.alt}
            class="purchase-img"
        />
        <div class="purchase-info">
            <h3>{$t.purchases.internet.title}</h3>
            <p>{$t.purchases.internet.desc}</p>
        </div>
        <div class="purchase-status">
            <span class="status-label">{$t.purchases.status}</span>
            <span class="status-value">{$t.purchases.no}</span>
            <span class="status-label">{$t.purchases.canJoin}</span>
            <span class="status-value" style="color: #facc15;"
                >{$t.purchases.soon}</span
            >
        </div>
    </div>

    <!-- Fuel -->
    <div class="purchase-card">
        <img
            src="/assets/fuel.jpg"
            alt={$t.purchases.fuel.alt}
            class="purchase-img"
        />
        <div class="purchase-info">
            <h3>{$t.purchases.fuel.title}</h3>
            <p>{$t.purchases.fuel.desc}</p>
        </div>
        <div class="purchase-status">
            <span class="status-label">{$t.purchases.status}</span>
            <span class="status-value">{$t.purchases.no}</span>
            <span class="status-label">{$t.purchases.canJoin}</span>
            <span class="status-value">{$t.purchases.no}</span>
        </div>
    </div>

    <!-- Car Insurance -->
    <div class="purchase-card">
        <img
            src="/assets/car_insurance.png"
            alt={$t.purchases.carInsurance.alt}
            class="purchase-img"
        />
        <div class="purchase-info">
            <h3>{$t.purchases.carInsurance.title}</h3>
            <p>{$t.purchases.carInsurance.desc}</p>
        </div>
        <div class="purchase-status">
            <span class="status-label">{$t.purchases.status}</span>
            <span class="status-value">{$t.purchases.no}</span>
            <span class="status-label">{$t.purchases.canJoin}</span>
            <span class="status-value">{$t.purchases.no}</span>
        </div>
    </div>

    <!-- Electricity -->
    <div class="purchase-card">
        <img
            src="/assets/electricity.jpg"
            alt={$t.purchases.electricity.alt}
            class="purchase-img"
        />
        <div class="purchase-info">
            <h3>{$t.purchases.electricity.title}</h3>
            <p>{$t.purchases.electricity.desc}</p>
        </div>
        <div class="purchase-status">
            <span class="status-label">{$t.purchases.status}</span>
            <span class="status-value">{$t.purchases.no}</span>
            <span class="status-label">{$t.purchases.canJoin}</span>
            <span class="status-value">{$t.purchases.no}</span>
        </div>
    </div>

    <!-- Coupons -->
    <div class="purchase-card">
        <img
            src="/assets/coupons.jpg"
            alt={$t.purchases.coupons.alt}
            class="purchase-img"
        />
        <div class="purchase-info">
            <h3>{$t.purchases.coupons.title}</h3>
            <p>{$t.purchases.coupons.desc}</p>
        </div>
        <div class="purchase-status">
            <span class="status-label">{$t.purchases.status}</span>
            <span class="status-value">{$t.purchases.no}</span>
            <span class="status-label">{$t.purchases.canJoin}</span>
            <span class="status-value">{$t.purchases.no}</span>
        </div>
    </div>
</div>

<div class="section-title" style="margin-top: 5rem;">
    <h2
        style="font-size: 1.8rem; font-family: 'Assistant', sans-serif; background: none; -webkit-text-fill-color: #facc15;"
    >
        {$t.homepage.nextPurchases}
    </h2>
</div>
