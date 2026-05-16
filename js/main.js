let navigationData = {};
let currentMobileCategory = 'private-clients';
let productsData = [];

async function loadNavigation() {
  try {
    const res = await fetch('data/header.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    navigationData = await res.json();
    buildDesktopMenu();
    initDesktopDropdown();
    buildMobileNavigation();
    toggleMobileVisibility();
    window.addEventListener('resize', toggleMobileVisibility);
  } catch (e) { console.error('Nav error:', e); }
}

function buildDesktopMenu() {
  const navList = document.querySelector('.nav__list');
  if (!navList) return;
  navList.innerHTML = (navigationData.menuMobile || []).map(item =>
    `<li class="nav__item" data-nav-item="${item.key}"><a href="#" class="header__nav-link">${item.label}</a><span class="dropdown-arrow"></span></li>`
  ).join('');
}

function initDesktopDropdown() {
  const navItems = document.querySelectorAll('.nav__item');
  const dropdown = document.querySelector('.dropdown');
  const overlay = document.querySelector('.overlay');
  const titlesContainer = document.querySelector('[data-nav-titles]');
  const contentContainer = document.querySelector('[data-nav-content]');
  if (!navItems.length || !dropdown || !overlay || !titlesContainer || !contentContainer) return;

  let activeItem = null, hideTimeout = null;

  const renderContent = (section, container) => {
    if (!section?.sections?.length) {
      container.innerHTML = '<div style="color:#fff;padding:20px">Нет подразделов</div>';
      return;
    }
    container.innerHTML = section.sections.map(sub => {
      const links = (sub.links || []).map(l => `<a href="${l.href}">${l.label}</a>`).join('');
      return `<div class="subsection"><div class="subsectionTitle">${sub.title}</div>${links}</div>`;
    }).join('');
  };

  const showDropdown = (item) => {
    if (hideTimeout) clearTimeout(hideTimeout);
    if (activeItem === item && dropdown.classList.contains('active')) return;
    const key = item.getAttribute('data-nav-item');
    const sections = navigationData[key];
    if (!sections?.length) {
      dropdown.classList.remove('active');
      overlay.classList.remove('active');
      activeItem = null;
      return;
    }
    titlesContainer.innerHTML = sections.map((s, i) => `<a data-section-index="${i}">${s.title}</a>`).join('');
    renderContent(sections[0], contentContainer);
    titlesContainer.querySelectorAll('a').forEach(title => {
      title.onpointerenter = () => {
        const idx = title.dataset.sectionIndex;
        if (sections[idx]) renderContent(sections[idx], contentContainer);
      };
    });
    dropdown.classList.add('active');
    overlay.classList.add('active');
    activeItem = item;
  };

  const hideDropdown = () => {
    if (hideTimeout) clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      dropdown.classList.remove('active');
      overlay.classList.remove('active');
      activeItem = null;
    }, 150);
  };

  navItems.forEach(item => {
    item.onpointerenter = () => showDropdown(item);
    item.onpointerleave = hideDropdown;
  });
  dropdown.onpointerenter = () => { if (hideTimeout) clearTimeout(hideTimeout); };
  dropdown.onpointerleave = hideDropdown;
  overlay.onpointerenter = hideDropdown;
}

function buildMobileNavigation() {
  const switchContainer = document.querySelector('.mobile-switch');
  const sectionsList = document.querySelector('.mobile-sections-list');
  if (!switchContainer || !sectionsList) return;

  const menu = navigationData.menuMobile || [];
  const renderButtons = () => {
    switchContainer.innerHTML = menu.map(item => {
      const active = item.key === currentMobileCategory ? ' active' : '';
      return `<button class="mobile-switch-btn${active}" data-category="${item.key}">${item.label}</button>`;
    }).join('');
    switchContainer.querySelectorAll('.mobile-switch-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        currentMobileCategory = btn.dataset.category;
        renderButtons();
        renderMobileSectionsList(currentMobileCategory);
      };
    });
  };
  renderButtons();
  renderMobileSectionsList(currentMobileCategory);
}

function renderMobileSectionsList(categoryKey) {
  const sectionsList = document.querySelector('.mobile-sections-list');
  if (!sectionsList) return;
  const sections = navigationData[categoryKey] || [];
  sectionsList.innerHTML = sections.map(section => {
    const subs = (section.sections || []).map(sub => {
      const links = (sub.links || []).map(l => `<a class="mobile-link" href="${l.href}">${l.label}</a>`).join('');
      return `<div class="mobile-subsection-title">${sub.title}</div>${links}`;
    }).join('') || '<div class="mobile-link">Нет ссылок</div>';
    return `<div class="mobile-section-item"><div class="mobile-section-header"><span>${section.title}</span><span class="arrow"></span></div><div class="mobile-submenu-items">${subs}</div></div>`;
  }).join('');
  sectionsList.querySelectorAll('.mobile-section-header').forEach(header => {
    header.onclick = (e) => {
      e.preventDefault();
      const item = header.parentElement;
      document.querySelectorAll('.mobile-section-item.open').forEach(el => { if (el !== item) el.classList.remove('open'); });
      item.classList.toggle('open');
    };
  });
}

function toggleMobileVisibility() {
  const isMobile = window.innerWidth <= 900;
  const navList = document.querySelector('.nav__list');
  const mobileContainer = document.querySelector('.mobile-nav-container');
  if (!navList || !mobileContainer) return;
  navList.style.display = isMobile ? 'none' : 'flex';
  mobileContainer.style.display = isMobile ? 'block' : 'none';
  if (!isMobile) {
    document.querySelector('.dropdown')?.classList.remove('active');
    document.querySelector('.overlay')?.classList.remove('active');
  }
}

const burger = document.getElementById('burger');
const navMenu = document.getElementById('nav');
if (burger && navMenu) {
  burger.onclick = (e) => {
    e.preventDefault();
    burger.classList.toggle('is-open');
    navMenu.classList.toggle('is-open');
    if (navMenu.classList.contains('is-open')) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      document.querySelectorAll('.mobile-section-item.open').forEach(el => el.classList.remove('open'));
    }
  };
}

async function loadProducts() {
  try {
    const res = await fetch('data/products.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    productsData = await res.json();
    renderProducts(productsData, 'all');
  } catch (e) { console.error('Products error:', e); }
}

function renderProducts(products, category) {
  const container = document.getElementById('products-grid');
  if (!container) return;
  const filtered = products.filter(p => p.categories.includes(category));

  container.innerHTML = filtered.map(p =>
    `<a href="#" class="product" data-categories="${p.categories.join(' ')}">
      <div class="product__text"><h3 class="product__title">${p.title}</h3><p class="product__desc">${p.desc}</p></div>
      <div class="product__art">${p.svg}</div>
    </a>`
  ).join('');
}

function initTabs() {
  const container = document.querySelector('[data-tabs="products"]');
  if (!container) return;
  container.querySelectorAll('[data-tab]').forEach(tab => {
    tab.onclick = (e) => {
      e.preventDefault();
      container.querySelectorAll('[data-tab]').forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      renderProducts(productsData, tab.dataset.tab);
    };
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadNavigation();
  loadProducts().then(initTabs);
});