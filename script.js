const LANGUAGE_STORAGE_KEY = "studios-kalliopi-language";
const DEFAULT_LANGUAGE = "el";
const translations = window.SITE_TRANSLATIONS || {};

const yearTarget = document.querySelector("#year");
const body = document.body;
const menuPanel = document.querySelector("#site-menu");
const menuToggle = document.querySelector(".menu-toggle");
const menuClose = document.querySelector(".menu-close");
const menuLinks = document.querySelectorAll(".menu-nav a");
const revealItems = document.querySelectorAll(".reveal");
const staggerGroups = document.querySelectorAll(".stagger-group");
const parallaxItems = document.querySelectorAll("[data-parallax]");
const scrollShiftItems = document.querySelectorAll("[data-scroll-shift]");
const inertRoots = document.querySelectorAll("#main-content, .site-footer, .mobile-bookbar");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const compactMotionQuery = window.matchMedia("(max-width: 900px)");
const translatableTextNodes = document.querySelectorAll("[data-i18n]");
const translatableAriaNodes = document.querySelectorAll("[data-i18n-aria-label]");
const translatableAltNodes = document.querySelectorAll("[data-i18n-alt]");
const translatableMetaNodes = document.querySelectorAll("[data-i18n-content]");
const languageButtons = document.querySelectorAll(".language-switcher__button");
const pageLinks = document.querySelectorAll("a[href$='.html']");
const greekUppercaseTargets = document.querySelectorAll(
  "h1, h2, h3, h4, h5, h6, .section-label, .quote-card strong, .detail-list strong, .brand__title, .menu-nav a, .page-hero__panel p, .hero__card p, blockquote"
);

let lastFocusedElement = null;
let ticking = false;

const normalizePage = (value) => {
  if (!value || value === "/") {
    return "index.html";
  }

  const cleaned = value.split("#")[0].split("?")[0];
  const normalized = cleaned.split("/").pop();
  return normalized && normalized.length > 0 ? normalized : "index.html";
};

const currentPage = normalizePage(window.location.pathname);

if (yearTarget) {
  yearTarget.textContent = new Date().getFullYear();
}

const prefersReducedMotion = () => reducedMotionQuery.matches;
const prefersCompactMotion = () => compactMotionQuery.matches;

const resetScrollEffectStyles = () => {
  parallaxItems.forEach((item) => item.style.setProperty("--parallax-y", "0px"));
  scrollShiftItems.forEach((item) => item.style.setProperty("--scroll-shift", "0px"));
};

const focusableMenuElements = () =>
  menuPanel
    ? [...menuPanel.querySelectorAll("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])")]
    : [];

const setRootsInert = (value) => {
  inertRoots.forEach((root) => {
    if ("inert" in root) {
      root.inert = value;
    }

    if (value) {
      root.setAttribute("aria-hidden", "true");
    } else {
      root.removeAttribute("aria-hidden");
    }
  });
};

const getStoredLanguage = () => {
  try {
    const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return storedLanguage && translations[storedLanguage] ? storedLanguage : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
};

const storeLanguage = (language) => {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    return;
  }
};

const syncLanguageButtons = (language) => {
  languageButtons.forEach((button) => {
    const isActive = button.dataset.lang === language;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
};

const syncCurrentPageLinks = () => {
  pageLinks.forEach((link) => {
    const isCurrent = normalizePage(link.getAttribute("href")) === currentPage;

    if (isCurrent) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

const stripDiacritics = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const applyGreekUppercase = (language) => {
  if (language !== "el") {
    return;
  }

  greekUppercaseTargets.forEach((node) => {
    const text = node.textContent;

    if (!text) {
      return;
    }

    node.textContent = stripDiacritics(text).toUpperCase();
  });
};

const applyLanguage = (requestedLanguage, persist = true) => {
  const language = translations[requestedLanguage] ? requestedLanguage : DEFAULT_LANGUAGE;
  const copy = translations[language];

  if (!copy) {
    return;
  }

  document.documentElement.lang = language;
  const pageTitleKey = body.dataset.pageTitleKey;
  const resolvedTitle = (pageTitleKey && copy.meta?.[pageTitleKey]) || copy.title;

  if (typeof resolvedTitle === "string") {
    document.title = resolvedTitle;
  }

  body.dataset.language = language;

  translatableTextNodes.forEach((node) => {
    const key = node.dataset.i18n;
    const value = copy.text?.[key];

    if (typeof value === "string") {
      node.textContent = value;
    }
  });

  translatableAriaNodes.forEach((node) => {
    const key = node.dataset.i18nAriaLabel;
    const value = copy.aria?.[key];

    if (typeof value === "string") {
      node.setAttribute("aria-label", value);
    }
  });

  translatableAltNodes.forEach((node) => {
    const key = node.dataset.i18nAlt;
    const value = copy.alt?.[key];

    if (typeof value === "string") {
      node.setAttribute("alt", value);
    }
  });

  translatableMetaNodes.forEach((node) => {
    const key = node.dataset.i18nContent;
    const value = copy.meta?.[key];

    if (typeof value === "string") {
      node.setAttribute("content", value);
    }
  });

  syncLanguageButtons(language);
  applyGreekUppercase(language);

  if (persist) {
    storeLanguage(language);
  }
};

const onMenuKeydown = (event) => {
  if (!menuPanel?.classList.contains("is-open")) {
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    closeMenu();
    return;
  }

  if (event.key !== "Tab") {
    return;
  }

  const elements = focusableMenuElements();

  if (elements.length === 0) {
    event.preventDefault();
    return;
  }

  const first = elements[0];
  const last = elements[elements.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};

function openMenu() {
  if (!menuPanel || !menuToggle) {
    return;
  }

  lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : menuToggle;
  menuPanel.classList.add("is-open");
  menuPanel.setAttribute("aria-hidden", "false");
  menuToggle.setAttribute("aria-expanded", "true");
  body.classList.add("menu-open");
  setRootsInert(true);
  document.addEventListener("keydown", onMenuKeydown);
  window.requestAnimationFrame(() => menuClose?.focus());
}

function closeMenu() {
  if (!menuPanel || !menuToggle) {
    return;
  }

  menuPanel.classList.remove("is-open");
  menuPanel.setAttribute("aria-hidden", "true");
  menuToggle.setAttribute("aria-expanded", "false");
  body.classList.remove("menu-open");
  setRootsInert(false);
  document.removeEventListener("keydown", onMenuKeydown);

  if (lastFocusedElement instanceof HTMLElement) {
    lastFocusedElement.focus();
  }
}

menuToggle?.addEventListener("click", openMenu);
menuClose?.addEventListener("click", closeMenu);
menuPanel?.addEventListener("click", (event) => {
  if (event.target === menuPanel) {
    closeMenu();
  }
});

menuLinks.forEach((link) => link.addEventListener("click", closeMenu));
languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyLanguage(button.dataset.lang);
  });
});

const activateGroup = (group) => {
  group.querySelectorAll(".stagger-item").forEach((item, index) => {
    item.style.transitionDelay = `${index * 110}ms`;
    item.classList.add("is-visible");
  });
};

const observeSections = () => {
  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    staggerGroups.forEach((group) => activateGroup(group));
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: "0px 0px -10% 0px",
      threshold: 0.12,
    }
  );

  const staggerObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activateGroup(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.1,
    }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
  staggerGroups.forEach((group) => staggerObserver.observe(group));
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const updateScrollEffects = () => {
  body.classList.toggle("scrolled", window.scrollY > 18);

  if (prefersReducedMotion() || prefersCompactMotion()) {
    resetScrollEffectStyles();
    return;
  }

  const viewportHeight = window.innerHeight;

  parallaxItems.forEach((item) => {
    const rect = item.getBoundingClientRect();
    const speed = Number(item.dataset.parallax || 0);
    const center = rect.top + rect.height / 2;
    const shift = (viewportHeight / 2 - center) * speed;
    item.style.setProperty("--parallax-y", `${shift.toFixed(2)}px`);
  });

  scrollShiftItems.forEach((item) => {
    const trigger = item.closest(".hero") || item;
    const rect = trigger.getBoundingClientRect();
    const amount = Number(item.dataset.scrollShift || 0);
    const progress = clamp((0 - rect.top) / Math.max(rect.height * 0.85, 1), 0, 1);
    item.style.setProperty("--scroll-shift", `${(amount * progress).toFixed(2)}px`);
  });
};

const requestScrollUpdate = () => {
  if (ticking) {
    return;
  }

  ticking = true;
  window.requestAnimationFrame(() => {
    updateScrollEffects();
    ticking = false;
  });
};

applyLanguage(getStoredLanguage(), false);
syncCurrentPageLinks();
observeSections();
updateScrollEffects();

window.addEventListener("scroll", requestScrollUpdate, { passive: true });
window.addEventListener("resize", requestScrollUpdate);
window.addEventListener("load", requestScrollUpdate);

const onReducedMotionChange = () => {
  observeSections();
  updateScrollEffects();
};

if (typeof reducedMotionQuery.addEventListener === "function") {
  reducedMotionQuery.addEventListener("change", onReducedMotionChange);
} else if (typeof reducedMotionQuery.addListener === "function") {
  reducedMotionQuery.addListener(onReducedMotionChange);
}

if (typeof compactMotionQuery.addEventListener === "function") {
  compactMotionQuery.addEventListener("change", onReducedMotionChange);
} else if (typeof compactMotionQuery.addListener === "function") {
  compactMotionQuery.addListener(onReducedMotionChange);
}
