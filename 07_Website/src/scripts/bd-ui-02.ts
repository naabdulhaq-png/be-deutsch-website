const root = document.querySelector<HTMLElement>('[data-bd-ui02]');
if (root && !document.body.classList.contains('bd-ui02-page')) {
  document.body.classList.add('bd-ui02-page');
  document.body.dataset.learningArea = root.dataset.area || 'overview';
  document.body.dataset.learningLevel = root.dataset.level || 'A1';
  const drawer = root.querySelector<HTMLElement>('.bd-ui02__sidebar');
  const backdrop = root.querySelector<HTMLElement>('.bd-ui02__backdrop');
  const opener = root.querySelector<HTMLButtonElement>('[data-bd-drawer-open]');
  const setDrawer = (open: boolean) => {
    const wasOpen = drawer?.classList.contains('is-open') ?? false;
    drawer?.classList.toggle('is-open', open);
    document.body.classList.toggle('bd-drawer-open', open);
    if (backdrop) backdrop.hidden = !open;
    opener?.setAttribute('aria-expanded', String(open));
    if (open) drawer?.querySelector<HTMLButtonElement>('[data-bd-drawer-close]')?.focus();
    else if (wasOpen) opener?.focus();
  };
  opener?.addEventListener('click', () => setDrawer(true));
  root.querySelectorAll<HTMLElement>('[data-bd-drawer-close]').forEach((button) => button.addEventListener('click', () => setDrawer(false)));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setDrawer(false); });

  root.querySelector<HTMLSelectElement>('[data-bd-course-switch]')?.addEventListener('change', (event) => {
    const value = (event.currentTarget as HTMLSelectElement).value;
    if (value) window.location.assign(value);
  });

  const input = root.querySelector<HTMLInputElement>('#bd-course-search');
  const results = root.querySelector<HTMLElement>('#bd-search-results');
  const index = JSON.parse(root.dataset.searchIndex || '[]') as Array<{title:string;meta:string;href:string}>;
  const render = () => {
    if (!input || !results) return;
    const query = input.value.trim().toLocaleLowerCase();
    if (!query) { results.hidden = true; input.setAttribute('aria-expanded', 'false'); results.replaceChildren(); return; }
    const matches = index.filter((item) => `${item.title} ${item.meta}`.toLocaleLowerCase().includes(query)).slice(0, 8);
    results.replaceChildren(...matches.map((item) => {
      const link = document.createElement('a'); link.href = item.href; link.setAttribute('role', 'option');
      const strong = document.createElement('strong'); strong.textContent = item.title;
      const small = document.createElement('small'); small.textContent = item.meta;
      link.append(strong, small); return link;
    }));
    if (!matches.length) { const empty = document.createElement('p'); empty.textContent = 'No approved lesson or word matches that search.'; results.append(empty); }
    results.hidden = false; input.setAttribute('aria-expanded', 'true');
  };
  input?.addEventListener('input', render);
  input?.addEventListener('keydown', (event) => { if (event.key === 'Escape') { input.value = ''; render(); } });
  document.addEventListener('click', (event) => { if (!root.querySelector('.bd-ui02__search')?.contains(event.target as Node) && results && input) { results.hidden = true; input.setAttribute('aria-expanded', 'false'); } });
}
