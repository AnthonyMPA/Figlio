(() => {
    const button = document.querySelector('.ordering-soon');
    if (!button) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let cleanupTimer;
    let effects;
    let shine;
    let active = false;

    function cleanup() {
        clearTimeout(cleanupTimer);
        effects?.remove();
        shine?.remove();
        effects = null;
        shine = null;
        button.classList.remove('is-celebrating');
        active = false;
    }

    button.addEventListener('click', () => {
        // Preview only: never navigate or open the reservation widget.
        // One burst at a time keeps repeated taps bounded to one short, three-burst display.
        if (active || document.hidden) return;
        active = true;
        button.classList.add('is-celebrating');

        if (!reducedMotion.matches) {
            shine = document.createElement('span');
            shine.className = 'ordering-soon-click-shine';
            button.querySelector('.ordering-soon-shimmer').append(shine);

            effects = document.createElement('div');
            effects.className = 'ordering-fireworks';
            effects.setAttribute('aria-hidden', 'true');
            const rect = button.getBoundingClientRect();
            const colors = ['#ffd36a', '#ff914d', '#fff4c5', '#4eac9c'];
            const radius = Math.min(110, window.innerWidth * 0.24);
            const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

            for (let burst = 0; burst < 3; burst++) {
                const cx = clamp(rect.left + rect.width * [0.5, 0.1, 0.85][burst], radius, innerWidth - radius);
                const cy = clamp(rect.top - [5, 75, 100][burst], radius, innerHeight - radius);
                const delay = burst * 150;

                for (const className of ['ordering-burst-ring', 'ordering-burst-flash']) {
                    const accent = document.createElement('span');
                    accent.className = className;
                    accent.style.left = `${cx}px`;
                    accent.style.top = `${cy}px`;
                    accent.style.animationDelay = `${delay}ms`;
                    effects.append(accent);
                }

                for (let i = 0; i < 20; i++) {
                    const angle = (i / 20) * Math.PI * 2 + burst * 0.3;
                    const distance = radius * (0.65 + (i % 3) * 0.17);
                    const spark = document.createElement('span');
                    spark.className = i < 2 ? 'ordering-spark ordering-spark-star' : 'ordering-spark';
                    spark.style.left = `${cx}px`;
                    spark.style.top = `${cy}px`;
                    spark.style.setProperty('--spark-x', `${Math.cos(angle) * distance}px`);
                    spark.style.setProperty('--spark-y', `${Math.sin(angle) * distance + 25}px`);
                    spark.style.setProperty('--spark-mid-x', `${Math.cos(angle) * distance * 0.75}px`);
                    spark.style.setProperty('--spark-mid-y', `${Math.sin(angle) * distance * 0.75}px`);
                    spark.style.setProperty('--spark-angle', `${angle}rad`);
                    spark.style.setProperty('--spark-color', colors[i % colors.length]);
                    spark.style.setProperty('--spark-delay', `${delay + (i % 3) * 20}ms`);
                    effects.append(spark);
                }
            }
            document.body.append(effects);
        }

        cleanupTimer = setTimeout(cleanup, 1600);
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) cleanup();
    });
    window.addEventListener('pagehide', cleanup);
})();
