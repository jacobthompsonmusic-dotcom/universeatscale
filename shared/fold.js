// shared/fold.js — on a phone, every menu can be put away.
// Each panel registered here gets a × that folds it down to a small tab (tap the tab to open it again), and a tap on the map
// folds them all. On larger screens nothing changes. Used by both views (solar-system/ and milky-way/).
(function () {
  const phone = matchMedia('(max-width: 760px), (max-height: 620px)');
  const items = [];
  const css = document.createElement('style');
  css.textContent = [
    '.uas-fold, .uas-tab { display: none; }',
    '@media (max-width: 760px), (max-height: 620px) {',
    '  .uas-fold { display: block; position: absolute; top: 4px; right: 6px; z-index: 3; width: 34px; height: 34px; border: 0; background: none; color: rgba(236,228,206,0.75); font: 22px/34px Georgia, serif; cursor: pointer; padding: 0; }',
    '  .uas-foldable { padding-top: 30px !important; }',
    '  .uas-folded { padding: 0 !important; width: auto !important; min-width: 0 !important; max-height: none !important; overflow: visible !important; }',
    '  .uas-folded > :not(.uas-tab) { display: none !important; }',
    '  .uas-folded > .uas-tab { display: block; border: 0; background: none; color: #f3e7c6; font: italic 15px "IM Fell English", Georgia, serif; letter-spacing: 0.02em; padding: 9px 15px; cursor: pointer; white-space: nowrap; max-width: 62vw; overflow: hidden; text-overflow: ellipsis; }',
    '}'
  ].join('\n');
  document.head.appendChild(css);
  function foldable(el, opts) {
    opts = opts || {};
    if (!el || el.dataset.uasFold) return null;
    el.dataset.uasFold = '1';
    el.classList.add('uas-foldable');
    const x = document.createElement('button'); x.type = 'button'; x.className = 'uas-fold'; x.setAttribute('aria-label', 'Put away'); x.textContent = '×';
    const tab = document.createElement('button'); tab.type = 'button'; tab.className = 'uas-tab';
    el.prepend(x); el.prepend(tab);
    const label = () => (typeof opts.title === 'function' ? opts.title() : opts.title) || 'Menu';
    const set = f => { if (f) tab.textContent = label() + ' ▴'; el.classList.toggle('uas-folded', !!f); };
    x.addEventListener('click', e => { e.stopPropagation(); set(true); });
    x.addEventListener('pointerdown', e => e.stopPropagation());
    tab.addEventListener('click', e => { e.stopPropagation(); set(false); });
    tab.addEventListener('pointerdown', e => e.stopPropagation());
    const it = { el, set, opts, relabel: () => { if (el.classList.contains('uas-folded')) tab.textContent = label() + ' ▴'; } };
    items.push(it);
    if (phone.matches && opts.startFolded !== false) set(true);
    return it;
  }
  // a tap on the map puts every open menu away
  function foldAll() { if (!phone.matches) return; for (const it of items) if (!it.el.classList.contains('uas-folded')) it.set(true); }
  window.UAS_FOLD = { foldable, foldAll, phone };
})();
