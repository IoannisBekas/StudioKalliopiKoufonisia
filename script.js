const LANGUAGE_STORAGE_KEY = "studios-kalliopi-language";
const DEFAULT_LANGUAGE = "el";
const translations = window.SITE_TRANSLATIONS || {};

const yearTarget = document.querySelector("#year");
const body = document.body;
const menuPanel = document.querySelector("#site-menu");
const menuToggle = document.querySelector(".menu-toggle");
const menuClose = document.querySelector(".menu-close");
const menuLinks = document.querySelectorAll(".menu-nav a");
const inertRoots = document.querySelectorAll(".site-header, #main-content, .site-footer, .mobile-bookbar");
const translatableTextNodes = document.querySelectorAll("[data-i18n]");
const translatableAriaNodes = document.querySelectorAll("[data-i18n-aria-label]");
const translatableAltNodes = document.querySelectorAll("[data-i18n-alt]");
const translatableMetaNodes = document.querySelectorAll("[data-i18n-content]");
const languageButtons = document.querySelectorAll(".language-switcher__button");
const pageLinks = document.querySelectorAll("a[href$='.html']");
const roomButtons = [...document.querySelectorAll("[data-room-target]")];
const roomPanels = [...document.querySelectorAll("[data-room-panel]")];

let lastFocusedElement = null;

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

const getRequestedLanguage = () => {
  const queryLanguage = new URLSearchParams(window.location.search).get("lang");

  if (queryLanguage && translations[queryLanguage]) {
    return queryLanguage;
  }

  return getStoredLanguage();
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

const toGreekUppercase = (value) =>
  value
    .toLocaleUpperCase("el-GR")
    .normalize("NFD")
    .replace(/[\u0300\u0301\u0342]/g, "")
    .normalize("NFC");

const applyGreekUppercase = (language) => {
  if (language !== "el") {
    return;
  }

  translatableTextNodes.forEach((node) => {
    if (getComputedStyle(node).textTransform !== "uppercase") {
      return;
    }

    const text = node.textContent;

    if (!text) {
      return;
    }

    node.textContent = toGreekUppercase(text);
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
    const url = new URL(window.location.href);

    if (language === DEFAULT_LANGUAGE) {
      url.searchParams.delete("lang");
    } else {
      url.searchParams.set("lang", language);
    }

    window.history.replaceState(null, "", url);
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
  menuPanel.removeAttribute("inert");
  menuPanel.classList.add("is-open");
  menuPanel.setAttribute("aria-hidden", "false");
  menuToggle.setAttribute("aria-expanded", "true");
  body.classList.add("menu-open");
  setRootsInert(true);
  menuClose?.focus();
  document.addEventListener("keydown", onMenuKeydown);
}

function closeMenu() {
  if (!menuPanel || !menuToggle) {
    return;
  }

  menuPanel.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  body.classList.remove("menu-open");
  setRootsInert(false);
  document.removeEventListener("keydown", onMenuKeydown);

  if (lastFocusedElement instanceof HTMLElement) {
    lastFocusedElement.focus();
  }

  menuPanel.setAttribute("aria-hidden", "true");
  menuPanel.setAttribute("inert", "");
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

const activateRoom = (roomName) => {
  roomButtons.forEach((button) => {
    const isActive = button.dataset.roomTarget === roomName;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
    button.tabIndex = isActive ? 0 : -1;
  });

  roomPanels.forEach((panel) => {
    const isActive = panel.dataset.roomPanel === roomName;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
  });
};

roomButtons.forEach((button, index) => {
  const roomName = button.dataset.roomTarget;
  const panel = roomPanels.find((candidate) => candidate.dataset.roomPanel === roomName);

  if (panel) {
    const tabId = `room-tab-${roomName}`;
    const panelId = `room-panel-${roomName}`;
    button.id = tabId;
    panel.id = panelId;
    button.setAttribute("aria-controls", panelId);
    panel.setAttribute("aria-labelledby", tabId);
  }

  button.addEventListener("click", () => activateRoom(roomName));
  button.addEventListener("mouseenter", () => {
    if (window.matchMedia("(hover: hover)").matches) {
      activateRoom(roomName);
    }
  });
  button.addEventListener("keydown", (event) => {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(event.key)) {
      return;
    }

    event.preventDefault();
    const lastIndex = roomButtons.length - 1;
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? lastIndex
        : event.key === "ArrowRight" || event.key === "ArrowDown"
          ? (index + 1) % roomButtons.length
          : (index - 1 + roomButtons.length) % roomButtons.length;

    const nextButton = roomButtons[nextIndex];
    activateRoom(nextButton.dataset.roomTarget);
    nextButton.focus();
  });
});

const initialRoom = roomButtons.find((button) => button.classList.contains("is-active"));

if (initialRoom) {
  activateRoom(initialRoom.dataset.roomTarget);
}

const syncHeaderState = () => {
  body.classList.toggle("scrolled", window.scrollY > 18);
};

applyLanguage(getRequestedLanguage(), false);
syncCurrentPageLinks();
syncHeaderState();

window.addEventListener("scroll", syncHeaderState, { passive: true });
