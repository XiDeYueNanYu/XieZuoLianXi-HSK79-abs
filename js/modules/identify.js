/* Module 2: Nhận diện phương pháp luận chứng. #/nhandien  hoặc  #/nhandien?id=N003 */
window.Modules = window.Modules || {};
Modules.nhandien = {
  state: null,

  render(root, arg, query) {
    const items = Store.content.identify || [];
    const options = (Store.content.methods || []).filter(m => !['không', 'khong', 'no', 'false', '0'].includes(String(m.quiz).trim().toLowerCase()));
    if (!this.state) this.state = { filter: 'chua-lam', done: 0, right: 0 };
    const st = this.state;
    st.options = options;

    root.innerHTML = `
      <header class="page-head"><h1>Nhận diện phương pháp</h1>
        <p>Đọc đoạn văn và chọn phương pháp luận chứng được dùng. Một đoạn có thể dùng nhiều phương pháp. Phím số để chọn, Enter để kiểm tra.</p></header>
      <div class="quiz-head">
        <select id="q-filter" aria-label="Lọc câu hỏi">
          <option value="chua-lam">Ưu tiên câu chưa làm</option>
          <option value="tat-ca">Tất cả, thứ tự ngẫu nhiên</option>
          ${options.map(m => `<option value="m:${U.esc(m.id)}">Chỉ ${U.esc(m.name_zh)} (${U.esc(m.name_vi)})</option>`).join('')}
        </select>
        <span class="spacer"></span>
        <span class="score" id="q-score"></span>
      </div>
      <div id="q-card"></div>`;
    const sel = root.querySelector('#q-filter');
    sel.value = st.filter;
    sel.addEventListener('change', () => { st.filter = sel.value; this.buildQueue(items); this.next(root); });

    if (!items.length) { root.querySelector('#q-card').innerHTML = '<div class="empty">Tab Identify trên Sheet chưa có câu nào.</div>'; return; }
    this.buildQueue(items);
    if (query.id) {
      const it = items.find(x => x.id === query.id);
      if (it) st.queue.unshift(it);
    }
    this.next(root);

    if (this._onKey) document.removeEventListener('keydown', this._onKey);
    const card = root.querySelector('#q-card');
    this._onKey = e => {
      if (!card.isConnected) { document.removeEventListener('keydown', this._onKey); return; }
      if (e.target.closest('input, textarea, select') || document.querySelector('.modal-back')) return;
      const n = Number(e.key);
      if (n >= 1 && n <= st.options.length && !st.checked) { root.querySelectorAll('.opt')[n - 1].click(); }
      if (e.key === 'Enter') { const b = root.querySelector('#q-check, #q-next'); if (b && !b.disabled) { e.preventDefault(); b.click(); } }
    };
    document.addEventListener('keydown', this._onKey);
  },

  buildQueue(items) {
    const st = this.state;
    let pool = items;
    if (st.filter.startsWith('m:')) pool = items.filter(x => String(x.answer).split(/[,，\s]+/).includes(st.filter.slice(2)));
    if (st.filter === 'chua-lam') {
      const seen = Store.marks('identify');
      pool = [...U.shuffle(pool.filter(x => !seen.has(x.id))), ...U.shuffle(pool.filter(x => seen.has(x.id)))];
    } else pool = U.shuffle(pool);
    st.queue = pool;
  },

  next(root) {
    const st = this.state;
    if (!st.queue.length) this.buildQueue(Store.content.identify || []);
    st.item = st.queue.shift();
    st.chosen = new Set();
    st.checked = false;
    st.started = Date.now();
    this.drawCard(root);
  },

  drawCard(root) {
    const st = this.state, it = st.item;
    root.querySelector('#q-score').innerHTML = st.done ? `Phiên này: <b>${st.right}</b> / ${st.done} câu đúng` : '';
    if (!it) { root.querySelector('#q-card').innerHTML = '<div class="empty">Không có câu nào khớp bộ lọc.</div>'; return; }
    const answer = String(it.answer).split(/[,，\s]+/).filter(Boolean);
    const card = root.querySelector('#q-card');
    card.innerHTML = `
      <div class="panel passage">
        <div class="row small muted" style="margin-bottom:8px"><span>${U.esc(it.id)}</span>${it.topic ? `<span class="tag">${U.esc(it.topic)}</span>` : ''}
          ${st.checked ? `<span class="spacer"></span>${U.legend()}` : ''}</div>
        <p class="${U.richClass()}">${U.rich(it.passage, { marks: st.checked })}</p>
      </div>
      <div class="options" role="group" aria-label="Các phương pháp">
        ${st.options.map((m, i) => {
          let cls = '', verdict = '';
          if (st.checked) {
            const inAns = answer.includes(m.id), picked = st.chosen.has(m.id);
            if (inAns && picked) { cls = 'is-right'; verdict = 'Đúng'; }
            else if (inAns) { cls = 'is-missed'; verdict = 'Bị sót'; }
            else if (picked) { cls = 'is-wrong'; verdict = 'Không có'; }
          }
          return `<button type="button" class="opt ${cls}" data-id="${U.esc(m.id)}" aria-pressed="${st.chosen.has(m.id)}" ${st.checked ? 'disabled' : ''}>
            <span class="key">${i + 1}</span><span><b>${U.esc(m.name_zh)}</b><small>${U.esc(m.name_vi)}</small></span><span class="verdict">${verdict}</span></button>`;
        }).join('')}
      </div>
      ${st.checked ? `<div class="feedback ${st.lastRight ? '' : 'bad'}">
          <h3>${st.lastRight ? 'Chính xác.' : 'Chưa đúng. Đáp án: ' + answer.map(a => U.esc((Store.method(a) || {}).name_zh || a)).join(' + ')}</h3>
          <p>${U.esc(it.explanation)}</p></div>` : ''}
      <div class="row" style="margin-top:18px">
        ${st.checked ? '<button type="button" class="btn btn-primary" id="q-next">Câu tiếp theo</button>'
                     : `<button type="button" class="btn btn-primary" id="q-check" ${st.chosen.size ? '' : 'disabled'}>Kiểm tra</button>`}
      </div>`;

    card.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => {
      if (st.checked) return;
      const id = b.dataset.id;
      st.chosen.has(id) ? st.chosen.delete(id) : st.chosen.add(id);
      b.setAttribute('aria-pressed', String(st.chosen.has(id)));
      card.querySelector('#q-check').disabled = !st.chosen.size;
    }));
    const chk = card.querySelector('#q-check');
    chk && chk.addEventListener('click', () => this.check(root, answer));
    const nx = card.querySelector('#q-next');
    nx && nx.addEventListener('click', () => this.next(root));
    (chk || nx) && (chk || nx).focus({ preventScroll: true });
  },

  check(root, answer) {
    const st = this.state;
    const chosen = [...st.chosen];
    const right = chosen.length === answer.length && answer.every(a => st.chosen.has(a));
    st.checked = true; st.lastRight = right; st.done++; if (right) st.right++;
    Store.addMark('identify', st.item.id);
    Api.call('logAttempt', { itemId: st.item.id, chosen, answer, correct: right })
      .catch(e => UI.toast('Chưa ghi được kết quả lên Sheet: ' + e.message, 'bad'));
    Store.setHistory(null);
    this.drawCard(root);
  }
};
