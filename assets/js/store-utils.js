/* 公開ページと入力画面で同じ店舗情報の確認方法を使います。 */
window.BelleStore = Object.freeze({
  id(value) {
    if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(value)) throw new Error('店舗の指定をご確認ください。');
    return value;
  },
  validate(store) {
    if (!store || typeof store.enabled !== 'boolean') throw new Error('公開状態をご確認ください。');
    for (const [key, label] of Object.entries({name:'店舗名',courseLabel:'施術名・時間',access:'アクセス',hours:'営業時間',closedDays:'定休日',phone:'電話番号'})) {
      if (typeof store[key] !== 'string' || !store[key].trim()) throw new Error(`${label}を入力してください。`);
    }
    if (!Array.isArray(store.address) || !store.address.length || store.address.some(s => typeof s !== 'string' || !s.trim())) throw new Error('住所を入力してください。');
    let booking, map;
    try { booking = new URL(store.bookingUrl); } catch { throw new Error('予約先のURLを入力してください。'); }
    if (!['http:', 'https:'].includes(booking.protocol) || booking.username || booking.password) throw new Error('予約先には http:// または https:// で始まるURLを入力してください。');
    try { map = new URL(store.mapEmbedUrl); } catch { throw new Error('Googleマップの埋め込み用URLを入力してください。'); }
    if (map.protocol !== 'https:' || !['www.google.com','maps.google.com','www.google.co.jp'].includes(map.hostname) || !map.pathname.startsWith('/maps/embed') || map.username || map.password) throw new Error('地図にはGoogleマップの「地図を埋め込む」で取得したURLを入力してください。');
    if (!/^\+?\d{9,15}$/.test(this.phone(store.phone))) throw new Error('電話番号を数字とハイフンで入力してください。');
    for (const [key,label] of Object.entries({firstPrice:'初回料金',regularPrice:'通常料金',repeatPrice:'継続料金'})) {
      if (!Number.isInteger(store[key]) || store[key] < 0 || store[key] > 99999) throw new Error(`${label}を0〜99,999円の数字で入力してください。`);
    }
    return store;
  },
  phone(value) { return value.replace(/[\s()（）\-ー－]/g, ''); }
});
