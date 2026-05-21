// Provides `window.storage` (get/set/delete) backed by localStorage so the
// app can run in a normal browser. If a host environment supplies its own
// `window.storage` we don't override it.
if (typeof window !== 'undefined' && !window.storage) {
  window.storage = {
    async get(key) {
      const value = window.localStorage.getItem(key);
      return value == null ? null : { value };
    },
    async set(key, value) {
      window.localStorage.setItem(key, value);
      return { ok: true };
    },
    async delete(key) {
      window.localStorage.removeItem(key);
      return { ok: true };
    },
  };
}
