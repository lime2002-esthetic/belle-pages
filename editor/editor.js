(async () => {
  'use strict';
  const byId=id=>document.getElementById(id), form=byId('store-form'), root=new URL('../',location.href);
  const query=new URLSearchParams(location.search);
  let id, checked=null, sourceText=null, fileSaved=false;
  const fields=['name','address','access','hours','closedDays','phone','courseLabel','firstPrice','regularPrice','repeatPrice','bookingUrl','mapEmbedUrl'];
  const blank=()=>({enabled:false,name:'',address:[''],access:'',hours:'',closedDays:'',phone:'',courseLabel:'',firstPrice:null,regularPrice:null,repeatPrice:null,bookingUrl:'',mapEmbedUrl:''});
  function tell(text,error=false){byId('form-status').textContent=text;byId('form-status').classList.toggle('error',error);}
  function stage(n){
    form.hidden=n!==1;byId('preview-panel').hidden=n!==2;byId('publish-panel').hidden=n!==3;
    for(let i=1;i<=3;i++){const el=byId(`step-${i}`);if(i===n)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');}
    tell('');byId('heading').scrollIntoView({behavior:'instant',block:'start'});
  }
  function mapUrl(value){const match=value.match(/\bsrc\s*=\s*["']([^"']+)["']/i);return(match?match[1]:value.trim()).replace(/&amp;/g,'&');}
  function read(){const data=new FormData(form),store={enabled:true};for(const key of fields){let value=String(data.get(key)??'').trim();store[key]=key==='address'?value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean):key.endsWith('Price')?(value===''?null:Number(value)):key==='mapEmbedUrl'?mapUrl(value):value;}return store;}
  function same(a,b){return Object.keys(a).every(key=>JSON.stringify(a[key])===JSON.stringify(b[key]));}
  async function latest(){return fetch(new URL(`config/stores/${id}.json`,root),{cache:'no-store'});}
  function changed(){checked=null;fileSaved=false;byId('upload-link').classList.add('disabled');byId('upload-link').setAttribute('aria-disabled','true');byId('check-published').disabled=true;byId('public-link').hidden=true;byId('publish-status').textContent='';}
  byId('new-page').addEventListener('click',()=>{const url=new URL(location.href);url.search=`?store=shop-${crypto.randomUUID().slice(0,8)}&new=1`;location.href=url.href;});
  byId('open-existing').addEventListener('click',()=>{
    try{const url=new URL(byId('existing-url').value);if(url.origin!==root.origin||url.pathname!==root.pathname)throw Error('このサイトの公開URLを貼り付けてください。');const key=BelleStore.id(url.searchParams.get('store')||'shiki');location.href=`?store=${encodeURIComponent(key)}`;}
    catch(error){byId('home-status').textContent=error.message;}
  });
  if(!query.has('store')){byId('home').hidden=false;return;}
  byId('workspace').hidden=false;
  const frame=byId('preview-frame');
  window.addEventListener('message',event=>{if(event.origin===location.origin&&event.source===frame.contentWindow&&event.data?.type==='belle-preview-ready'&&event.data.id===id&&checked)frame.contentWindow.postMessage({type:'belle-store-preview',id,store:checked},location.origin);});
  try{
    id=BelleStore.id(query.get('store'));const response=await latest();let store;
    if(response.ok){sourceText=await response.text();store=JSON.parse(sourceText);}
    else if(response.status===404&&query.get('new')==='1')store=blank();
    else throw Error('店舗が見つかりません。「店舗を選び直す」から始めてください。');
    for(const key of fields){const value=store[key];form.elements.namedItem(key).value=key==='address'?(value||['']).join('\n'):(value??'');}
    byId('heading').textContent=store.name?`${store.name}のページを変更`:'新しい店舗ページを作る';
    document.title=store.name?`${store.name}｜ページの管理`:'Belle｜新しい店舗ページ';
    byId('load-status').textContent=store.enabled?'公開中の内容を読み込みました。':'未公開です。店舗情報と料金を入力してください。';
    byId('upload-link').href='https://github.com/lime2002-esthetic/belle-pages/upload/main/config/stores';
    const publicUrl=new URL('.',root);publicUrl.searchParams.set('store',id);byId('public-link').href=publicUrl.href;
    const editUrl=new URL(location.href);byId('edit-link').href=editUrl.href;
    byId('file-instruction').textContent=`ファイル名は「${id}.json」です。中身を開く必要はありません。`;
    stage(1);
    form.addEventListener('input',changed);form.addEventListener('change',changed);
    form.addEventListener('submit',event=>{event.preventDefault();try{
      checked=BelleStore.validate(read());fileSaved=false;
      const summary=byId('preview-summary');summary.replaceChildren();
      const yen=value=>Number(value).toLocaleString('ja-JP')+'円';
      for(const[label,value]of[['店舗名',checked.name],['施術',checked.courseLabel],['初回料金',yen(checked.firstPrice)],['通常料金',yen(checked.regularPrice)],['継続料金',yen(checked.repeatPrice)+'〜'],['住所',checked.address.join('\n')],['営業時間',checked.hours],['定休日',checked.closedDays],['電話番号',checked.phone],['予約先',checked.bookingUrl]]){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;summary.append(dt,dd);}
      const url=new URL('.',root);url.searchParams.set('store',id);url.searchParams.set('preview','1');frame.src=url.href;stage(2);
    }catch(error){tell(error.message,true);}});
    byId('edit-again').addEventListener('click',()=>stage(1));
    byId('to-publish').addEventListener('click',()=>stage(3));byId('back-preview').addEventListener('click',()=>stage(2));
    byId('upload-link').addEventListener('click',event=>{if(!fileSaved)event.preventDefault();});
    byId('download-button').addEventListener('click',async()=>{try{
      if(!checked||!same(checked,read()))throw Error('入力を確認し直してください。');
      const response=await latest();
      if(sourceText===null){if(response.status!==404)throw Error('店舗情報が更新されています。画面を開き直してください。');}
      else if(!response.ok||await response.text()!==sourceText)throw Error('店舗情報が別の操作で更新されました。画面を開き直してください。');
      const blob=new Blob([JSON.stringify(checked,null,2)+'\n'],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      fileSaved=true;byId('upload-link').classList.remove('disabled');byId('upload-link').setAttribute('aria-disabled','false');byId('check-published').disabled=false;
      byId('file-instruction').textContent=`「${id}.json」を保存しました。次は②へ進んでください。`;
    }catch(error){tell(error.message,true);}});
    byId('check-published').addEventListener('click',async()=>{const button=byId('check-published');button.disabled=true;byId('publish-status').textContent='確認しています…';try{
      const response=await latest();
      if(!response.ok||!same(checked,await response.json())){byId('publish-status').textContent='まだ反映されていません。②で「Commit changes」を押したことを確認し、数分後にもう一度押してください。';return;}
      byId('publish-status').textContent='公開できました。下のボタンでページを開けます。';byId('public-link').hidden=false;
      sourceText=JSON.stringify(checked,null,2)+'\n';
    }catch{byId('publish-status').textContent='通信を確認して、もう一度押してください。';}finally{button.disabled=false;}});
  }catch(error){byId('load-status').textContent=error.message;byId('load-status').setAttribute('role','alert');}
})();
