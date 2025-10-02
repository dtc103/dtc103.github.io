const viewWrapper = document.querySelector('.view-wrapper');
const viewTrack = document.querySelector('.view-track');
const views = document.querySelectorAll('.view');
const navSwitchers = document.querySelectorAll('.nav-link[data-switch]');
const aboutHeading = document.getElementById('about-heading');
const projectsHeading = document.getElementById('projects-heading');
const header = document.querySelector('.site-header');
const footer = document.querySelector('.site-footer');

document.querySelectorAll('.current-year').forEach(span => {
  span.textContent = new Date().getFullYear();
});

navSwitchers.forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    switchView(link.dataset.switch);
  });
});

document.querySelectorAll('[data-switch]').forEach(el => {
  if (!el.classList.contains('nav-link')) {
    el.addEventListener('click', event => {
      event.preventDefault();
      switchView(el.dataset.switch);
    });
  }
});

window.addEventListener('hashchange', () => {
  const target = window.location.hash === '#projects' ? 'projects' : 'about';
  switchView(target, { focus: false, updateHash: false });
});

let currentView = null;

function switchView(target, options = {}) {
  const { focus = true, updateHash = true, animate = true } = options;
  target = target === 'projects' ? 'projects' : 'about';

  const alreadyActive = currentView === target;

  if (!animate) {
    viewTrack.classList.add('no-animation');
  } else {
    viewTrack.classList.remove('no-animation');
  }

  viewWrapper.dataset.activeView = target;

  if (!alreadyActive) {
    currentView = target;
  }

  updateWrapperHeight({ animate });

  views.forEach(view => {
    const isActive = view.dataset.view === target;
    view.setAttribute('aria-hidden', String(!isActive));
  });

  navSwitchers.forEach(btn => {
    const isActive = btn.dataset.switch === target;
    btn.classList.toggle('active', isActive);
    if (isActive) {
      btn.setAttribute('aria-current', 'page');
    } else {
      btn.removeAttribute('aria-current');
    }
  });

  if (updateHash) {
    updateHashFragment(target);
  }

  if (focus) {
    focusHeading(target);
  }

  if (!animate) {
    requestAnimationFrame(() => viewTrack.classList.remove('no-animation'));
  }
}

function updateHashFragment(target) {
  const { pathname, search, hash } = window.location;
  if (target === 'projects') {
    if (hash !== '#projects') {
      history.replaceState(null, '', `${pathname}${search}#projects`);
    }
  } else if (hash) {
    history.replaceState(null, '', `${pathname}${search}`);
  }
}

function focusHeading(target) {
  const heading = target === 'projects' ? projectsHeading : aboutHeading;
  heading?.focus();
}

function parsePx(value) {
  return Number.parseFloat(value) || 0;
}

function updateWrapperHeight({ animate = true } = {}) {
  const activeKey = currentView || 'about';
  const activeView = document.querySelector(`.view[data-view="${activeKey}"]`);
  if (!activeView) return;

  const headerStyles = getComputedStyle(header);
  const headerSpacing =
    header.offsetHeight +
    parsePx(headerStyles.marginTop) +
    parsePx(headerStyles.marginBottom);

  const footerHeight = footer.offsetHeight;
  const extraGap = 48;

  const minHeight = Math.max(
    window.innerHeight - headerSpacing - footerHeight - extraGap,
    320
  );

  const activeHeight = activeView.offsetHeight;
  const finalHeight = Math.max(activeHeight, minHeight);

  if (!animate) {
    viewWrapper.classList.add('no-height-transition');
  } else {
    viewWrapper.classList.remove('no-height-transition');
  }

  viewWrapper.style.setProperty('--wrapper-height', `${finalHeight}px`);

  if (!animate) {
    requestAnimationFrame(() => viewWrapper.classList.remove('no-height-transition'));
  }
}

const initialView = window.location.hash === '#projects' ? 'projects' : 'about';
switchView(initialView, { focus: false, updateHash: false, animate: false });

window.addEventListener('resize', () => updateWrapperHeight());

const resizeObserver = new ResizeObserver(entries => {
  if (!currentView) return;
  for (const entry of entries) {
    if (entry.target.dataset.view === currentView) {
      updateWrapperHeight();
      break;
    }
  }
});

views.forEach(view => resizeObserver.observe(view));

// Project loading + modal logic ---------------------------------------------

const projectsGrid = document.getElementById('projects-grid');
const modal = document.getElementById('project-modal');
const modalTitle = modal.querySelector('.modal-title');
const modalYear = modal.querySelector('.modal-year');
const modalTags = modal.querySelector('.modal-tags');
const modalContent = modal.querySelector('.modal-markdown');
const modalLinks = modal.querySelector('.modal-links');
const closeModalElements = modal.querySelectorAll('[data-close-modal]');
const modalCloseButton = modal.querySelector('.modal-close');

let currentProject = null;
let lastFocusedElement = null;

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
    card.addEventListener('keypress', event => {
      if (event.key === 'Enter') openProject(project);
    });

    projectsGrid.appendChild(card);
  });

  if (currentView === 'projects') {
    updateWrapperHeight();
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
    const response = await fetch(`./content/projects/${project.file}`, {
      headers: { 'Cache-Control': 'no-store' }
    });
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
  if (open) {
    lastFocusedElement = document.activeElement;
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modalCloseButton.focus();
  } else {
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    modalContent.innerHTML = '';
    currentProject = null;
    lastFocusedElement?.focus();
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

loadProjects();