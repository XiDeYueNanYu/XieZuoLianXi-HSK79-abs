/* Module 6: Viết tự do có tính giờ. #/viet, #/viet/D001, #/viet/D001?outline=<id>, #/viet/tu-chon */
window.Modules = window.Modules || {};
Modules.viet = {
  render(root, arg, query) {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    if (!arg) {
      return TopicPicker.render(root, {
        base: 'viet', markKind: 'essay', allowFree: true, title: 'Viết bài',
        intro: 'Viết một bài nghị luận hoàn chỉnh trên giấy kẻ ô, có đồng hồ tính giờ, đếm chữ và thống kê từ nối. Bản nháp tự lưu trên máy cho tới khi bạn nộp.'
      });
    }
    let topic;
    if (arg === 'tu-chon') {
      topic = { id: 'tu-chon', title: '', prompt_zh: '', free: true };
    } else {
      topic = Store.topic(arg);
      if (!topic) { root.innerHTML = `<a class="back" href="#/viet">Danh sách đề</a><div class="empty">Không tìm thấy đề “${U.esc(arg)}”.</div>`; return; }
    }
    let outline = null;
    if (query.outline) {
      outline = Store.findOutline(query.outline);
      if (!outline && Store.history) {
        const s = (Store.history.submissions || []).find(x => x.id === query.outline);
        if (s) { try { outline = { id: s.id, topicId: s.refId, data: JSON.parse(s.data || '{}'), text: s.content }; } catch (e) { outline = { id: s.id, text: s.content }; } }
      }
      if (!outline) UI.toast('Không tìm thấy dàn ý trên máy này. Mở lại từ trang Lịch sử.', 'bad');
    }
    this.write(root, topic, outline);
  },

  write(root, t, outline) {
    const draftKey = 'essay.' + t.id;
    const d = Object.assign({ text: '', elapsed: 0, title: '' }, Store.draft(draftKey));
    if (outline) d.outlineId = outline.id;
    const minChars = U.num(t.min_chars, U.num(Store.cfg('default_min_chars', 600), 600));
    const limit = U.num(t.time_min, U.num(Store.cfg('default_time_min', 40), 40)) * 60;
    const repeatWarn = U.num(Store.cfg('repeat_warning', 3), 3);
    let running = false, lastTick = 0;

    root.innerHTML = `
      <a class="back" href="#/viet">Danh sách đề</a>
      ${t.free
        ? `<label style="max-width:520px;margin-bottom:16px">Nhan đề / đề bài tự chọn<input class="zh" id="free-title" placeholder="Ví dụ: 论诚信" value="${U.esc(d.title)}"></label>`
        : `<div class="row" style="margin-bottom:6px"><span class="muted small">${U.esc(t.id)}</span></div>
           <h1 class="thesis" style="margin-bottom:14px">${U.esc(t.title)}</h1>
           <details class="fold" ${d.text ? '' : 'open'}><summary>Đề bài</summary><div class="fold-body">${UI.topicBox(t)}</div></details>`}
      <div class="ws" style="margin-top:20px">
        <div class="stack">
          <div class="ws-mini" aria-hidden="true"><span><b id="mini-time"></b></span><span><b id="mini-count"></b> / ${minChars} chữ</span><span class="spacer"></span><button type="button" class="link-btn small" id="mini-toggle"></button></div>
          <div id="editor"></div>
          <div class="row">${UI.indentToggle()}<span class="spacer"></span>
            <button type="button" class="btn" id="btn-clear">Xoá bản nháp</button>
            <button type="button" class="btn btn-primary" id="btn-submit">Nộp bài</button></div>
        </div>
        <aside class="ws-side">
          <div class="side-block">
            <h3>Thời gian (${Math.round(limit / 60)} phút)</h3>
            <div class="timer" id="timer"></div>
            <p class="small muted" id="timer-sub" style="margin-top:6px"></p>
            <div class="row" style="margin-top:10px"><button type="button" class="btn btn-sm" id="btn-time"></button></div>
          </div>
          <div class="side-block meter">
            <h3>Số chữ</h3>
            <div class="meter-num" id="m-num"></div>
            <div class="meter-bar"><i style="width:0"></i></div>
            <p class="small muted" id="m-sub"></p>
          </div>
          <div class="side-block"><h3>Từ nối đã dùng</h3><div id="conn"></div></div>
          ${outline ? `<details class="fold" open><summary>Dàn ý</summary><div class="fold-body"><p class="zh gz-read" style="font-size:15px;line-height:1.9">${U.esc(outline.text || '')}</p></div></details>` : ''}
        </aside>
      </div>`;

    const timerEl = root.querySelector('#timer'), timeBtn = root.querySelector('#btn-time');
    const drawTimer = () => {
      const left = limit - d.elapsed;
      timerEl.textContent = (left < 0 ? '+' : '') + U.fmtTime(left);
      timerEl.classList.toggle('over', left < 0);
      root.querySelector('#timer-sub').textContent = left < 0 ? `Đã quá giờ. Tổng thời gian ${U.fmtTime(d.elapsed)}.` : running ? 'Đang tính giờ.' : d.elapsed ? 'Đang tạm dừng.' : 'Đồng hồ chạy khi bạn bắt đầu gõ.';
      timeBtn.textContent = running ? 'Tạm dừng' : d.elapsed ? 'Tiếp tục' : 'Bắt đầu';
      const mt = root.querySelector('#mini-time');
      if (mt) { mt.textContent = timerEl.textContent; mt.classList.toggle('over', left < 0); root.querySelector('#mini-toggle').textContent = timeBtn.textContent; }
    };
    let closed = false;
    const alive = () => !closed && timerEl.isConnected;
    const persist = () => { if (!closed) Store.saveDraft(draftKey, d); };
    const start = () => { if (running) return; running = true; lastTick = Date.now(); drawTimer(); };
    const pause = () => { if (!running) return; tick(); running = false; persist(); drawTimer(); };
    const tick = () => {
      if (!alive()) { if (running) { running = false; persist(); } clearInterval(this._timer); this._timer = null; return; }
      if (!running) return;
      const now = Date.now();
      d.elapsed += (now - lastTick) / 1000; lastTick = now;
      drawTimer();
    };
    this._timer = setInterval(() => { tick(); if (running && Math.round(d.elapsed) % 5 === 0) persist(); }, 1000);
    timeBtn.addEventListener('click', () => running ? pause() : start());
    root.querySelector('#mini-toggle').addEventListener('click', () => running ? pause() : start());
    document.addEventListener('visibilitychange', function onVis() {
      if (!timerEl.isConnected) return document.removeEventListener('visibilitychange', onVis);
      if (document.hidden) persist();
    });

    const stats = text => {
      if (!alive()) return;
      const c = U.count(text);
      root.querySelector('#m-num').innerHTML = `${c.total} <small>/ ${minChars}</small>`;
      root.querySelector('#mini-count').textContent = c.total;
      root.querySelector('.meter-bar i').style.width = Math.min(100, c.total / minChars * 100) + '%';
      root.querySelector('#m-sub').textContent = `${c.han} chữ Hán, ${c.paras} đoạn` + (c.total < minChars ? `. Còn thiếu ${minChars - c.total} chữ.` : '. Đã đạt số chữ.');
      const a = U.analyzeConnectives(text, Store.content.phrases, repeatWarn);
      const conn = root.querySelector('#conn');
      if (!a.total) { conn.innerHTML = '<p class="small muted">Chưa phát hiện từ nối nào trong kho.</p>'; return; }
      const rep = new Set(a.repeated.map(r => r.key));
      conn.innerHTML = [...a.byCat].map(([cat, list]) => `<p class="conn-cat">${U.esc(cat)}</p>
        <div class="conn-list">${list.map(x => `<span class="${rep.has(x.key) ? 'rep' : ''}">${U.esc(x.key)}${x.n > 1 ? ` ×${x.n}` : ''}</span>`).join('')}</div>`).join('') +
        (a.repeated.length ? `<p class="warn">Lặp nhiều: ${a.repeated.map(r => `<span class="zh">${U.esc(r.key)}</span> (${r.n} lần)`).join(', ')}. Thử thay bằng từ cùng nhóm.</p>` : '');
    };
    const statsLater = U.debounce(stats, 250);
    const saveLater = U.debounce(persist, 500);
    const ed = UI.gaozhi({
      value: d.text, rows: 14,
      placeholder: 'Bắt đầu viết. Nhấn Enter để xuống đoạn mới.',
      onInput: v => { d.text = v; if (!running && U.count(v).han) start(); statsLater(v); saveLater(); }
    });
    root.querySelector('#editor').appendChild(ed.el);
    stats(d.text); drawTimer();

    const freeTitle = root.querySelector('#free-title');
    freeTitle && freeTitle.addEventListener('input', () => { d.title = freeTitle.value; saveLater(); });

    root.querySelector('#btn-clear').addEventListener('click', async () => {
      const ok = await UI.modal({ title: 'Xoá bản nháp?', body: '<p>Toàn bộ nội dung đang viết và thời gian đã tính sẽ bị xoá khỏi máy này.</p>', actions: [{ label: 'Giữ lại', value: false }, { label: 'Xoá bản nháp', kind: 'primary', value: true }] });
      if (!ok) return;
      running = false; closed = true; Store.clearDraft(draftKey); this.render(root, t.free ? 'tu-chon' : t.id, outline ? { outline: outline.id } : {});
    });

    root.querySelector('#btn-submit').addEventListener('click', async e => {
      const btn = e.currentTarget;
      const text = ed.value.replace(/\s+$/, '');
      const c = U.count(text);
      if (!c.han) { UI.toast('Bài viết đang trống.', 'bad'); return; }
      const title = t.free ? (d.title || '').trim() : t.title;
      if (t.free && !title) { UI.toast('Hãy nhập nhan đề cho đề tự chọn.', 'bad'); freeTitle.focus(); return; }
      pause();
      const res = await UI.checklist('essay', { withScore: true, intro: `Bài có ${c.total} chữ (yêu cầu ${minChars}), viết trong ${U.fmtTime(d.elapsed)} (giới hạn ${Math.round(limit / 60)} phút).` });
      if (!res) return;
      btn.disabled = true; btn.textContent = 'Đang nộp…';
      const conn = U.analyzeConnectives(text, Store.content.phrases, repeatWarn);
      try {
        await Api.call('submit', {
          type: 'essay', refId: t.free ? '' : t.id, title, content: text, charCount: c.total, durationSec: Math.round(d.elapsed),
          checklistDone: res.done, checklistTotal: res.total, checklistMissed: res.missed, selfScore: res.selfScore, note: res.note,
          data: { outlineId: outline ? outline.id : '', timeLimitMin: Math.round(limit / 60), minChars, paragraphs: c.paras, connectives: conn.total, repeated: conn.repeated }
        });
        closed = true; running = false;
        Store.clearDraft(draftKey);
        if (!t.free) Store.addMark('essay', t.id);
        Store.setHistory(null);
        root.innerHTML = `
          <header class="page-head"><h1>Đã nộp bài</h1><p>Bài <span class="zh">${U.esc(title)}</span> đã được lưu lên Sheet.</p></header>
          <div class="panel" style="max-width:560px">
            <table class="stat-table"><tbody>
              <tr><td>Số chữ</td><td class="num">${c.total} / ${minChars}</td></tr>
              <tr><td>Số đoạn</td><td class="num">${c.paras}</td></tr>
              <tr><td>Thời gian</td><td class="num">${U.fmtTime(d.elapsed)} / ${Math.round(limit / 60)}:00</td></tr>
              <tr><td>Checklist đạt</td><td class="num">${res.done} / ${res.total}</td></tr>
              ${res.selfScore !== '' ? `<tr><td>Tự chấm</td><td class="num">${res.selfScore}</td></tr>` : ''}
            </tbody></table>
            ${res.missed.length ? `<p style="margin-top:16px;font-weight:500">Cần chú ý lần sau</p><ul class="tips">${res.missed.map(m => `<li>${U.esc(m)}</li>`).join('')}</ul>` : ''}
          </div>
          <div class="row" style="margin-top:20px"><a class="btn btn-primary" href="#/viet">Viết đề khác</a><a class="btn" href="#/lichsu">Xem lịch sử</a></div>`;
      } catch (err) {
        UI.toast('Chưa nộp được: ' + err.message + ' Bài vẫn được giữ trên máy, hãy thử lại.', 'bad');
        btn.disabled = false; btn.textContent = 'Nộp bài';
      }
    });
  }
};
