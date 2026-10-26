/* Thành phần giao diện dùng chung: thông báo, hộp thoại, checklist, trình soạn 稿纸. */
const UI = (() => {
  const $ = (sel, root = document) => root.querySelector(sel);

  function toast(msg, kind = '') {
    const t = U.el(`<div class="toast ${kind}" role="status">${U.esc(msg)}</div>`);
    $('#toast-host').appendChild(t);
    setTimeout(() => t.remove(), kind === 'bad' ? 6000 : 3200);
  }

  /** Hộp thoại. actions: [{label, kind, value}] → Promise trả về value của nút được bấm (null khi đóng). */
  function modal({ title, body, actions = [{ label: 'Đóng', value: null }], wide = false, onMount }) {
    return new Promise(resolve => {
      const back = U.el(`<div class="modal-back"><div class="modal" role="dialog" aria-modal="true" ${wide ? 'style="max-width:860px"' : ''}>
        <h2>${U.esc(title)}</h2><div class="modal-body"></div><div class="modal-actions"></div></div></div>`);
      const bodyEl = $('.modal-body', back);
      if (typeof body === 'string') bodyEl.innerHTML = body; else if (body) bodyEl.appendChild(body);
      const prevFocus = document.activeElement;
      const close = v => { back.remove(); document.removeEventListener('keydown', onKey); prevFocus && prevFocus.focus && prevFocus.focus(); resolve(v); };
      actions.forEach(a => {
        const b = U.el(`<button type="button" class="btn ${a.kind === 'primary' ? 'btn-primary' : ''}">${U.esc(a.label)}</button>`);
        b.addEventListener('click', () => {
          const v = typeof a.value === 'function' ? a.value(back) : a.value;
          if (v !== false) close(v);
        });
        $('.modal-actions', back).appendChild(b);
      });
      const onKey = e => { if (e.key === 'Escape') close(null); };
      document.addEventListener('keydown', onKey);
      back.addEventListener('click', e => { if (e.target === back) close(null); });
      document.body.appendChild(back);
      onMount && onMount(back);
      const f = back.querySelector('input, textarea, .modal-actions .btn-primary, .modal-actions .btn');
      f && f.focus();
    });
  }

  /** Checklist tự chấm theo phạm vi (essay / frame / outline). */
  function checklist(scope, { title = 'Tự chấm trước khi lưu', withScore = false, intro = '' } = {}) {
    const items = (Store.content.checklist || []).filter(c => String(c.scope || '').split(/[,，\s]+/).includes(scope));
    const groups = new Map();
    items.forEach(c => { const g = c.group || 'Khác'; if (!groups.has(g)) groups.set(g, []); groups.get(g).push(c); });
    const body = `${intro ? `<p class="muted" style="margin-bottom:6px">${intro}</p>` : ''}
      ${[...groups].map(([g, list]) => `<div class="check-group"><h3>${U.esc(g)}</h3>${list.map(c => `
        <label class="check-item"><input type="checkbox" data-id="${U.esc(c.id)}"><span>${U.esc(c.text_vi)}<span class="zh">${U.esc(c.text_zh || '')}</span></span></label>`).join('')}</div>`).join('')}
      ${withScore ? `<div class="row" style="margin-top:18px;align-items:flex-end">
        <label style="width:150px">Tự cho điểm (0–100)<input type="number" min="0" max="100" step="1" name="score" inputmode="numeric"></label></div>` : ''}
      <label style="margin-top:14px">Ghi chú cho bản thân<textarea class="field" name="note" rows="2" placeholder="Điều cần cải thiện lần sau…"></textarea></label>`;
    return modal({
      title, body,
      actions: [
        { label: 'Quay lại sửa', value: null },
        {
          label: 'Lưu bài', kind: 'primary', value: root => {
            const boxes = [...root.querySelectorAll('.check-item input')];
            const missed = boxes.filter(b => !b.checked).map(b => items.find(i => String(i.id) === b.dataset.id).text_vi);
            const scoreEl = root.querySelector('[name=score]');
            return {
              done: boxes.filter(b => b.checked).length, total: boxes.length, missed,
              selfScore: scoreEl && scoreEl.value !== '' ? Math.max(0, Math.min(100, Number(scoreEl.value))) : '',
              note: root.querySelector('[name=note]').value.trim()
            };
          }
        }
      ]
    });
  }

  /** Trình soạn thảo kẻ ô 稿纸. Mỗi ô = 1 chữ, hàng trống giữa các hàng chữ như giấy viết văn. */
  function gaozhi({ value = '', placeholder = '', rows = 8, onInput } = {}) {
    const wrap = U.el(`<div class="gz-wrap"><textarea class="gz" spellcheck="false" aria-label="Khung viết"></textarea></div>`);
    const ta = wrap.querySelector('textarea');
    ta.value = value;
    ta.placeholder = placeholder;
    const cell = () => parseFloat(getComputedStyle(ta).fontSize) || 24;
    const fit = () => {
      const c = cell();
      const cols = Math.max(8, Math.floor((wrap.clientWidth - 24) / c));
      ta.style.width = cols * c + 'px';
      grow();
    };
    const grow = () => {
      const lh = cell() * 2;
      ta.style.height = 'auto';
      const h = Math.max(ta.scrollHeight, rows * lh);
      ta.style.height = Math.ceil(h / lh) * lh + 'px';
    };
    const fire = () => { grow(); onInput && onInput(ta.value); };
    function insert(text, selectPlaceholder = true) {
      ta.focus();
      const start = ta.selectionStart, end = ta.selectionEnd;
      ta.setRangeText(text, start, end, 'end');
      if (selectPlaceholder) {
        const i = text.indexOf('……');
        if (i >= 0) ta.setSelectionRange(start + i, start + i + 2);
      }
      fire();
    }
    ta.addEventListener('input', fire);
    ta.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229 && !e.shiftKey && Store.prefs.indent) {
        e.preventDefault();
        insert('\n　　', false);
      }
    });
    ta.addEventListener('focus', () => {
      if (!ta.value && Store.prefs.indent) { ta.value = '　　'; fire(); }
    });
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(wrap);
    requestAnimationFrame(fit);
    return {
      el: wrap, ta, insert,
      get value() { return ta.value; },
      set value(v) { ta.value = v; grow(); }
    };
  }

  function indentToggle() {
    return `<label class="switch small"><input type="checkbox" data-pref="indent" ${Store.prefs.indent ? 'checked' : ''}><span>Tự lùi 2 ô đầu đoạn khi xuống dòng</span></label>`;
  }

  function methodChip(id) {
    const m = Store.method(id);
    if (!m) return `<span class="m-chip">${U.esc(id)}</span>`;
    return `<span class="m-chip"><b>${U.esc(m.name_zh)}</b><span>${U.esc(m.name_vi)}</span></span>`;
  }

  /** Nút gợi ý từ nối; bấm để chèn vào ô đang soạn. */
  function phraseButtons(list) {
    if (!list.length) return '<p class="muted small">Không có gợi ý.</p>';
    return `<div class="sugg">${list.map(p => `<button type="button" class="chip" data-insert="${U.esc(p.zh)}" title="${U.esc(p.vi)}">${U.esc(p.zh)}</button>`).join('')}</div>`;
  }
  const phrasesBy = pred => (Store.content.phrases || []).filter(pred);

  /** Khung hiển thị đề bài: đề tiếng Trung, nút xem bản dịch và gợi ý. */
  function topicBox(t) {
    const hints = U.lines(t.hints);
    return `<div class="panel prompt-box">
      <p class="${U.richClass()}">${U.rich(t.prompt_zh, { marks: false })}</p>
      <div class="prompt-tools">
        ${t.prompt_vi ? `<button type="button" class="link-btn" data-toggle-next="prompt-vi">Xem bản dịch</button>` : ''}
        ${hints.length ? `<button type="button" class="link-btn" data-toggle-next="prompt-hints">Gợi ý góc lập luận</button>` : ''}
      </div>
      ${t.prompt_vi ? `<div class="prompt-vi" data-part="prompt-vi" hidden>${U.esc(t.prompt_vi)}</div>` : ''}
      ${hints.length ? `<div class="prompt-hints" data-part="prompt-hints" hidden><ul>${hints.map(h => `<li>${U.esc(h)}</li>`).join('')}</ul></div>` : ''}
    </div>`;
  }

  function errorBox(err, retryLabel) {
    return `<div class="error-box"><p>${U.esc(err.message || String(err))}</p>${retryLabel ? `<p style="margin-top:10px"><button class="btn btn-sm" data-retry>${U.esc(retryLabel)}</button></p>` : ''}</div>`;
  }

  return { $, toast, modal, checklist, gaozhi, indentToggle, methodChip, phraseButtons, phrasesBy, topicBox, errorBox };
})();
