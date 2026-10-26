/* Module 1: Thư viện phương pháp luận chứng + kho từ nối. Đường dẫn: #/thuvien/<mã> hoặc #/thuvien/tu-noi */
window.Modules = window.Modules || {};
Modules.thuvien = {
  render(root, arg) {
    const methods = Store.content.methods || [];
    const current = arg || (methods[0] && methods[0].id);
    root.innerHTML = `
      <header class="page-head"><h1>Thư viện phương pháp</h1>
        <p>Đọc định nghĩa, khung câu và đoạn mẫu của từng phương pháp luận chứng. Đoạn mẫu được gạch chân theo thành phần.</p></header>
      <nav class="subnav" aria-label="Chọn phương pháp">
        ${methods.map(m => `<a href="#/thuvien/${U.esc(m.id)}" ${m.id === current ? 'aria-current="page"' : ''}><span class="chip"><span class="zh">${U.esc(m.name_zh)}</span></span></a>`).join('')}
        <a href="#/thuvien/tu-noi" ${current === 'tu-noi' ? 'aria-current="page"' : ''}><span class="chip">Kho từ nối</span></a>
      </nav>
      <div id="lib-body"></div>`;
    const body = root.querySelector('#lib-body');
    if (current === 'tu-noi') return this.phrases(body);
    const m = Store.method(current);
    if (!m) { body.innerHTML = `<div class="empty">Không tìm thấy phương pháp “${U.esc(current)}”.</div>`; return; }
    this.method(body, m);
  },

  method(body, m) {
    const related = UI.phrasesBy(p => p.method === m.id);
    body.innerHTML = `
      <div class="lib-title"><h1>${U.esc(m.name_zh)}</h1><p>${U.esc(m.name_vi)}</p></div>
      ${Store.prefs.pinyin && U.hasPinyin() ? `<p class="muted small">${U.esc(U.pinyinOf(m.name_zh))}</p>` : ''}
      <p class="def">${U.esc(m.definition)}</p>
      <section class="section" style="margin-top:20px">
        <h2>Khung câu</h2>
        <ul class="frames">${U.lines(m.frames).map(f => `<li class="${U.richClass()}" style="font-size:18px">${U.rich(f, { marks: false })}</li>`).join('')}</ul>
      </section>
      <section class="section">
        <div class="sample-tools"><h2>Đoạn mẫu</h2>
          <label class="switch small"><input type="checkbox" id="toggle-marks" checked><span>Hiện gạch chân thành phần</span></label></div>
        ${U.legend()}
        <div class="sample-box" style="margin-top:12px"><p class="${U.richClass()}" id="sample">${U.rich(m.example)}</p></div>
      </section>
      <section class="section">
        <h2>Lưu ý khi dùng</h2>
        <ul class="tips">${U.lines(m.tips).map(t => `<li>${U.esc(t)}</li>`).join('')}</ul>
      </section>
      ${related.length ? `<section class="section"><h2>Từ nối hay đi cùng</h2>${this.phraseList(related)}</section>` : ''}`;
    body.querySelector('#toggle-marks').addEventListener('change', e => body.querySelector('#sample').classList.toggle('no-marks', !e.target.checked));
  },

  phraseList(list) {
    return `<ul class="phrase-list">${list.map(p => `
      <li><div><div class="phrase-zh">${U.esc(p.zh)}</div>${Store.prefs.pinyin ? `<div class="phrase-py">${U.esc(U.pinyinOf(p.zh))}</div>` : ''}</div>
        <div>${U.esc(p.vi)}</div>
        ${p.example ? `<div class="phrase-ex">${U.esc(p.example)}</div>` : ''}</li>`).join('')}</ul>`;
  },

  phrases(body) {
    const all = Store.content.phrases || [];
    const cats = [...new Set(all.map(p => p.category || 'Khác'))];
    let activeCat = '', q = '';
    body.innerHTML = `
      <div class="row" style="margin-bottom:12px">
        <input type="search" id="ph-q" placeholder="Tìm theo chữ Hán hoặc nghĩa tiếng Việt" style="max-width:360px">
        <span class="muted small" id="ph-count"></span>
      </div>
      <div class="subnav" id="ph-cats" style="margin-bottom:8px">
        <button type="button" class="chip" data-cat="" aria-pressed="true">Tất cả</button>
        ${cats.map(c => `<button type="button" class="chip" data-cat="${U.esc(c)}" aria-pressed="false">${U.esc(c)}</button>`).join('')}
      </div>
      <div id="ph-list"></div>`;
    const draw = () => {
      const qq = q.trim().toLowerCase();
      const list = all.filter(p => (!activeCat || (p.category || 'Khác') === activeCat) &&
        (!qq || [p.zh, p.vi, p.example, p.category].some(v => String(v || '').toLowerCase().includes(qq))));
      body.querySelector('#ph-count').textContent = `${list.length} mục`;
      const groups = cats.map(c => [c, list.filter(p => (p.category || 'Khác') === c)]).filter(([, l]) => l.length);
      body.querySelector('#ph-list').innerHTML = groups.length
        ? groups.map(([c, l]) => `<h3 class="cat-head">${U.esc(c)}</h3>${this.phraseList(l)}`).join('')
        : '<div class="empty">Không có từ nối nào khớp.</div>';
    };
    body.querySelector('#ph-q').addEventListener('input', U.debounce(e => { q = e.target.value; draw(); }, 150));
    body.querySelector('#ph-cats').addEventListener('click', e => {
      const b = e.target.closest('[data-cat]'); if (!b) return;
      activeCat = b.dataset.cat;
      body.querySelectorAll('#ph-cats .chip').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      draw();
    });
    draw();
  }
};
