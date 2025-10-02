// Simple SPA with sliding views and projects loader
const track = document.querySelector('.views-track');
const navLinks = [...document.querySelectorAll('[data-nav]')];
const tabs = {
  about: document.getElementById('view-about'),
  projects: document.getElementById('view-projects')
};
let active = null;
const FOCUS_DELAY = 250;

// Modal refs (same as before)
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

function setActive(view, push = true) {
  if (!track || !tabs[view] || view === active) return;

  const index = view === 'about' ? 0 : 1;
  track.style.setProperty('--active-index', index);

  updateNavTabs(view);
  updateViewStates(view);
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

// Sliding styles driven by CSS variable
function initTrack() {
  if (!track) return;
  const startIndex = location.hash.replace('#', '') === 'projects' ? 1 : 0;
  track.style.setProperty('--active-index', startIndex);
}

// Load projects (from your existing projects.js logic, trimmed and adapted)
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
    card.addEventListener('keypress', e => { if (e.key === 'Enter') openProject(project); });

    projectsGrid.appendChild(card);
  });
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

// Init
initTrack();
initRouter();
loadProjects();