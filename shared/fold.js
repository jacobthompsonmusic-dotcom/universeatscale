// shared/fold.js — every menu can be put away.
// Each panel registered here gets a × that folds it down to a small tab in its corner (click the tab to open it again).
// On a phone they start folded, and a tap on the map folds them all. Used by both views (solar-system/ and milky-way/).
(function () {
  const phone = matchMedia('(max-width: 760px), (max-height: 620px)');
  const items = [];
  const css = document.createElement('style');
  css.textContent = [
    '.uas-fold { display: block; position: absolute; top: 3px; right: 5px; z-index: 3; width: 28px; height: 28px; border: 0; background: none; color: rgba(236,228,206,0.6); font: 19px/28px Georgia, serif; cursor: pointer; padding: 0; }',
    '.uas-fold:hover, .uas-fold:focus-visible { color: #ffcf6e; outline: none; }',
    '.uas-tab { display: none; }',
    '.uas-foldable-pad { padding-top: 26px !important; }',
    '.uas-folded.uas-folded { padding: 0 !important; width: auto !important; min-width: 0 !important; max-height: none !important; overflow: visible !important; }',
    '.uas-folded > :not(.uas-tab) { display: none !important; }',
    '.uas-folded > .uas-tab { display: block; border: 0; background: none; color: #f3e7c6; font: italic 15px "IM Fell English", Georgia, serif; letter-spacing: 0.02em; padding: 8px 14px; cursor: pointer; white-space: nowrap; max-width: 62vw; overflow: hidden; text-overflow: ellipsis; }',
    '.uas-folded > .uas-tab:hover, .uas-folded > .uas-tab:focus-visible { color: #ffcf6e; outline: none; }',
    '@media (max-width: 760px), (max-height: 620px) {',
    '  .uas-fold { width: 34px; height: 34px; font-size: 22px; line-height: 34px; }',
    '  .uas-foldable-pad { padding-top: 30px !important; }',
    '  .uas-folded > .uas-tab { padding: 9px 15px; }',
    '}'
  ].join('\n');
  document.head.appendChild(css);
  function foldable(el, opts) {
    opts = opts || {};
    if (!el || el.dataset.uasFold) return null;
    el.dataset.uasFold = '1';
    // opts.closeBtn: the panel's own × folds it instead (the info card keeps its selection; the tab, named after it, reopens it)
    const x = opts.closeBtn || document.createElement('button'); if (!opts.closeBtn) { x.type = 'button'; x.className = 'uas-fold'; x.setAttribute('aria-label', 'Put away'); x.textContent = '×'; } else x.onclick = null;
    const tab = document.createElement('button'); tab.type = 'button'; tab.className = 'uas-tab';
    if (!opts.closeBtn) el.prepend(x); el.prepend(tab);
    if (!opts.closeBtn) el.classList.add('uas-foldable-pad');
    const label = () => (typeof opts.title === 'function' ? opts.title() : opts.title) || 'Menu';
    const arrow = opts.arrow || '▴';   // which way the panel opens from its tab
    const set = f => { if (f) tab.textContent = label() + ' ' + arrow; else el.scrollTop = 0;   // reopened at the top, title showing
      el.classList.toggle('uas-folded', !!f); if (opts.onToggle) opts.onToggle(!!f); };
    x.addEventListener('click', e => { e.stopPropagation(); set(true); });
    x.addEventListener('pointerdown', e => e.stopPropagation());
    tab.addEventListener('click', e => { e.stopPropagation(); set(false); });
    tab.addEventListener('pointerdown', e => e.stopPropagation());
    const it = { el, set, opts, folded: () => el.classList.contains('uas-folded'), relabel: () => { if (el.classList.contains('uas-folded')) tab.textContent = label() + ' ' + arrow; } };
    items.push(it);
    if (phone.matches && opts.startFolded !== false) set(true);
    return it;
  }
  // a tap on the map puts every open menu away
  function foldAll() { if (!phone.matches) return; for (const it of items) if (!it.opts.keep && !it.el.classList.contains('uas-folded')) it.set(true); }   // (opts.keep: only its own × folds it)
  window.UAS_FOLD = { foldable, foldAll, phone };
})();
