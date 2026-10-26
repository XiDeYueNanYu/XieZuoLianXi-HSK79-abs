/* Module 5: Lập dàn ý 总分总. #/danyi  hoặc  #/danyi/D001 */
window.Modules = window.Modules || {};
Modules.danyi = {
  render(root, arg) {
    if (!arg) {
      return TopicPicker.render(root, {
        base: 'danyi', markKind: 'outline', title: 'Lập dàn ý',
        intro: 'Chọn một đề, rồi dựng dàn ý theo bố cục 总分总: mở bài nêu luận điểm trung tâm, thân bài gồm các luận điểm phụ (mỗi luận điểm một phương pháp), kết bài tổng kết.'
      });
    }
    const t = Store.topic(arg);
    if (!t) { root.innerHTML = `<a class="back" href="#/danyi">Danh sách đề</a><div class="empty">Không tìm thấy đề “${U.esc(arg)}”.</div>`; return; }
    this.form(root, t);
  },

  catStarts: prefixes => p => prefixes.some(x => String(p.category || '').startsWith(x)),

  form(root, t) {
    const draftKey = 'outline.' + t.id;
    const started = (Store.draft(draftKey) || {}).started || Date.now();
    const data = Object.assign({ opening: '', thesis: '', points: [{}, {}, {}], ending: '' }, (Store.draft(draftKey) || {}).data);
    const methods = (Store.content.methods || []).filter(m => m.id !== 'zonghe');
    let focusCtx = { kind: 'opening' }, focusEl = null;

    root.innerHTML = `
      <a class="back" href="#/danyi">Danh sách đề</a>
      <div class="row" style="margin-bottom:6px"><span class="muted small">${U.esc(t.id)}</span></div>
      <h1 class="thesis" style="margin-bottom:14px">${U.esc(t.title)}</h1>
      ${UI.topicBox(t)}
      <div class="ws" style="margin-top:24px">
        <form class="stack" id="ol-form" autocomplete="off">
          <section class="ol-part" style="border-top:0;padding-top:0">
            <h2><span class="zh">开头</span><span class="muted">Mở bài</span></h2>
            <label>Cách dẫn nhập<textarea class="field zh" name="opening" rows="2" placeholder="Ví dụ: 随着……，……成为人们热议的话题。"></textarea></label>
            <label style="margin-top:12px">中心论点 (luận điểm trung tâm)<input class="zh" name="thesis" placeholder="Một câu khẳng định rõ ràng"></label>
          </section>
          <section class="ol-part">
            <h2><span class="zh">分论点</span><span class="muted">Thân bài: luận điểm phụ</span></h2>
            <div id="points"></div>
            <button type="button" class="btn btn-sm" id="add-point" style="margin-top:12px">Thêm luận điểm phụ</button>
          </section>
          <section class="ol-part">
            <h2><span class="zh">结尾</span><span class="muted">Kết bài</span></h2>
            <label>Tổng kết và hô ứng mở bài<textarea class="field zh" name="ending" rows="2" placeholder="Ví dụ: 综上所述，……。只有……，才能……"></textarea></label>
          </section>
          <div class="row"><span class="spacer"></span>
            <button type="button" class="btn" id="go-write">Viết bài luôn (không lưu dàn ý)</button>
            <button type="submit" class="btn btn-primary">Tự chấm và lưu dàn ý</button></div>
        </form>
        <aside class="ws-side">
          <div class="side-block"><p class="sugg-title" id="sugg-title"></p><div id="sugg"></div>
            <p class="small muted" style="margin-top:10px">Bấm để chèn vào ô đang soạn.</p></div>
        </aside>
      </div>`;

    const form = root.querySelector('#ol-form');
    form.opening.value = data.opening; form.thesis.value = data.thesis; form.ending.value = data.ending;

    const methodOpts = sel => `<option value="">Chọn phương pháp</option>${methods.map(m => `<option value="${U.esc(m.id)}" ${m.id === sel ? 'selected' : ''}>${U.esc(m.name_zh)} (${U.esc(m.name_vi)})</option>`).join('')}`;
    const drawPoints = () => {
      root.querySelector('#points').innerHTML = data.points.map((p, i) => `
        <div class="point" data-i="${i}">
          <div class="point-head"><span class="zh">分论点${U.ZH_NUM[i]}</span><span class="spacer"></span>
            ${data.points.length > 2 ? `<button type="button" class="link-btn small" data-remove="${i}">Xoá</button>` : ''}</div>
          <div class="point-grid">
            <input class="zh" data-f="claim" placeholder="Luận điểm phụ" value="${U.esc(p.claim || '')}" aria-label="Luận điểm phụ ${i + 1}">
            <select data-f="method" aria-label="Phương pháp cho luận điểm ${i + 1}">${methodOpts(p.method)}</select>
          </div>
          <textarea class="field zh" data-f="evidence" rows="2" placeholder="Luận cứ dự định dùng: ví dụ, câu trích dẫn, hình ảnh so sánh…" aria-label="Luận cứ ${i + 1}">${U.esc(p.evidence || '')}</textarea>
        </div>`).join('');
      root.querySelector('#add-point').disabled = data.points.length >= 5;
    };
    drawPoints();

    let closed = false;
    const persist = U.debounce(() => { if (!closed) Store.saveDraft(draftKey, { data, started }); }, 300);
    const collect = () => {
      data.opening = form.opening.value; data.thesis = form.thesis.value; data.ending = form.ending.value;
      root.querySelectorAll('.point').forEach(el => {
        const p = data.points[Number(el.dataset.i)];
        el.querySelectorAll('[data-f]').forEach(f => { p[f.dataset.f] = f.value; });
      });
      persist();
    };
    form.addEventListener('input', collect);
    form.addEventListener('change', e => { collect(); if (e.target.dataset.f === 'method') showSugg(); });

    root.querySelector('#add-point').addEventListener('click', () => { collect(); data.points.push({}); drawPoints(); persist(); });
    root.querySelector('#points').addEventListener('click', e => {
      const r = e.target.closest('[data-remove]'); if (!r) return;
      collect(); data.points.splice(Number(r.dataset.remove), 1); drawPoints(); persist();
    });

    // Gợi ý từ nối theo vị trí đang soạn
    const showSugg = () => {
      let titleTxt, list;
      if (focusCtx.kind === 'opening') { titleTxt = 'Gợi ý cho mở bài'; list = UI.phrasesBy(this.catStarts(['开头引题', '提出论点'])); }
      else if (focusCtx.kind === 'ending') { titleTxt = 'Gợi ý cho kết bài'; list = UI.phrasesBy(this.catStarts(['结尾'])); }
      else {
        const p = data.points[focusCtx.i] || {};
        const m = Store.method(p.method);
        titleTxt = m ? `Gợi ý cho 分论点${U.ZH_NUM[focusCtx.i]} (${m.name_zh})` : `Gợi ý cho 分论点${U.ZH_NUM[focusCtx.i]}: chọn phương pháp để có từ nối phù hợp`;
        list = [...(m ? UI.phrasesBy(x => x.method === m.id) : []), ...UI.phrasesBy(this.catStarts(['过渡列举', '让步转折']))];
      }
      root.querySelector('#sugg-title').textContent = titleTxt;
      root.querySelector('#sugg').innerHTML = UI.phraseButtons(list);
    };
    form.addEventListener('focusin', e => {
      const f = e.target;
      if (!f.matches('input, textarea')) return;
      focusEl = f;
      const pt = f.closest('.point');
      focusCtx = pt ? { kind: 'point', i: Number(pt.dataset.i) } : { kind: f.name === 'ending' ? 'ending' : 'opening' };
      showSugg();
    });
    root.querySelector('#sugg').addEventListener('mousedown', e => { if (e.target.closest('[data-insert]')) e.preventDefault(); });
    root.querySelector('#sugg').addEventListener('click', e => {
      const b = e.target.closest('[data-insert]'); if (!b) return;
      const f = focusEl || form.opening;
      const s = f.selectionStart ?? f.value.length, en = f.selectionEnd ?? f.value.length;
      f.setRangeText(b.dataset.insert, s, en, 'end');
      const i = b.dataset.insert.indexOf('……');
      f.focus();
      if (i >= 0) f.setSelectionRange(s + i, s + i + 2);
      collect();
    });
    showSugg();

    root.querySelector('#go-write').addEventListener('click', () => {
      collect();
      const tmp = { id: 'nhap-' + t.id, topicId: t.id, data: JSON.parse(JSON.stringify(data)), text: this.toText(data) };
      Store.addOutline(tmp);
      location.hash = `#/viet/${t.id}?outline=${tmp.id}`;
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      collect();
      if (!data.thesis.trim()) { UI.toast('Hãy điền luận điểm trung tâm trước khi lưu.', 'bad'); form.thesis.focus(); return; }
      const filled = data.points.filter(p => (p.claim || '').trim());
      if (filled.length < 2) { UI.toast('Dàn ý cần ít nhất 2 luận điểm phụ.', 'bad'); return; }
      const used = new Set(filled.map(p => p.method).filter(Boolean));
      const res = await UI.checklist('outline', { intro: `Dàn ý có ${filled.length} luận điểm phụ, dùng ${used.size} phương pháp khác nhau.` });
      if (!res) return;
      const btn = form.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = 'Đang lưu…';
      const clean = Object.assign({}, data, { points: filled });
      const text = this.toText(clean);
      try {
        const r = await Api.call('submit', {
          type: 'outline', refId: t.id, title: t.title, content: text, data: clean, charCount: U.count(text).total,
          durationSec: Math.round((Date.now() - started) / 1000),
          checklistDone: res.done, checklistTotal: res.total, checklistMissed: res.missed, selfScore: res.selfScore, note: res.note
        });
        closed = true;
        Store.clearDraft(draftKey);
        Store.addMark('outline', t.id);
        Store.addOutline({ id: r.id, topicId: t.id, data: clean, text });
        Store.setHistory(null);
        const go = await UI.modal({
          title: 'Đã lưu dàn ý',
          body: `<p>Dàn ý cho đề <span class="zh">${U.esc(t.title)}</span> đã được lưu lên Sheet. Bạn có muốn viết bài ngay theo dàn ý này?</p>`,
          actions: [{ label: 'Để sau', value: false }, { label: 'Viết bài từ dàn ý này', kind: 'primary', value: true }]
        });
        location.hash = go ? `#/viet/${t.id}?outline=${r.id}` : '#/danyi';
      } catch (err) {
        UI.toast('Chưa lưu được: ' + err.message + ' Bản nháp vẫn được giữ trên máy.', 'bad');
        btn.disabled = false; btn.textContent = 'Tự chấm và lưu dàn ý';
      }
    });
  },

  /** Dạng chữ dễ đọc, được ghi vào cột content trên Sheet. */
  toText(d) {
    const out = [];
    if (d.opening) out.push('【开头】' + d.opening.trim());
    out.push('【中心论点】' + (d.thesis || '').trim());
    (d.points || []).forEach((p, i) => {
      const m = Store.method(p.method);
      out.push(`【分论点${U.ZH_NUM[i]}】${(p.claim || '').trim()}${m ? `（${m.name_zh}）` : ''}`);
      if ((p.evidence || '').trim()) out.push('    论据：' + p.evidence.trim());
    });
    if (d.ending) out.push('【结尾】' + d.ending.trim());
    return out.join('\n');
  }
};
