document.addEventListener('DOMContentLoaded', () => {
    /* ==========================================================================
       1. WORK / EDUCATION TAB SWITCHER
       ========================================================================== */
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const targetPanel = document.getElementById(`${targetTab}-panel`);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });

    /* ==========================================================================
       2. SMOOTH SCROLLING FOR NAV LINKS
       ========================================================================== */
    const internalLinks = document.querySelectorAll('a[href^="#"]');

    internalLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            if (targetId && targetId !== '#') {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    e.preventDefault();
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    /* ==========================================================================
       3. LEETCODE HEATMAP RENDERER (VERCEL + FALLBACK PROXY)
       ========================================================================== */
    async function renderLeetCodeHeatmap(username) {
        const container = document.getElementById("leetcode-heatmap");
        if (!container) return;

        let rawCalendar = null;

        // Primary Attempt: Vercel-backed LeetCode API (High availability, no CORS issues)
        try {
            const res = await fetch(`https://leetcode-api-faisalshohag.vercel.app/${username}`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.submissionCalendar) {
                    rawCalendar = data.submissionCalendar;
                }
            }
        } catch (e) {
            console.warn("Primary API failed, trying fallback...", e);
        }

        // Secondary Attempt: Alfa LeetCode API
        if (!rawCalendar) {
            try {
                const res = await fetch(`https://alfa-leetcode-api.onrender.com/userProfileCalendar?username=${username}`);
                if (res.ok) {
                    const data = await res.json();
                    rawCalendar = data.submissionCalendar || (data.matchedUser && data.matchedUser.userCalendar && data.matchedUser.userCalendar.submissionCalendar);
                }
            } catch (e) {
                console.warn("Secondary API failed...", e);
            }
        }

        if (!rawCalendar) {
            container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem; padding: 1rem 0;">Unable to load LeetCode data.</p>`;
            return;
        }

        // Parse JSON string if necessary
        if (typeof rawCalendar === "string") {
            try {
                rawCalendar = JSON.parse(rawCalendar);
            } catch (e) {
                rawCalendar = {};
            }
        }

        // Normalize timestamps to YYYY-MM-DD
        const submissionMap = {};
        Object.keys(rawCalendar).forEach((ts) => {
            let tsNum = parseInt(ts, 10);
            if (!isNaN(tsNum)) {
                if (tsNum < 10000000000) tsNum *= 1000;
                const dateStr = new Date(tsNum).toISOString().split("T")[0];
                submissionMap[dateStr] = (submissionMap[dateStr] || 0) + Number(rawCalendar[ts]);
            }
        });

        container.innerHTML = "";
        const grid = document.createElement("div");
        grid.className = "lc-calendar-grid";

        // Build grid for past 364 days
        const today = new Date();
        for (let i = 363; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateKey = d.toISOString().split("T")[0];
            const count = submissionMap[dateKey] || 0;

            const square = document.createElement("div");
            square.className = "lc-square";

            if (count > 0 && count <= 2) square.classList.add("level-1");
            else if (count > 2 && count <= 5) square.classList.add("level-2");
            else if (count > 5) square.classList.add("level-3");

            square.title = `${count} submission${count === 1 ? '' : 's'} on ${dateKey}`;
            grid.appendChild(square);
        }

        container.appendChild(grid);
    }

    renderLeetCodeHeatmap("devangsdev");
});