/* Lịch sử: thống kê nhận diện theo phương pháp và danh sách bài đã lưu. #/lichsu */
window.Modules = window.Modules || {};
Modules.lichsu = {
  TYPE_VI: { essay: 'Bài viết', outline: 'Dàn ý', frame: 'Điền khung' },
  filter: '',

  async render(root) {
    root.innerHTML = `<header class="page-head"><h1>Lịch sử luyện tập</h1>
      <p>Kết quả lấy từ Google Sheet: tỉ lệ nhận diện đúng theo từng phương pháp và các bài bạn đã lưu.</p></header>
      <div id="h-body"><p class="loading">Đang tải lịch sử…</p></div>`;
    const body = root.querySelector('#h-body');
    let h = Store.history;
    if (!h) {
      try { h = await Api.call('getHistory'); Store.setHistory(h); }
      catch (err) {
        body.innerHTML = UI.errorBox(err, 'Thử lại');
        body.querySelector('[data-retry]').addEventListener('click', () => this.render(root));
        return;
      }
    }
    if (!body.isConnected) return;
    this.draw(body, h);
  },

  draw(body, h) {
    const methods = (Store.content.methods || []).filter(m => !['không', 'khong', 'no'].includes(String(m.quiz).toLowerCase()));
    const items = new Map((Store.content.identify || []).map(x => [x.id, x]));
    const stat = new Map(methods.map(m => [m.id, { n: 0, ok: 0 }]));
    (h.attempts || []).forEach(a => {
      const it = items.get(a.itemId);
      const ans = String(a.answer || (it && it.answer) || '').split(/[,，\s]+/).filter(Boolean);
      const chosen = String(a.chosen || '').split(',').filter(Boolean);
      ans.forEach(id => { const s = stat.get(id); if (!s) return; s.n++; if (chosen.includes(id)) s.ok++; });
    });
    const wrong = [];
    const seenWrong = new Set();
    (h.attempts || []).slice().reverse().forEach(a => { if (!a.correct && !seenWrong.has(a.itemId) && items.has(a.itemId)) { seenWrong.add(a.itemId); wrong.push(a); } });
    const total = (h.attempts || []).length, right = (h.attempts || []).filter(a => a.correct).length;

    body.innerHTML = `
      <section class="section" style="padding-top:0">
        <h2>Nhận diện phương pháp</h2>
        ${total ? `<p class="muted small" style="margin-bottom:10px">${total} lượt làm, ${right} lượt đúng hoàn toàn (${Math.round(right / total * 100)}%). Bảng dưới tính theo từng phương pháp có trong đáp án: bạn nhận ra được bao nhiêu lần.</p>
        <table class="stat-table"><thead><tr><th>Phương pháp</th><th style="width:40%">Tỉ lệ nhận ra</th><th class="num">Nhận ra / gặp</th></tr></thead><tbody>
          ${methods.map(m => { const s = stat.get(m.id); const pct = s.n ? Math.round(s.ok / s.n * 100) : 0; return `
            <tr><td><span class="zh">${U.esc(m.name_zh)}</span> <span class="muted small">${U.esc(m.name_vi)}</span></td>
              <td>${s.n ? `<div class="bar" title="${pct}%"><i style="width:${pct}%"></i></div>` : '<span class="muted small">Chưa gặp</span>'}</td>
              <td class="num">${s.ok} / ${s.n}</td></tr>`; }).join('')}
        </tbody></table>
        ${wrong.length ? `<p style="margin-top:16px;font-weight:500">Câu làm sai gần đây</p><div class="sugg" style="margin-top:8px">${wrong.slice(0, 12).map(a => `<a class="chip" href="#/nhandien?id=${U.esc(a.itemId)}">Làm lại ${U.esc(a.itemId)}</a>`).join('')}</div>` : ''}`
        : '<div class="empty">Chưa có lượt nhận diện nào. <a href="#/nhandien">Bắt đầu luyện</a>.</div>'}
      </section>
      <section class="section">
        <div class="row" style="margin-bottom:12px"><h2>Bài đã lưu</h2><span class="spacer"></span>
          <div class="sugg" id="h-filter">
            ${[['', 'Tất cả'], ['essay', 'Bài viết'], ['outline', 'Dàn ý'], ['frame', 'Điền khung']].map(([v, l]) => `<button type="button" class="chip" data-type="${v}" aria-pressed="${this.filter === v}">${l}</button>`).join('')}
          </div></div>
        <ul class="sub-list" id="h-list"></ul>
      </section>`;

    const drawList = () => {
      const list = (h.submissions || []).filter(s => !this.filter || s.type === this.filter);
      body.querySelector('#h-list').innerHTML = list.length ? list.map(s => `
        <li><button type="button" data-id="${U.esc(s.id)}">
          <span class="sub-meta">${U.esc(U.fmtDate(s.createdAt))}</span>
          <span class="tag">${U.esc(this.TYPE_VI[s.type] || s.type)}</span>
          <span class="sub-title">${U.esc(s.title || '(không có nhan đề)')}</span>
          <span class="sub-meta">${s.charCount !== '' ? s.charCount + ' chữ' : ''}${s.durationSec ? ', ' + U.fmtTime(s.durationSec) : ''}${s.checklistTotal ? `, checklist ${s.checklistDone}/${s.checklistTotal}` : ''}${s.selfScore !== '' && s.selfScore != null ? `, ${s.selfScore} điểm` : ''}</span>
        </button></li>`).join('') : '<li class="empty">Chưa có bài nào.</li>';
    };
    body.querySelector('#h-filter').addEventListener('click', e => {
      const b = e.target.closest('[data-type]'); if (!b) return;
      this.filter = b.dataset.type;
      body.querySelectorAll('#h-filter .chip').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      drawList();
    });
    body.querySelector('#h-list').addEventListener('click', e => {
      const b = e.target.closest('[data-id]'); if (!b) return;
      this.open((h.submissions || []).find(s => s.id === b.dataset.id));
    });
    drawList();
  },

  async open(s) {
    if (!s) return;
    const missed = U.lines(s.checklistMissed);
    const body = `
      <p class="muted small" style="margin-bottom:12px">${U.esc(this.TYPE_VI[s.type] || s.type)}, ${U.esc(U.fmtDate(s.createdAt))}${s.charCount !== '' ? `, ${s.charCount} chữ` : ''}${s.durationSec ? `, ${U.fmtTime(s.durationSec)}` : ''}</p>
      <div class="sample-box"><p class="zh gz-read" style="font-size:17px;line-height:2">${U.esc(s.content)}</p></div>
      ${missed.length ? `<p style="margin-top:14px;font-weight:500">Tiêu chí chưa đạt khi tự chấm</p><ul class="tips">${missed.map(m => `<li>${U.esc(m)}</li>`).join('')}</ul>` : ''}
      ${s.note ? `<p style="margin-top:14px"><b>Ghi chú:</b> ${U.esc(s.note)}</p>` : ''}`;
    const actions = [{ label: 'Đóng', value: null }];
    if (s.type === 'outline' && Store.topic(s.refId)) actions.push({ label: 'Viết bài từ dàn ý này', kind: 'primary', value: 'write' });
    if (s.type === 'frame' && s.refId) actions.push({ label: 'Làm lại bài này', kind: 'primary', value: 'redo' });
    const v = await UI.modal({ title: s.title || 'Bài đã lưu', body, actions, wide: true });
    if (v === 'write') {
      let data = {};
      try { data = JSON.parse(s.data || '{}'); } catch (e) { /* bỏ qua */ }
      Store.addOutline({ id: s.id, topicId: s.refId, data, text: s.content });
      location.hash = `#/viet/${s.refId}?outline=${s.id}`;
    }
    if (v === 'redo') location.hash = `#/khung/${s.refId}`;
  }
};
