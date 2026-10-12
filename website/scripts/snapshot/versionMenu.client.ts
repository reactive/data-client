// The version menu by the logo: hover the logo, or tap the version under it,
// to open this page in another version's docs. Plain DOM, since archives add
// it to old releases' builds (see README.md).
import siteConfig from '@generated/docusaurus.config';

// siteVersions.ts's SiteVersion, which archives don't have
type SiteVersion = { label: string; note?: string; url: string };

const LATEST = 'https://dataclient.io';

let versions: Promise<SiteVersion[]> | undefined;
const loadVersions = (): Promise<SiteVersion[]> =>
  (versions ??= fetch(
    // archives (<version>.dataclient.io) read the root's; previews their own
    siteConfig.url === LATEST ?
      '/site-versions.json'
    : `${LATEST}/site-versions.json`,
  )
    .then(res => (res.ok ? res.json() : Promise.reject(res.status)))
    // a dev server or older deploy has no list; try again on the next open
    .catch((): SiteVersion[] => {
      versions = undefined;
      return [{ label: 'Latest docs', url: LATEST }];
    }));

/**
 * page: this page's path, locale, query and hash, to add to any version's url
 * site: this site's url in the list (production's root, /next or an archive's)
 */
function here() {
  const { baseUrl } = siteConfig;
  const lang = document.documentElement.lang;
  const locale = lang && baseUrl.endsWith(`/${lang}/`) ? `${lang}/` : '';
  const base = baseUrl.slice(0, baseUrl.length - locale.length);
  return {
    page: `/${locale}${location.pathname.slice(baseUrl.length)}${location.search}${location.hash}`,
    site: `${location.origin}${base}`.replace(/\/$/, ''),
  };
}

const STYLE = `
.version-menu {
  position: fixed;
  z-index: calc(var(--ifm-z-index-fixed, 200) + 1);
  box-sizing: border-box;
  min-width: 12.5rem;
  max-width: calc(100vw - 16px);
  max-height: calc(100vh - 6rem);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0.3125rem;
  border: 1px solid var(--ifm-color-emphasis-200, rgb(0 0 0 / 0.1));
  border-radius: 0.75rem;
  background: var(--ifm-background-surface-color, var(--ifm-background-color, #fff));
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.06), 0 10px 28px -6px rgb(0 0 0 / 0.18);
  color: var(--ifm-font-color-base);
  font-size: 0.875rem;
  line-height: 1.25;
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
  transform-origin: 24px 0;
  transition: opacity 100ms ease-in, transform 100ms ease-in, visibility 0s linear 100ms;
  visibility: hidden;
}
[data-theme=dark] .version-menu {
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.4), 0 12px 32px -4px rgb(0 0 0 / 0.55);
}
.version-menu[data-open] {
  opacity: 1;
  transform: none;
  transition: opacity 140ms ease-out, transform 200ms cubic-bezier(0.2, 0.9, 0.3, 1), visibility 0s;
  visibility: visible;
}
.version-menu__heading {
  padding: 0.5rem 0.625rem 0.375rem;
  color: var(--ifm-color-emphasis-700);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
[data-theme=dark] .version-menu__heading {
  color: var(--ifm-color-emphasis-600);
}
.version-menu__item, .version-menu__foot a {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2rem;
  padding: 0 0.625rem;
  border-radius: 0.5rem;
  text-decoration: none;
  transition: background-color 120ms, color 120ms;
}
.version-menu__item {
  color: var(--ifm-font-color-base);
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}
.version-menu__item:hover, .version-menu__item:focus-visible,
.version-menu__foot a:hover, .version-menu__foot a:focus-visible {
  background: var(--ifm-color-emphasis-200);
  background: color-mix(in srgb, var(--ifm-color-emphasis-200) 70%, transparent);
  color: var(--ifm-font-color-base);
  text-decoration: none;
  outline: none;
}
.version-menu__item[aria-current], .version-menu__item[aria-current]:hover {
  color: var(--ifm-color-primary-darker, var(--ifm-color-primary));
}
[data-theme=dark] .version-menu__item[aria-current] {
  color: var(--ifm-color-primary-lighter, var(--ifm-color-primary));
}
.version-menu__item[aria-current]::after {
  content: "";
  flex: none;
  width: 0.3125rem;
  height: 0.5625rem;
  margin: -0.1875rem 0.125rem 0 auto;
  border: solid currentColor;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
.version-menu__note {
  padding: 0.125rem 0.4375rem;
  border-radius: 999px;
  background: var(--ifm-color-emphasis-200);
  color: var(--ifm-color-emphasis-700);
  font-size: 0.6875rem;
  font-weight: 600;
  line-height: 1.2;
}
.version-menu__note[data-note="latest"] {
  background: var(--ifm-color-primary-contrast-background, var(--ifm-color-emphasis-200));
  background: color-mix(in srgb, var(--ifm-color-primary) 14%, transparent);
  color: var(--ifm-color-primary-darkest, var(--ifm-color-primary));
}
[data-theme=dark] .version-menu__note[data-note="latest"] {
  background: color-mix(in srgb, var(--ifm-color-primary) 24%, transparent);
  color: var(--ifm-color-primary-lightest, var(--ifm-color-primary));
}
.version-menu__foot {
  margin: 0.3125rem -0.3125rem -0.3125rem;
  padding: 0.3125rem;
  border-top: 1px solid var(--ifm-color-emphasis-200, rgb(0 0 0 / 0.1));
}
.version-menu__foot a {
  color: var(--ifm-color-emphasis-700);
  font-size: 0.8125rem;
}
@media (pointer: coarse) {
  .version-menu__item, .version-menu__foot a { min-height: 2.75rem; }
}
.navbar__brand::after {
  /* a 6x4px caret in the label's right padding, grown in on hover, keyboard focus or while open */
  background: conic-gradient(from -37deg at 50% 100%, currentColor 74deg, transparent 0) right 8px center / 6px 0 no-repeat;
  cursor: pointer;
  transition: opacity 150ms, color 150ms, background-size 150ms;
}
@media (hover: hover) {
  .navbar__brand:hover::after { opacity: 1; background-size: 6px 4px; }
}
.navbar__brand:focus-visible::after, .navbar__brand[aria-expanded="true"]::after {
  opacity: 1;
  background-size: 6px 4px;
}
.navbar__brand[aria-expanded="true"]::after {
  color: var(--ifm-color-primary);
}
@media (prefers-reduced-motion: reduce) {
  .version-menu, .version-menu[data-open] { transition: none; transform: none; }
  .navbar__brand::after { transition: none; }
}
`;

let menu: HTMLElement | undefined;
let brand: HTMLElement | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;
// bumped by each open and close, so an open still loading the list doesn't
// show the menu once anything closed it (the pointer left, a scroll, Escape)
let generation = 0;
// click isn't a PointerEvent in every browser
let lastPointer = '';

const isMenuPart = (node: Node | null) =>
  !!(menu?.contains(node) || brand?.contains(node));
const closeOnMouseLeave = (e: PointerEvent) => {
  if (e.pointerType === 'mouse') closeSoon();
};

function ensureMenu() {
  if (menu) return menu;
  menu = document.createElement('div');
  menu.className = 'version-menu';
  menu.setAttribute('role', 'menu');
  menu.setAttribute('aria-label', 'Versions');
  menu.addEventListener('pointerenter', () => clearTimeout(timer));
  menu.addEventListener('pointerleave', closeOnMouseLeave);
  menu.addEventListener('keydown', onMenuKey);
  menu.addEventListener('focusout', closeOnFocusOut);
  document.body.append(menu);
  document.addEventListener('pointerdown', e => {
    if (!isMenuPart(e.target as Node)) close();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu?.hasAttribute('data-open')) {
      close();
      brand?.focus();
    }
  });
  // the menu is fixed under the navbar, which hides on scroll
  window.addEventListener('resize', close);
  window.addEventListener('scroll', close, { passive: true });
  return menu;
}

async function open(focusFirst = false) {
  clearTimeout(timer);
  const id = ++generation;
  const el = ensureMenu();
  const list = await loadVersions();
  if (id !== generation || !brand) return;
  // measure before changing the DOM so it doesn't force a layout
  const { left } = brand.getBoundingClientRect();
  const { bottom } = (
    brand.closest('.navbar') ?? brand
  ).getBoundingClientRect();
  const { page, site } = here();
  el.replaceChildren(
    Object.assign(document.createElement('div'), {
      className: 'version-menu__heading',
      textContent: 'Versions',
    }),
    ...list.map(v => {
      const item = document.createElement('a');
      item.className = 'version-menu__item';
      item.setAttribute('role', 'menuitem');
      item.href = `${v.url}${page}`;
      item.textContent = v.label;
      if (v.url === site) item.setAttribute('aria-current', 'page');
      if (v.note) {
        const note = document.createElement('span');
        note.className = 'version-menu__note';
        note.dataset.note = v.note;
        note.textContent = v.note;
        item.append(note);
      }
      return item;
    }),
    Object.assign(document.createElement('div'), {
      className: 'version-menu__foot',
      innerHTML:
        // archives have no blog of their own
        `<a href="${LATEST}/blog/tags/releases">Release notes</a>`,
    }),
  );
  el.style.left = `${Math.max(8, left - 8)}px`;
  el.style.top = `${bottom - 4}px`;
  el.setAttribute('data-open', '');
  brand.setAttribute('aria-expanded', 'true');
  if (focusFirst) el.querySelector<HTMLElement>('[role=menuitem]')?.focus();
}

function close() {
  clearTimeout(timer);
  generation++;
  if (!menu?.hasAttribute('data-open')) return;
  menu.removeAttribute('data-open');
  brand?.setAttribute('aria-expanded', 'false');
}

function closeOnFocusOut(e: FocusEvent) {
  const next = e.relatedTarget as Node | null;
  if (next && !isMenuPart(next)) close();
}

function closeSoon() {
  clearTimeout(timer);
  timer = setTimeout(close, 250);
}

function onMenuKey(e: KeyboardEvent) {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  e.preventDefault();
  const items = [
    ...(menu?.querySelectorAll<HTMLElement>('[role=menuitem]') ?? []),
  ];
  const at = items.indexOf(document.activeElement as HTMLElement);
  const step = e.key === 'ArrowDown' ? 1 : -1;
  items[(at + step + items.length) % items.length]?.focus();
}

function bind(el: HTMLElement) {
  // the label's hover styles too, so add them before the menu first opens
  if (!brand) {
    const style = document.createElement('style');
    style.textContent = STYLE;
    document.head.append(style);
  }
  brand = el;
  el.setAttribute('aria-haspopup', 'menu');
  el.setAttribute('aria-expanded', 'false');
  // load the list before the menu opens, once the page is idle
  setTimeout(loadVersions, 1000);
  el.addEventListener('pointerdown', e => {
    lastPointer = e.pointerType;
  });
  el.addEventListener('pointerenter', e => {
    if (e.pointerType !== 'mouse') return;
    clearTimeout(timer);
    timer = setTimeout(() => open(), 80);
  });
  el.addEventListener('pointerleave', closeOnMouseLeave);
  // The version under the logo opens the menu rather than going home: the
  // tap equivalent of hovering
  el.addEventListener('click', e => {
    const logo = el.querySelector('img, svg');
    if (!logo || e.clientY < logo.getBoundingClientRect().bottom - 4) return;
    e.preventDefault();
    // a mouse's hover already opened it, so its click shouldn't close it
    if (menu?.hasAttribute('data-open') && lastPointer !== 'mouse') close();
    else open();
  });
  el.addEventListener('focusout', closeOnFocusOut);
  el.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      open(true);
    }
  });
}

export function onRouteUpdate() {
  close();
}

export function onRouteDidUpdate() {
  // Docusaurus may render a new navbar
  const el = document.querySelector<HTMLElement>('.navbar__brand');
  if (el && el !== brand) bind(el);
}
