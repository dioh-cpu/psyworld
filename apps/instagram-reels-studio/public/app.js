const $=s=>document.querySelector(s);
let items=[];
let localPreviewUrl=null;

function esc(s=''){
  return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function videoDetails(video,element){
  const duration=Number.isFinite(video.duration)?`${video.duration.toFixed(2).replace('.',',')} s`:'—';
  const size=video.videoWidth&&video.videoHeight?`${video.videoWidth} × ${video.videoHeight}`:'—';
  element.textContent=`Duração: ${duration} · Resolução: ${size}`;
}

async function status(){
  const s=await fetch('/api/status').then(r=>r.json());
  $('#connectState').textContent=s.appConfigured?'Pronto para autorizar':'App Meta não configurado';
  $('#scopeText').textContent=`${s.loginFlow||'Instagram API with Unified Login'} · permissões usadas: ${(s.requiredPermissions||[]).join(' · ')}`;
  if(!s.appConfigured){$('#connect').title='Defina IG_APP_ID e IG_APP_SECRET no ambiente do servidor';$('#connect').textContent='Configurar app Meta';}
  const a=await fetch('/api/account').then(r=>r.json());
  if(a.connected){$('#dot').classList.add('on');$('#accountText').textContent=`@${a.username||'conectado'}`;$('#connect').textContent='Desconectar';$('#connect').classList.remove('primary');}
}
async function load(){
  const response=await fetch('/api/queue');
  if(!response.ok){$('#queue').innerHTML='<div class="empty"><b>Não foi possível carregar a fila</b><small>Atualize a página e tente novamente.</small></div>';return;}
  items=await response.json();
  render();
}
function render(){
  const f=$('#filter').value;
  const list=items.filter(x=>f==='Tudo'||x.status===f);
  $('#countAll').textContent=items.length;
  $('#countReview').textContent=items.filter(x=>x.status==='Aguardando aprovação').length;
  $('#countScheduled').textContent=items.filter(x=>x.status==='Agendado').length;
  $('#countPosted').textContent=items.filter(x=>x.status==='Publicado').length;
  const box=$('#queue');
  if(!list.length){box.innerHTML='<div class="empty"><span>✳</span><b>Sua fila começa aqui</b><small>Crie um rascunho e revise a prévia antes de aprovar.</small></div>';return;}
  box.innerHTML=list.map(x=>`<article class="item"><div class="itembody"><div class="itemhead"><b>${esc(x.series)}${x.episode?` · Ep. ${esc(x.episode)}`:''}</b><span class="badge">${esc(x.status)}</span></div>${x.video_path?`<video class="saved-preview" controls playsinline preload="metadata" data-video-path="${esc(x.video_path)}" aria-label="Prévia de ${esc(x.series)}"></video><small class="video-details" data-details-for="${esc(x.video_path)}">Carregando prévia…</small>`:''}<p>${esc(x.caption)}</p>${Array.isArray(x.products)&&x.products.length?'<span class="badge">Produtos para revisar</span>':''}<div class="item-actions"><button data-id="${esc(x.id)}" data-status="Aguardando aprovação">Pedir aprovação</button><button data-id="${esc(x.id)}" data-status="Aprovado">Aprovar</button></div></div></article>`).join('');
  box.querySelectorAll('video[data-video-path]').forEach(async video=>{
    const path=video.dataset.videoPath;
    const detail=box.querySelector(`[data-details-for="${CSS.escape(path)}"]`);
    try{
      const response=await fetch(`/api/video-url?path=${encodeURIComponent(path)}`);
      if(!response.ok)throw new Error('preview unavailable');
      const data=await response.json();
      video.addEventListener('loadedmetadata',()=>videoDetails(video,detail),{once:true});
      video.src=data.url;
      video.load();
    }catch{detail.textContent='Prévia temporariamente indisponível.';}
  });
  box.querySelectorAll('button[data-id]').forEach(button=>button.onclick=async()=>{
    const response=await fetch('/api/queue/'+encodeURIComponent(button.dataset.id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:button.dataset.status})});
    if(response.ok)load();
  });
}

const videoInput=$('input[name="video"]');
videoInput.addEventListener('change',()=>{
  const file=videoInput.files?.[0];
  const container=$('#selectedPreview');
  const video=$('#localVideoPreview');
  const details=$('#localVideoDetails');
  if(localPreviewUrl)URL.revokeObjectURL(localPreviewUrl);
  if(!file){container.hidden=true;video.removeAttribute('src');return;}
  localPreviewUrl=URL.createObjectURL(file);
  video.src=localPreviewUrl;
  video.onloadedmetadata=()=>videoDetails(video,details);
  container.hidden=false;
});

$('#newItem').onsubmit=async event=>{
  event.preventDefault();
  const form=event.currentTarget;
  if(!form.reportValidity())return;
  const data=new FormData(form);
  const file=data.get('video');
  let videoPath=null;
  if(file&&file.size){
    if(file.type!=='video/mp4'||file.size>1024*1024*1024){alert('Envie MP4 de até 1 GB.');return;}
    const reservation=await fetch('/api/upload-url',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({filename:file.name,contentType:file.type,size:file.size})});
    const upload=await reservation.json();
    if(!reservation.ok||!upload.token){alert(upload.error||'Falha ao iniciar upload.');return;}
    const signed=new URL(upload.signedUrl,window.location.origin);
    signed.searchParams.set('token',upload.token);
    const put=await fetch(signed,{method:'PUT',headers:{'Content-Type':file.type,'x-upsert':'false'},body:file});
    if(!put.ok){alert('Upload para armazenamento privado falhou.');return;}
    videoPath=upload.path;
  }
  const item={series:data.get('series'),episode:data.get('episode'),caption:data.get('caption'),scheduleAt:data.get('scheduleAt'),products:data.get('products')?data.get('products').split('\n').filter(Boolean):[],videoPath,status:'Rascunho'};
  const response=await fetch('/api/queue',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(item)});
  if(!response.ok){const result=await response.json().catch(()=>({}));alert(result.error||'Não foi possível salvar o rascunho.');return;}
  form.reset();
  $('#selectedPreview').hidden=true;
  if(localPreviewUrl)URL.revokeObjectURL(localPreviewUrl);
  localPreviewUrl=null;
  load();
};
$('#filter').onchange=render;
$('#connect').onclick=async()=>{
  const account=await fetch('/api/account').then(r=>r.json());
  if(account.connected){await fetch('/auth/logout',{method:'POST'});location.reload();}
  else location.href='/auth/instagram';
};
status();
load();
