(() => {
  const body = document.body;
  const themeButton = document.getElementById('themeButton');
  const themeIcon = themeButton?.querySelector('i');
  const menuButton = document.getElementById('menuButton');
  const nav = document.getElementById('pageNav') || document.getElementById('accountNav');
  const savedTheme = localStorage.getItem('talentry-theme');
  if (savedTheme === 'dark') body.classList.add('dark-mode');
  const paintTheme = () => {
    if (!themeIcon) return;
    const dark = body.classList.contains('dark-mode');
    themeIcon.classList.toggle('fa-sun', dark);
    themeIcon.classList.toggle('fa-moon', !dark);
    themeButton?.setAttribute('aria-label', dark ? 'Activar modo claro' : 'Activar modo oscuro');
  };
  paintTheme();
  themeButton?.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    localStorage.setItem('talentry-theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
    paintTheme();
  });
  menuButton?.addEventListener('click', () => {
    const open = nav?.classList.toggle('active') ?? false;
    menuButton.setAttribute('aria-expanded', String(open));
    const icon = menuButton.querySelector('i');
    icon?.classList.toggle('fa-xmark', open);
    icon?.classList.toggle('fa-bars', !open);
  });
  nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('active'); menuButton?.setAttribute('aria-expanded','false');
    const icon=menuButton?.querySelector('i'); icon?.classList.remove('fa-xmark'); icon?.classList.add('fa-bars');
  }));
  // Filtrado local del catálogo de oportunidades de demostración.
  const search = document.getElementById('opSearch');
  const location = document.getElementById('opLocation');
  const type = document.getElementById('opType');
  const grid = document.getElementById('opportunityGrid');
  const count = document.getElementById('opCount');
  const empty = document.getElementById('opEmpty');
  const updateOpportunities = () => {
    if (!grid) return;
    const q = (search?.value || '').trim().toLocaleLowerCase('es');
    const loc = location?.value || '', typ = type?.value || '';
    let visible = 0;
    grid.querySelectorAll('.opportunity-card').forEach(card => {
      const matches = (!q || card.dataset.title.toLocaleLowerCase('es').includes(q) || card.textContent.toLocaleLowerCase('es').includes(q)) && (!loc || card.dataset.location === loc) && (!typ || card.dataset.type === typ);
      card.hidden = !matches; if (matches) visible++;
    });
    if (count) count.textContent = `${visible} ${visible === 1 ? 'oportunidad encontrada' : 'oportunidades encontradas'}`;
    if (empty) empty.hidden = visible !== 0;
    grid.hidden = visible === 0;
  };
  [search,location,type].forEach(el => el?.addEventListener(el === search ? 'input' : 'change', updateOpportunities));
  document.getElementById('clearFilters')?.addEventListener('click', () => {
    if (search) search.value = ''; if (location) location.value = ''; if (type) type.value = ''; updateOpportunities();
  });
  updateOpportunities();
  // Formulario de contacto demostrativo: no transmite ni almacena datos.
  document.getElementById('contactForm')?.addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget, feedback = document.getElementById('contactMessage');
    if (!form.reportValidity()) return;
    feedback.classList.remove('error');
    feedback.textContent = '¡Gracias! El formulario de demostración se completó correctamente. No se enviaron datos.';
    form.reset();
  });
})();
