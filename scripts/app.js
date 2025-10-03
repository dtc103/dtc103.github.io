// Simple SPA with sliding views, swipe gestures, and projects loader
const track = document.querySelector('.views-track');
const viewport = document.querySelector('.views-viewport');
const navLinks = [...document.querySelectorAll('[data-nav]')];
const viewOrder = ['about', 'projects', 'contact'];
const tabs = viewOrder.reduce((acc, view) => {
  acc[view] = document.getElementById(`view-${view}`);
  return acc;
}, {});
let active = null;
const FOCUS_DELAY = 250;
let resizeFrame = null;

const header = document.querySelector('.site-header');
const footer = document.querySelector('.site-footer');

// Header hide/show on scroll
let lastScrollY = window.scrollY;
let scrollTicking = false;
const SCROLL_DELTA = 6;

function updateHeaderOnScroll() {
  const currentY = window.scrollY;
  const scrolledDown = currentY > lastScrollY + SCROLL_DELTA;
  const scrolledUp = currentY < lastScrollY - SCROLL_DELTA;

  if (currentY <= 0 || scrolledUp) {
    document.body.classList.remove('header-hidden');
  } else if (scrolledDown) {
    document.body.classList.add('header-hidden');
  }

  lastScrollY = currentY;
  scrollTicking = false;
}

window.addEventListener('scroll', () => {
  if (!scrollTicking) {
    scrollTicking = true;
    requestAnimationFrame(updateHeaderOnScroll);
  }
});

// Modal refs
const modal = document.getElementById('project-modal');
const modalTitle = modal.querySelector('.modal-title');
const modalYear = modal.querySelector('.modal-year');
const modalTags = modal.querySelector('.modal-tags');
const modalContent = modal.querySelector('.modal-markdown');
const modalLinks = modal.querySelector('.modal-links');
const closeModalElements = modal.querySelectorAll('[data-close-modal]');
let currentProject = null;

// Projects refs
const projectsGrid = document.getElementById('projects-grid');

function getMinViewportHeight() {
  const viewportHeight = window.innerHeight;
  const headerHeight = header?.offsetHeight ?? 0;
  const footerHeight = footer?.offsetHeight ?? 0;
  return Math.max(0, viewportHeight - headerHeight - footerHeight);
}

function syncViewportHeight(view) {
  if (!track) return;
  const section = tabs[view];
  if (!section) return;

  const minHeight = getMinViewportHeight();

  Object.values(tabs).forEach(tab => {
    if (tab) tab.style.minHeight = '';
  });

  section.style.minHeight = `${minHeight}px`;

  const applyHeight = () => {
    const measuredHeight = section.scrollHeight;
    const targetHeight = Math.max(measuredHeight, minHeight);
    track.style.height = `${targetHeight}px`;
  };

  applyHeight();
  requestAnimationFrame(applyHeight);
}

function setActive(view, push = true) {
  if (!track || !tabs[view] || view === active) return;

  const index = viewOrder.indexOf(view);
  if (index === -1) return;

  document.body.classList.remove('header-hidden');

  updateNavTabs(view);
  updateViewStates(view);

  track.style.removeProperty('transition');
  track.style.transform = `translateX(${index * -100}%)`;
  syncViewportHeight(view);

  active = view;

  if (push) {
    const hash = `#${view}`;
    if (location.hash !== hash) {
      history.pushState({ view }, '', hash);
    }
  }

  window.setTimeout(() => {
    const heading = tabs[view].querySelector('h1, h2, h3');
    heading?.focus?.();
  }, FOCUS_DELAY);
}

function updateNavTabs(view) {
  document.querySelectorAll('.navigation a[role="tab"]').forEach(anchor => {
    const isActive = anchor.dataset.nav === view;
    anchor.classList.toggle('active', isActive);
    anchor.setAttribute('aria-selected', String(isActive));
  });
}

function updateViewStates(currentView) {
  Object.entries(tabs).forEach(([name, section]) => {
    if (!section) return;
    const isActive = name === currentView;
    section.setAttribute('aria-hidden', String(!isActive));
    section.classList.toggle('is-inert', !isActive);
  });
}

function initRouter() {
  const candidate = location.hash.replace('#', '') || 'about';
  const initial = tabs[candidate] ? candidate : 'about';
  setActive(initial, false);

  window.addEventListener('popstate', event => {
    const fromState = event.state?.view;
    const hashView = location.hash.replace('#', '');
    const next = tabs[fromState]
      ? fromState
      : tabs[hashView]
        ? hashView
        : 'about';
    setActive(next, false);
  });

  navLinks.forEach(link => {
    link.addEventListener('click', event => {
      const view = link.dataset.nav;
      if (!view) return;
      event.preventDefault();
      setActive(view);
    });
  });
}

function initTrack() {
  if (!track) return;
  const hashView = location.hash.replace('#', '');
  const startIndex = viewOrder.includes(hashView) ? viewOrder.indexOf(hashView) : 0;
  track.style.transform = `translateX(${startIndex * -100}%)`;
}

function goToRelativeView(offset) {
  if (!active) return;
  const currentIndex = viewOrder.indexOf(active);
  const nextIndex = currentIndex + offset;
  if (nextIndex < 0 || nextIndex >= viewOrder.length) return;
  setActive(viewOrder[nextIndex]);
}

// Swipe gesture handling
const SWIPE_TOUCH_SLOP = 12;
const SWIPE_THRESHOLD_RATIO = 0.24;

const gesture = {
  pointerId: null,
  startX: 0,
  startY: 0,
  deltaX: 0,
  deltaY: 0,
  orientation: null,
  isDragging: false,
  activeIndex: 0
};

function resetGesture() {
  gesture.pointerId = null;
  gesture.startX = 0;
  gesture.startY = 0;
  gesture.deltaX = 0;
  gesture.deltaY = 0;
  gesture.orientation = null;
  gesture.isDragging = false;
  gesture.activeIndex = 0;
}

function adjustDuringDrag(dragPercent) {
  const currentIndex = gesture.activeIndex;
  const currentSection = tabs[viewOrder[currentIndex]];
  const minHeight = getMinViewportHeight();
  let targetHeight = Math.max(minHeight, currentSection?.scrollHeight || 0);

  let neighborIndex = null;
  if (dragPercent < 0 && currentIndex < viewOrder.length - 1) {
    neighborIndex = currentIndex + 1;
  } else if (dragPercent > 0 && currentIndex > 0) {
    neighborIndex = currentIndex - 1;
  }

  if (neighborIndex !== null) {
    const neighborSection = tabs[viewOrder[neighborIndex]];
    targetHeight = Math.max(targetHeight, neighborSection?.scrollHeight || 0);
  }

  track.style.height = `${targetHeight}px`;
}

function onPointerDown(event) {
  if (!viewport) return;
  if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;

  gesture.pointerId = event.pointerId;
  gesture.startX = event.clientX;
  gesture.startY = event.clientY;
  gesture.deltaX = 0;
  gesture.deltaY = 0;
  gesture.orientation = null;
  gesture.isDragging = false;
  gesture.activeIndex = viewOrder.indexOf(active);
}

function onPointerMove(event) {
  if (gesture.pointerId !== event.pointerId) return;
  if (gesture.orientation === 'vertical') return;

  const dx = event.clientX - gesture.startX;
  const dy = event.clientY - gesture.startY;
  gesture.deltaX = dx;
  gesture.deltaY = dy;

  if (!gesture.orientation) {
    if (Math.abs(dx) >= SWIPE_TOUCH_SLOP || Math.abs(dy) >= SWIPE_TOUCH_SLOP) {
      if (Math.abs(dx) > Math.abs(dy)) {
        gesture.orientation = 'horizontal';
        gesture.isDragging = true;
        track.style.transition = 'none';
        viewport.setPointerCapture?.(event.pointerId);
      } else {
        gesture.orientation = 'vertical';
        return;
      }
    } else {
      return;
    }
  }

  if (!gesture.isDragging) return;

  event.preventDefault();

  const width = viewport.offsetWidth || window.innerWidth || 1;
  let dragPercent = (dx / width) * 100;

  const atFirst = gesture.activeIndex === 0;
  const atLast = gesture.activeIndex === viewOrder.length - 1;

  if ((atFirst && dragPercent > 0) || (atLast && dragPercent < 0)) {
    dragPercent *= 0.25;
  }

  const translate = gesture.activeIndex * -100 + dragPercent;
  track.style.transform = `translateX(${translate}%)`;

  adjustDuringDrag(dragPercent);
}

function finalizeDrag() {
  const width = viewport.offsetWidth || window.innerWidth || 1;
  const threshold = width * SWIPE_THRESHOLD_RATIO;
  const deltaX = gesture.deltaX;
  const base = gesture.activeIndex * -100;

  track.style.removeProperty('transition');

  if (Math.abs(deltaX) > threshold) {
    if (deltaX < 0 && gesture.activeIndex < viewOrder.length - 1) {
      goToRelativeView(1);
      return;
    }
    if (deltaX > 0 && gesture.activeIndex > 0) {
      goToRelativeView(-1);
      return;
    }
  }

  track.style.transform = `translateX(${base}%)`;
  syncViewportHeight(active);
}

function onPointerUp(event) {
  if (gesture.pointerId !== event.pointerId) return;

  if (viewport?.hasPointerCapture?.(event.pointerId)) {
    viewport.releasePointerCapture(event.pointerId);
  }

  if (gesture.isDragging) {
    finalizeDrag();
  }

  resetGesture();
}

function onPointerCancel(event) {
  if (gesture.pointerId !== event.pointerId) return;

  if (viewport?.hasPointerCapture?.(event.pointerId)) {
    viewport.releasePointerCapture(event.pointerId);
  }

  if (gesture.isDragging) {
    track.style.removeProperty('transition');
    const base = gesture.activeIndex * -100;
    track.style.transform = `translateX(${base}%)`;
    syncViewportHeight(active);
  }

  resetGesture();
}

if (viewport) {
  viewport.addEventListener('pointerdown', onPointerDown, { passive: true });
  viewport.addEventListener('pointermove', onPointerMove, { passive: false });
  viewport.addEventListener('pointerup', onPointerUp, { passive: true });
  viewport.addEventListener('pointercancel', onPointerCancel, { passive: true });
}

// Projects loader
async function loadProjects() {
  if (!projectsGrid) return;
  try {
    const response = await fetch('./content/projects/projects.json', {
      headers: { 'Cache-Control': 'no-store' }
    });
    if (!response.ok) throw new Error('Unable to load projects.json');
    const projects = await response.json();
    renderProjects(projects);
  } catch (error) {
    projectsGrid.innerHTML = `
      <article class="card">
        <h2>Couldn’t load projects</h2>
        <p>Check the console (Developer Tools) for details and ensure projects.json is correctly formatted.</p>
      </article>
    `;
    if (active === 'projects') {
      requestAnimationFrame(() => syncViewportHeight('projects'));
    }
    console.error(error);
  }
}

function renderProjects(projects) {
  const template = document.getElementById('project-card-template');
  projectsGrid.innerHTML = '';
  projects.forEach(project => {
    const card = template.content.firstElementChild.cloneNode(true);
    card.dataset.file = project.file;
    card.querySelector('.project-year').textContent = project.year || 'Year N/A';
    card.querySelector('.project-title').textContent = project.title || 'Untitled Project';
    card.querySelector('.project-summary').textContent = project.summary || '';
    const tagsWrapper = card.querySelector('.project-tags');

    if (Array.isArray(project.tags)) {
      project.tags.forEach(tag => {
        const badge = document.createElement('span');
        badge.className = 'tag';
        badge.textContent = tag;
        tagsWrapper.appendChild(badge);
      });
    }

    card.addEventListener('click', () => openProject(project));
    card.addEventListener('keypress', e => {
      if (e.key === 'Enter') openProject(project);
    });

    projectsGrid.appendChild(card);
  });

  if (active === 'projects') {
    requestAnimationFrame(() => syncViewportHeight('projects'));
  }
}

async function openProject(project) {
  if (!project?.file) return;
  currentProject = project;

  modalTitle.textContent = project.title || 'Untitled Project';
  modalYear.textContent = project.year || '';
  renderTags(project.tags, modalTags);
  renderLinks(project.links, modalLinks);

  modalContent.innerHTML = '<p class="loading">Loading project details…</p>';
  toggleModal(true);

  try {
    const response = await fetch(`./content/projects/${project.file}`, { headers: { 'Cache-Control': 'no-store' } });
    if (!response.ok) throw new Error(`Unable to load ${project.file}`);

    const markdown = await response.text();
    const html = marked.parse(markdown, { mangle: false, headerIds: false });
    modalContent.innerHTML = html;
    modalContent.scrollTop = 0;
  } catch (error) {
    modalContent.innerHTML = `
      <p>We couldn't load this project’s details. Double-check the Markdown file name and path.</p>
      <pre>${error.message}</pre>
    `;
    console.error(error);
  }
}

function renderTags(tags = [], wrapper) {
  wrapper.innerHTML = '';
  if (!Array.isArray(tags)) return;
  tags.forEach(tag => {
    const badge = document.createElement('span');
    badge.className = 'tag';
    badge.textContent = tag;
    wrapper.appendChild(badge);
  });
}

function renderLinks(links = [], wrapper) {
  wrapper.innerHTML = '';
  if (!Array.isArray(links) || links.length === 0) return;

  links.forEach(link => {
    const anchor = document.createElement('a');
    anchor.href = link.url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.textContent = link.label || 'External link';
    wrapper.appendChild(anchor);
  });
}

function toggleModal(open) {
  modal.setAttribute('aria-hidden', String(!open));
  if (open) {
    document.body.style.overflow = 'hidden';
    modal.querySelector('.modal-content').focus?.();
  } else {
    document.body.style.overflow = '';
    modalContent.innerHTML = '';
    currentProject = null;
  }
}

closeModalElements.forEach(el => {
  el.addEventListener('click', () => toggleModal(false));
});

window.addEventListener('keydown', event => {
  if (event.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
    toggleModal(false);
  }
});

window.addEventListener('resize', () => {
  if (!active) return;
  if (resizeFrame) cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => syncViewportHeight(active));
});

// Init
initTrack();
initRouter();
loadProjects();