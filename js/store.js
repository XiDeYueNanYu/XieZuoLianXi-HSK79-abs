/* Trạng thái và bộ nhớ trình duyệt (phiên đăng nhập, nội dung tải từ Sheet, bản nháp). */
const Store = (() => {
  const P = (window.APP_CONFIG && APP_CONFIG.STORAGE_PREFIX) || 'ylw';
  const read = (k, d) => { try { const v = localStorage.getItem(`${P}.${k}`); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const write = (k, v) => { try { v === undefined ? localStorage.removeItem(`${P}.${k}`) : localStorage.setItem(`${P}.${k}`, JSON.stringify(v)); return true; } catch (e) { return false; } };

  const s = {
    session: read('session', null),       // { token, user: {username, displayName}, expiresAt }
    content: read('content', null),       // { methods, phrases, identify, frames, topics, checklist, config, loadedAt }
    prefs: Object.assign({ pinyin: false, indent: true }, read('prefs', {})),
    history: null                          // bộ nhớ tạm của trang Lịch sử
  };

  const userKey = k => `u.${s.session ? s.session.user.username : '_'}.${k}`;

  return {
    get session() { return s.session; },
    setSession(v) { s.session = v; write('session', v || undefined); },
    get content() { return s.content; },
    setContent(v) { s.content = v; if (!write('content', v)) console.warn('Không lưu được nội dung vào trình duyệt.'); },
    get prefs() { return s.prefs; },
    setPref(k, v) { s.prefs[k] = v; write('prefs', s.prefs); },
    get history() { return s.history; },
    setHistory(v) { s.history = v; },

    // Bản nháp theo từng người dùng
    draft(key) { return read(userKey('draft.' + key), null); },
    saveDraft(key, v) { write(userKey('draft.' + key), v); },
    clearDraft(key) { write(userKey('draft.' + key), undefined); },

    // Đánh dấu bài đã làm (để gợi ý câu chưa làm)
    marks(kind) { return new Set(read(userKey('done.' + kind), [])); },
    addMark(kind, id) { const set = this.marks(kind); set.add(id); write(userKey('done.' + kind), [...set]); },

    // Dàn ý đã lưu gần đây (để mở nhanh khi viết bài)
    outlines() { return read(userKey('outlines'), []); },
    addOutline(o) { const list = this.outlines().filter(x => x.id !== o.id); list.unshift(o); write(userKey('outlines'), list.slice(0, 30)); },
    findOutline(id) { return this.outlines().find(x => x.id === id) || null; },

    // Tra cứu nhanh nội dung
    method(id) { return (s.content?.methods || []).find(m => m.id === id) || null; },
    topic(id) { return (s.content?.topics || []).find(t => t.id === id) || null; },
    cfg(key, d) { const v = s.content?.config?.[key]; return v === undefined || v === '' ? d : v; }
  };
})();
