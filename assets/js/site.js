(async () => {
  'use strict';
  const status = document.getElementById('status');
  const query = new URLSearchParams(location.search);
  function show(store, preview = false) {
    if (store.enabled !== true && !preview) throw new Error('この店舗のページは公開されていません。');
    BelleStore.validate(store);
    document.title = `${store.name}｜ハーブピーリング`;
    const fields = store;
    document.querySelectorAll('[data-field]').forEach(el => { el.textContent = fields[el.dataset.field]; });
    document.querySelectorAll('[data-price]').forEach(el => { el.textContent = Number(store[el.dataset.price]).toLocaleString('ja-JP'); });
    const address = document.querySelector('[data-address]');
    address.replaceChildren();
    store.address.forEach((line, i) => {
      if (i) address.append(document.createElement('br'));
      address.append(document.createTextNode(line));
    });
    document.querySelectorAll('[data-booking]').forEach(el => { el.href = store.bookingUrl; el.textContent = 'WEB予約はこちら'; });
    document.querySelectorAll('[data-phone]').forEach(el => {
      el.href = `tel:${BelleStore.phone(store.phone)}`;
      el.textContent = el.hasAttribute('data-phone-number') ? store.phone : `電話で予約　${store.phone}`;
    });
    const map = document.querySelector('[data-map]');
    map.src = store.mapEmbedUrl;
    map.title = `${store.name}のGoogleマップ`;
    status.hidden = true;
    document.querySelector('main').hidden = false;
  }
  function fail(error) { status.hidden = false; status.textContent = error.message; status.setAttribute('role','alert'); }
  try {
    const id = BelleStore.id(query.get('store') || 'shiki');
    if (query.get('preview') === '1' && parent !== window) {
      status.textContent = '入力内容のプレビューを準備しています。';
      window.addEventListener('message', event => {
        if (event.origin !== location.origin || event.source !== parent || event.data?.type !== 'belle-store-preview' || event.data.id !== id) return;
        try { show(event.data.store, true); } catch (error) { fail(error); }
      });
      parent.postMessage({type:'belle-preview-ready',id},location.origin);
      return;
    }
    const response = await fetch(`./config/stores/${id}.json`, { cache: 'no-store' });
    if (!response.ok) throw new Error('この店舗のページは公開されていません。URLをご確認ください。');
    show(await response.json());
  } catch (error) { fail(error); }
})();
