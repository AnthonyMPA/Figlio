(() => {
    let timer;

    function updateYear() {
        const now = new Date();
        document.querySelectorAll('[data-copyright-year]').forEach((element) => {
            element.textContent = now.getFullYear();
        });

        // Refresh at midnight, including when the page stays open on New Year's Eve.
        const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        clearTimeout(timer);
        timer = setTimeout(updateYear, nextMidnight.getTime() - now.getTime());
    }

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) updateYear();
    });

    updateYear();
})();
