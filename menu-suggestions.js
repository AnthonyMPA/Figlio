(() => {
    const section = document.querySelector('.menu-social-section');
    if (!section) return;

    let typingTimer;
    let letters = [];
    const title = document.getElementById('menu-social-title');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function finishTyping() {
        clearTimeout(typingTimer);
        title.classList.remove('is-typing');
        title.querySelector('.is-current')?.classList.remove('is-current');
    }

    function startTyping() {
        if (reducedMotion.matches) return;
        // Retain every letter's space, line breaks and the question mark's font.
        // Assistive technology receives the complete title from the start.
        title.setAttribute('aria-label', title.textContent.trim());
        const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
        const textNodes = [];
        while (walker.nextNode()) textNodes.push(walker.currentNode);
        textNodes.forEach(node => {
            const fragment = document.createDocumentFragment();
            for (const character of node.textContent) {
                const letter = document.createElement('span');
                letter.className = 'menu-social-letter';
                letter.setAttribute('aria-hidden', 'true');
                letter.textContent = character;
                letters.push(letter);
                fragment.append(letter);
            }
            node.replaceWith(fragment);
        });
        title.classList.add('is-typing');
        let index = 0;
        function typeNext() {
            if (document.hidden || reducedMotion.matches || index === letters.length) {
                finishTyping();
                return;
            }
            if (index > 0) letters[index - 1].classList.remove('is-current');
            const letter = letters[index++];
            letter.classList.add('is-revealed', 'is-current');
            typingTimer = setTimeout(typeNext, letter.textContent === ' ' ? 65 : 48);
        }
        typingTimer = setTimeout(typeNext, 250);
    }
    // Run once when the inline section first comes into view.
    const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
            observer.disconnect();
            startTyping();
        }
    }, { threshold: 0.3 });
    observer.observe(section);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) finishTyping();
    });
    window.addEventListener('pagehide', finishTyping);
    reducedMotion.addEventListener('change', () => {
        if (reducedMotion.matches) finishTyping();
    });
})();
