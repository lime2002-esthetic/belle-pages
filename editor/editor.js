(async () => {
  'use strict';
  const status = document.getElementById('load-status');
  const form = document.getElementById('store-form');
  const message = document.getElementById('form-status');
  const download = document.getElementById('download-button');
  const frame = document.getElementById('preview-frame');
  let checked = null, id, sourceText;
  const root = new URL('../', location.href);
  function mapUrl(value) {
    value = value.trim();
    const match = value.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    return (match ? match[1] : value).replace(/&amp;/g, '&');
  }
  function read() {
    const f = new FormData(form);
    return {enabled:f.get('enabled') === 'true',name:f.get('name').trim(),bookingLabel:f.get('bookingLabel').trim(),address:f.get('address').split(/\r?\n/).map(s=>s.trim()).filter(Boolean),access:f.get('access').trim(),hours:f.get('hours').trim(),closedDays:f.get('closedDays').trim(),bookingUrl:f.get('bookingUrl').trim(),mapEmbedUrl:mapUrl(f.get('mapEmbedUrl')),phone:f.get('phone').trim()};
  }
  function tell(text, error = false) { message.textContent = text; message.classList.toggle('error', error); }
  function invalidate() {
    checked = null;
    download.disabled = true;
    document.getElementById('upload-panel').hidden = true;
    document.getElementById('preview-panel').hidden = true;
    tell('変更を反映するには、もう一度「入力した内容を確認する」を押してください。');
  }
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== frame.contentWindow || event.data?.type !== 'belle-preview-ready' || event.data.id !== id || !checked) return;
    frame.contentWindow.postMessage({type:'belle-store-preview',id,store:checked},location.origin);
  });
  try {
    id = BelleStore.id(new URLSearchParams(location.search).get('store') || 'sakae');
    const url = new URL(`config/stores/${id}.json`, root);
    const response = await fetch(url,{cache:'no-store'});
    if (!response.ok) throw new Error('この店舗の入力画面はまだ用意されていません。管理者に店舗名をお知らせください。');
    sourceText = await response.text();
    const store = JSON.parse(sourceText);
    for (const [key,value] of Object.entries(store)) {
      if (!form.elements.namedItem(key)) continue;
      form.elements.namedItem(key).value = key === 'address' ? value.join('\n') : String(value);
    }
    document.getElementById('heading').textContent = `${store.name}の店舗情報`;
    document.title = `${store.name}｜店舗情報の入力`;
    status.textContent = store.enabled ? '現在公開されている情報を読み込みました。' : 'この店舗はまだ公開されていません。店舗情報を入力してください。';
    form.hidden = false;
    document.getElementById('upload-link').href = `https://github.com/lime2002-esthetic/belle-pages/upload/main/config/stores`;
    const publicUrl = new URL('.',root);publicUrl.searchParams.set('store',id);
    document.getElementById('public-link').href = publicUrl.href;
    form.addEventListener('input', invalidate);
    form.addEventListener('change', invalidate);
    form.addEventListener('submit', event => {
      event.preventDefault();
      try {
        checked = BelleStore.validate(read());
        const summary = document.getElementById('preview-summary');summary.replaceChildren();
        for (const [label,value] of [['店舗名',checked.name],['住所',checked.address.join('\n')],['アクセス',checked.access],['営業時間',checked.hours],['定休日',checked.closedDays],['電話番号',checked.phone],['予約先',checked.bookingUrl],['公開状態',checked.enabled?'公開する':'下書きのまま']]) {
          const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;summary.append(dt,dd);
        }
        document.getElementById('preview-panel').hidden = false;
        const previewUrl = new URL('.',root);previewUrl.searchParams.set('store',id);previewUrl.searchParams.set('preview','1');
        frame.src = previewUrl.href;
        download.disabled = false;
        tell('下のプレビューで、住所・予約先・電話番号・地図をご確認ください。まだ公開されていません。');
      } catch(error) { checked=null;download.disabled=true;tell(error.message,true); }
    });
    download.addEventListener('click',async () => {
      try {
        if (!checked || JSON.stringify(checked) !== JSON.stringify(read())) throw new Error('入力内容をもう一度確認してください。');
        const latest = await fetch(url,{cache:'no-store'});
        if (!latest.ok || await latest.text() !== sourceText) throw new Error('この店舗の情報が別の操作で更新されています。この画面を開き直してから入力してください。');
        const blob = new Blob([JSON.stringify(checked,null,2)+'\n'],{type:'application/json;charset=utf-8'});
        const objectUrl=URL.createObjectURL(blob),a=document.createElement('a');a.href=objectUrl;a.download=`${id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(objectUrl),1000);
        document.getElementById('file-instruction').textContent = `保存した「${id}.json」を、そのまま登録します。ファイルの中身を開いたり編集したりする必要はありません。同じ名前のファイルが既にダウンロード先にあると「${id} (1).json」などになるため、登録前に「${id}.json」に戻してください。`;
        document.getElementById('upload-panel').hidden=false;
        tell('保存用ファイルを作成しました。下の手順でGitHubへ登録すると反映されます。');
      } catch(error) { tell(error.message,true); }
    });
  } catch(error) { status.textContent=error.message;status.setAttribute('role','alert'); }
})();
