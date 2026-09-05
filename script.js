document.addEventListener('DOMContentLoaded', () => {
    // Track whether we successfully loaded data so we don't clobber defaults on error.
    let appData = null;

    initBaseUI();
    loadData();

    async function loadData() {
        try {
            const response = await fetch('data.json', { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`Failed to load data.json: ${response.status} ${response.statusText}`);
            }
            appData = await response.json();
            renderAll(appData);
            initAnalytics(appData.analytics || {});
        } catch (error) {
            console.warn('Could not load dynamic data. Falling back to static defaults.', error);
            initAnalytics({});
        }
    }

    function renderAll(data) {
        document.title = data.site?.title || document.title;
        const descriptionMeta = document.querySelector('meta[name="description"]');
        if (descriptionMeta && data.site?.description) {
            descriptionMeta.setAttribute('content', data.site.description);
        }
        if (data.site?.language) {
            document.documentElement.setAttribute('lang', data.site.language);
        }

        renderUI(data.ui);
        renderNavigation(data.navigation);
        renderHero(data.hero);
        renderCoverLetter(data.coverLetter);
        renderSummary(data.summary);
        renderSkills(data.skills);
        renderExperience(data.experience);
        renderProjects(data.projects);
        renderEducation(data.education);
        renderContact(data.contact);
        renderFooter(data.footer);
        renderAnalyticsBadge(data.analytics);
    }

    function renderUI(ui) {
        if (!ui) return;

        if (ui.themeToggle) {
            setAttribute('themeToggle', 'aria-label', ui.themeToggle.ariaLabel);
            setText('themeToggleLight', ui.themeToggle.lightLabel);
            setText('themeToggleDark', ui.themeToggle.darkLabel);
        }

        if (ui.navToggle) {
            setAttribute('navToggle', 'aria-label', ui.navToggle.ariaLabel);
        }

        if (ui.backToTop) {
            setAttribute('backToTop', 'aria-label', ui.backToTop.ariaLabel);
            setText('backToTopText', ui.backToTop.text);
        }
    }

    function renderAnalyticsBadge(analytics) {
        if (analytics?.badgeTitle) {
            setAttribute('analyticsBadge', 'title', analytics.badgeTitle);
        }
    }

    // ---------- Rendering helpers ----------

    function renderNavigation(nav) {
        if (!nav) return;
        const logoMark = document.getElementById('logoMark');
        const logoText = document.getElementById('logoText');
        if (logoMark && nav.logo?.mark) logoMark.textContent = nav.logo.mark;
        if (logoText && nav.logo?.text) logoText.textContent = nav.logo.text;

        const navLinks = document.getElementById('navLinks');
        if (navLinks && nav.links) {
            navLinks.innerHTML = nav.links.map(link =>
                `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`
            ).join('');

            // Re-attach mobile close behavior since links were recreated
            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => navLinks.classList.remove('active'));
            });
            // Re-attach active scroll observer for new links
            initActiveNavObserver();
        }
    }

    function renderHero(hero) {
        if (!hero) return;
        setText('heroGreeting', hero.greeting);
        setText('heroName', hero.name);

        const heroContact = document.getElementById('heroContact');
        if (heroContact && hero.contact) {
            heroContact.innerHTML = hero.contact.map((item, index, arr) => {
                const separator = index < arr.length - 1 ? `<span class="separator">|</span>` : '';
                return `
                    <a href="${escapeHtml(item.href)}" target="${item.type === 'location' ? '_blank' : '_self'}" rel="${item.type === 'location' ? 'noopener' : ''}">
                        <span class="icon" aria-hidden="true">${escapeHtml(item.label)}</span> ${escapeHtml(item.text)}
                    </a>
                    ${separator}
                `;
            }).join('');
        }

        const heroActions = document.getElementById('heroActions');
        if (heroActions && hero.actions) {
            heroActions.innerHTML = hero.actions.map(action => renderHeroAction(action)).join('');
        }

        if (hero.typewriterPhrases) {
            startTypewriter(hero.typewriterPhrases);
        }
    }

    function renderHeroAction(action) {
        const classes = {
            primary: 'btn-primary',
            secondary: 'btn-secondary',
            ghost: 'btn-ghost'
        };
        const className = classes[action.type] || 'btn-primary';

        if (action.action === 'print') {
            return `<button class="${className}" id="printResume">${escapeHtml(action.label)}</button>`;
        }

        const isExternal = action.href && (action.href.startsWith('http') || action.href.startsWith('//'));
        const target = isExternal ? 'target="_blank" rel="noopener"' : '';
        return `<a href="${escapeHtml(action.href || '#')}" class="${className}" ${target}>${escapeHtml(action.label)}</a>`;
    }

    function renderCoverLetter(letter) {
        if (!letter) return;
        setText('coverLetterTag', letter.sectionTag);
        setText('coverLetterTitle', letter.sectionTitle);

        const body = document.getElementById('coverLetterBody');
        if (!body) return;

        const paragraphs = (letter.paragraphs || []).map(p => `<p>${p}</p>`).join('');
        const signoff = letter.signoff ? `
            <div class="letter-signoff">
                <p>${escapeHtml(letter.signoff.label)}</p>
                <p><strong>${escapeHtml(letter.signoff.name)}</strong><br>
                ${escapeHtml(letter.signoff.title)}<br>
                ${escapeHtml(letter.signoff.phone)} | ${escapeHtml(letter.signoff.email)}<br>
                <a href="${escapeHtml(letter.signoff.linkedin?.href)}" target="_blank" rel="noopener">${escapeHtml(letter.signoff.linkedin?.text)}</a></p>
            </div>
        ` : '';

        body.innerHTML = `<p class="letter-intro">${escapeHtml(letter.intro)}</p>${paragraphs}${signoff}`;
    }

    function renderSummary(summary) {
        if (!summary) return;
        setText('summaryTag', summary.sectionTag);
        setText('summaryTitle', summary.sectionTitle);

        const grid = document.getElementById('summaryGrid');
        if (grid && summary.stats) {
            grid.innerHTML = summary.stats.map(stat => `
                <div class="summary-card">
                    <span class="summary-number">${escapeHtml(stat.value)}</span>
                    <span class="summary-label">${escapeHtml(stat.label)}</span>
                </div>
            `).join('');
        }

        const text = document.getElementById('summaryText');
        if (text && summary.paragraphs) {
            text.innerHTML = summary.paragraphs.map(p => `<p>${p}</p>`).join('');
        }
    }

    function renderSkills(skills) {
        if (!skills) return;
        setText('skillsTag', skills.sectionTag);
        setText('skillsTitle', skills.sectionTitle);

        const grid = document.getElementById('skillsGrid');
        if (grid && skills.categories) {
            grid.innerHTML = skills.categories.map(cat => `
                <div class="skill-card">
                    <div class="skill-icon">${escapeHtml(cat.icon)}</div>
                    <h3>${escapeHtml(cat.title)}</h3>
                    <div class="skill-tags">
                        ${cat.tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}
                    </div>
                </div>
            `).join('');
        }
    }

    function renderExperience(experience) {
        if (!experience) return;
        setText('experienceTag', experience.sectionTag);
        setText('experienceTitle', experience.sectionTitle);

        const timeline = document.getElementById('experienceTimeline');
        if (timeline && experience.jobs) {
            timeline.innerHTML = experience.jobs.map(job => {
                const responsibilities = (job.responsibilities || []).map(r => `<li>${r}</li>`).join('');
                const keyProjects = job.keyProjects?.length
                    ? `<p class="projects"><strong>${escapeHtml(job.keyProjectsLabel || 'Key Projects:')}</strong> ${job.keyProjects.map(escapeHtml).join(', ')}</p>`
                    : '';
                return `
                    <div class="job">
                        <div class="job-header">
                            <h3>${escapeHtml(job.title)}</h3>
                            <span class="company">${escapeHtml(job.company)}</span>
                            <span class="duration">${escapeHtml(job.duration)}</span>
                        </div>
                        <ul>${responsibilities}</ul>
                        ${keyProjects}
                    </div>
                `;
            }).join('');
        }
    }

    function renderProjects(projects) {
        if (!projects) return;
        setText('projectsTag', projects.sectionTag);
        setText('projectsTitle', projects.sectionTitle);

        const grid = document.getElementById('projectsGrid');
        if (grid && projects.items) {
            grid.innerHTML = projects.items.map(project => `
                <article class="project-card">
                    <div class="project-meta">${escapeHtml(project.company)}</div>
                    <h3>${escapeHtml(project.title)}</h3>
                    <p>${escapeHtml(project.description)}</p>
                    <div class="project-tags">
                        ${project.tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}
                    </div>
                </article>
            `).join('');
        }
    }

    function renderEducation(education) {
        if (!education) return;
        setText('educationTag', education.sectionTag);
        setText('educationTitle', education.sectionTitle);

        const grid = document.getElementById('educationGrid');
        if (grid && education.degrees) {
            grid.innerHTML = education.degrees.map(degree => `
                <div class="edu-card">
                    <h3>${escapeHtml(degree.title)}</h3>
                    <p>${escapeHtml(degree.institution)}</p>
                </div>
            `).join('');
        }

        const certs = document.getElementById('certifications');
        if (certs && education.certifications) {
            certs.innerHTML = `
                <h3>${escapeHtml(education.certificationsLabel || 'Certifications')}</h3>
                <ul>
                    ${education.certifications.map(cert => `<li>${escapeHtml(cert)}</li>`).join('')}
                </ul>
            `;
        }
    }

    function renderContact(contact) {
        if (!contact) return;
        setText('contactTag', contact.sectionTag);
        setText('contactTitle', contact.sectionTitle);
        setText('contactIntro', contact.intro);

        const methods = document.getElementById('contactMethods');
        if (methods && contact.methods) {
            methods.innerHTML = contact.methods.map(method => {
                if (method.href) {
                    const isExternal = method.href.startsWith('http') || method.href.startsWith('//');
                    const target = isExternal ? 'target="_blank" rel="noopener"' : '';
                    return `
                        <a href="${escapeHtml(method.href)}" class="contact-method" ${target}>
                            <span class="method-label">${escapeHtml(method.label)}</span>
                            <span class="method-value">${escapeHtml(method.value)}</span>
                        </a>
                    `;
                }
                return `
                    <div class="contact-method">
                        <span class="method-label">${escapeHtml(method.label)}</span>
                        <span class="method-value">${escapeHtml(method.value)}</span>
                    </div>
                `;
            }).join('');
        }

        const form = contact.form;
        if (form) {
            setText('formNameLabel', form.nameLabel);
            setAttribute('name', 'placeholder', form.namePlaceholder);
            setText('formEmailLabel', form.emailLabel);
            setAttribute('email', 'placeholder', form.emailPlaceholder);
            setText('formMessageLabel', form.messageLabel);
            setAttribute('message', 'placeholder', form.messagePlaceholder);
            setText('formSubmit', form.submitLabel);
            setText('formNote', form.note);

            initContactForm(form);
        }
    }

    function renderFooter(footer) {
        if (!footer) return;
        setText('footerCopyright', footer.copyright);
        setText('analyticsLabel', footer.analyticsLabel || 'Page Views:');

        const links = document.getElementById('footerLinks');
        if (links && footer.links) {
            links.innerHTML = footer.links.map(link => {
                const isExternal = link.href.startsWith('http') || link.href.startsWith('//');
                const target = isExternal ? 'target="_blank" rel="noopener"' : '';
                return `<a href="${escapeHtml(link.href)}" ${target}>${escapeHtml(link.label)}</a>`;
            }).join('');
        }
    }

    // ---------- Utilities ----------

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el && value !== undefined && value !== null) {
            el.textContent = value;
        }
    }

    function setAttribute(id, attr, value) {
        const el = document.getElementById(id);
        if (el && value !== undefined && value !== null) {
            el.setAttribute(attr, value);
        }
    }

    function escapeHtml(text) {
        if (text === undefined || text === null) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // ---------- Base UI (runs immediately) ----------

    function initBaseUI() {
        // Dynamic year
        document.getElementById('year').textContent = new Date().getFullYear();

        // Scroll reveal
        const sections = document.querySelectorAll('.section');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });

        sections.forEach(section => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(24px)';
            section.style.transition = 'opacity 0.7s ease-out, transform 0.7s ease-out';
            observer.observe(section);
        });

        // Mobile nav toggle
        const navToggle = document.getElementById('navToggle');
        const navLinks = document.getElementById('navLinks');

        if (navToggle && navLinks) {
            navToggle.addEventListener('click', () => {
                navLinks.classList.toggle('active');
            });
        }

        initActiveNavObserver();

        // Scroll progress bar
        const scrollProgress = document.getElementById('scrollProgress');
        window.addEventListener('scroll', () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (scrollTop / docHeight) * 100;
            scrollProgress.style.width = `${progress}%`;
        });

        // Back to top button
        const backToTop = document.getElementById('backToTop');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });

        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        const html = document.documentElement;
        const savedTheme = localStorage.getItem('theme') || 'light';
        html.setAttribute('data-theme', savedTheme);

        themeToggle.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });

        // Print resume (delegation in case button is rendered dynamically)
        document.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'printResume') {
                window.print();
            }
        });
    }

    function initActiveNavObserver() {
        const navItems = document.querySelectorAll('.nav-links a');
        if (!navItems.length) return;

        const sections = document.querySelectorAll('.section');
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    navItems.forEach(item => {
                        item.classList.remove('active');
                        if (item.getAttribute('href') === `#${entry.target.id}`) {
                            item.classList.add('active');
                        }
                    });
                }
            });
        }, { threshold: 0.3 });

        sections.forEach(section => sectionObserver.observe(section));
    }

    function startTypewriter(phrases) {
        const typewriter = document.getElementById('typewriter');
        if (!typewriter || !phrases || !phrases.length) return;

        let phraseIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let typeSpeed = 100;

        function type() {
            const currentPhrase = phrases[phraseIndex];

            if (isDeleting) {
                typewriter.textContent = currentPhrase.substring(0, charIndex - 1);
                charIndex--;
                typeSpeed = 40;
            } else {
                typewriter.textContent = currentPhrase.substring(0, charIndex + 1);
                charIndex++;
                typeSpeed = 100;
            }

            if (!isDeleting && charIndex === currentPhrase.length) {
                isDeleting = true;
                typeSpeed = 1800;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                phraseIndex = (phraseIndex + 1) % phrases.length;
                typeSpeed = 400;
            }

            setTimeout(type, typeSpeed);
        }

        setTimeout(type, 600);
    }

    function initContactForm(formConfig) {
        const contactForm = document.getElementById('contactForm');
        const formNote = document.getElementById('formNote');
        if (!contactForm) return;

        // Remove old listeners by cloning (in case renderContact is called multiple times)
        const newForm = contactForm.cloneNode(true);
        contactForm.parentNode.replaceChild(newForm, contactForm);

        newForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = newForm.querySelector('#name').value;
            const email = newForm.querySelector('#email').value;
            const message = newForm.querySelector('#message').value;

            const subject = encodeURIComponent((formConfig.subject || 'Opportunity from {{name}}').replace('{{name}}', name));
            const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
            window.location.href = `mailto:${formConfig.recipient || 'munishahmad@gmail.com'}?subject=${subject}&body=${body}`;

            const noteEl = newForm.querySelector('#formNote');
            noteEl.textContent = formConfig.sendingNote || 'Opening your email client...';
            noteEl.style.color = 'var(--accent)';
            newForm.reset();

            setTimeout(() => {
                noteEl.textContent = formConfig.note || 'This form is for demonstration. It will open your email client.';
                noteEl.style.color = '';
            }, 3000);
        });
    }

    // ---------- Analytics ----------

    function initAnalytics(analyticsConfig) {
        analyticsConfig = analyticsConfig || {};

        // 1. Google Analytics 4 page_view
        const gaId = analyticsConfig.googleAnalyticsId;
        if (gaId && gaId !== 'G-XXXXXXXXXX') {
            loadGoogleAnalytics(gaId).then(() => {
                if (typeof gtag === 'function') {
                    gtag('config', gaId, { page_title: document.title, page_location: location.href });
                }
            });
        }

        // 2. Visible counter: try a free counter API, fall back to local session counter
        updateVisibleCounter(analyticsConfig);
    }

    function loadGoogleAnalytics(gaId) {
        return new Promise((resolve) => {
            if (typeof gtag === 'function') {
                resolve();
                return;
            }

            window.dataLayer = window.dataLayer || [];
            window.gtag = function() {
                window.dataLayer.push(arguments);
            };
            window.gtag('js', new Date());

            const script = document.createElement('script');
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
            script.onload = resolve;
            script.onerror = () => {
                console.warn('Failed to load Google Analytics script.');
                resolve();
            };
            document.head.appendChild(script);
        });
    }

    async function updateVisibleCounter(config) {
        const counterEl = document.getElementById('pageViewCount');
        if (!counterEl) return;

        const namespace = config.counterApiNamespace || 'munish-profile';
        const key = config.counterApiKey || 'visits';

        try {
            const response = await fetch(`https://api.counterapi.dev/v1/${encodeURIComponent(namespace)}/${encodeURIComponent(key)}/up`, {
                method: 'GET',
                mode: 'cors'
            });
            if (!response.ok) throw new Error('Counter API error');
            const data = await response.json();
            if (typeof data.value === 'number') {
                counterEl.textContent = formatCount(data.value);
                return;
            }
        } catch (error) {
            console.warn('Counter API unavailable, using local fallback.', error);
        }

        // Fallback: per-browser local counter
        let localCount = parseInt(localStorage.getItem('profile_local_visits') || '0', 10);
        if (!sessionStorage.getItem('profile_session_counted')) {
            localCount += 1;
            localStorage.setItem('profile_local_visits', localCount);
            sessionStorage.setItem('profile_session_counted', 'true');
        }
        counterEl.textContent = `${formatCount(localCount)} (local)`;
    }

    function formatCount(num) {
        if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
        if (num >= 1_000) return (num / 1_000).toFixed(1) + 'k';
        return num.toString();
    }
});
