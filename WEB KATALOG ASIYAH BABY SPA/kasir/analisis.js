// Analisis treatment per terapis: filter, breakdown per layanan dan kategori, serta catatan evaluatif.
(function(){
if(window.openAT)return;
var G=function(i){return document.getElementById(i)},Rp=function(n){return 'Rp'+Math.round(n||0).toLocaleString('id-ID')},Pc=function(a,b){return b?Math.round(a/b*100):0};
var A={p:'bln',f:'',t:'',ter:'',kat:'',lok:'',q:'',rows:[]};
function ed(a,b){var m=[],i,j;for(i=0;i<=a.length;i++)m[i]=[i];for(j=1;j<=b.length;j++)m[0][j]=j;for(i=1;i<=a.length;i++)for(j=1;j<=b.length;j++)m[i][j]=Math.min(m[i-1][j]+1,m[i][j-1]+1,m[i-1][j-1]+(a[i-1]==b[j-1]?0:1));return m[a.length][b.length]}
function norm(n,L){n=String(n||'').trim().toUpperCase();if(!n)return'(TANPA TERAPIS)';if(L.indexOf(n)>=0)return n;for(var i=0;i<L.length;i++)if(ed(n,L[i])<=1)return L[i];return n}
// Menghitung model analisis dari baris transaksi dan filter F
function calc(rows,F,L){var T={},SV={},tot={rev:0,qty:0,tx:0,tr:0,tips:0,hc:0},kats={},ters={};
rows.forEach(function(r){if(r.status!=='Lunas')return;var it=[];try{it=JSON.parse(r.item||'[]')}catch(e){}
 var q=(F.q||'').toLowerCase(),mt=it.filter(function(i){return!q||String(i.nama).toLowerCase().indexOf(q)>=0});if(!mt.length)return;
 var kat=r.kategori||'-',hc=String(r.lokasi||'Outlet').trim().toLowerCase()!=='outlet',ter=norm(r.terapis,L);kats[kat]=1;ters[ter]=1;
 if(F.kat&&kat!==F.kat)return;if(F.lok&&((F.lok==='hc')!==hc))return;if(F.ter&&ter!==F.ter)return;
 var sub=+r.subtotal||it.reduce(function(a,i){return a+i.qty*i.harga},0),k=sub?(sub-(+r.diskon||0))/sub:1,tg=String(r.waktu).slice(0,10);
 var t=T[ter]||(T[ter]={ter:ter,qty:0,rev:0,tx:0,tr:0,tips:0,hc:0,noTr:0,days:{},sv:{},kat:{},hasFee:false,feeK:0});
 t.tx++;t.tr+=+r.transport||0;t.tips+=+r.tips||0;t.days[tg]=1;tot.tx++;tot.tr+=+r.transport||0;tot.tips+=+r.tips||0;
 if(hc){t.hc++;tot.hc++;if(!(+r.transport))t.noTr++}
 if('fee_terapis' in r){t.hasFee=true;if(!(+r.fee_terapis))t.feeK++}
 mt.forEach(function(i){var n=+i.qty||0,rev=n*(+i.harga||0)*k;t.qty+=n;t.rev+=rev;tot.qty+=n;tot.rev+=rev;
  var s=t.sv[i.nama]||(t.sv[i.nama]={q:0,rev:0});s.q+=n;s.rev+=rev;t.kat[kat]=(t.kat[kat]||0)+rev;
  var g=SV[i.nama]||(SV[i.nama]={q:0,rev:0,by:{}});g.q+=n;g.rev+=rev;g.by[ter]=(g.by[ter]||0)+n})});
return{T:T,SV:SV,tot:tot,kats:Object.keys(kats).sort(),ters:Object.keys(ters).sort()}}
// Catatan evaluatif per terapis
function notes(t,m){var o=[],all=Object.keys(m.T).length,rk=Object.keys(m.T).sort(function(a,b){return m.T[b].rev-m.T[a].rev}).indexOf(t.ter)+1,avg=t.qty?t.rev/t.qty:0,tavg=m.tot.qty?m.tot.rev/m.tot.qty:0,d=Object.keys(t.days).length;
 o.push('Peringkat omzet '+rk+' dari '+all+', kontribusi '+Pc(t.rev,m.tot.rev)+'% dari total.');
 if(tavg)o.push('Rata-rata nilai layanan '+Rp(avg)+', '+Math.abs(Math.round((avg/tavg-1)*100))+'% '+(avg>=tavg?'di atas':'di bawah')+' rata-rata tim ('+Rp(tavg)+').');
 var ks=Object.keys(t.kat).sort(function(a,b){return t.kat[b]-t.kat[a]}),sv=Object.keys(t.sv).sort(function(a,b){return t.sv[b].rev-t.sv[a].rev});
 if(ks.length){var p=Pc(t.kat[ks[0]],t.rev);o.push(p>=50?'Fokus di kategori "'+ks[0]+'" ('+p+'% omzet).':'Layanan beragam: '+ks.length+' kategori, terbesar "'+ks[0]+'" ('+p+'%).')}
 if(sv.length&&Pc(t.sv[sv[0]].rev,t.rev)>=35)o.push('Omzet bergantung pada "'+sv[0]+'" ('+Pc(t.sv[sv[0]].rev,t.rev)+'%).');
 if(sv.length<4&&t.qty>=10)o.push('Baru menangani '+sv.length+' jenis layanan, ada peluang pelatihan layanan lain.');
 if(d)o.push('Aktif '+d+' hari, rata-rata '+(t.qty/d).toFixed(1)+' layanan per hari.');
 if(t.hc)o.push(t.hc+' kunjungan homecare ('+Pc(t.hc,t.tx)+'% transaksi)'+(t.noTr?', '+t.noTr+' di antaranya tanpa ongkos transport, perlu dicek.':'.'));
 if(t.tips)o.push('Tips diterima '+Rp(t.tips)+' (sekitar '+Rp(t.tips/t.tx)+' per transaksi).');
 if(t.hasFee&&t.feeK)o.push('Fee belum diisi pada '+t.feeK+' dari '+t.tx+' transaksi.');
 return o}
function rng(p){var d=new Date(),y=d.getFullYear(),m=d.getMonth();
 if(p==='hari')return[iso(d),iso(d)];if(p==='7')return[iso(ad(d,-6)),iso(d)];if(p==='30')return[iso(ad(d,-29)),iso(d)];
 if(p==='bln')return[iso(new Date(y,m,1)),iso(d)];if(p==='lalu')return[iso(new Date(y,m-1,1)),iso(new Date(y,m,0))];return[A.f,A.t]}
function opt(a,v,all){return'<option value="">'+all+'</option>'+a.map(function(x){return'<option value="'+esc(x)+'"'+(x===v?' selected':'')+'>'+esc(x)+'</option>'}).join('')}
function csv(m){var r=[['terapis','kategori','layanan','jumlah','omzet']];Object.keys(m.T).forEach(function(n){Object.keys(m.T[n].sv).forEach(function(s){r.push([n,'',s,m.T[n].sv[s].q,Math.round(m.T[n].sv[s].rev)])})});
 var b=new Blob(['\ufeff'+r.map(function(x){return x.map(function(c){return'"'+String(c).replace(/"/g,'""')+'"'}).join(',')}).join('\n')],{type:'text/csv'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='analisis-terapis_'+A.f+'_'+A.t+'.csv';a.click()}
function view(){var L=((typeof D!=='undefined'&&D.terapis)||[]).map(function(x){return String(x).trim().toUpperCase()}),m=calc(A.rows,A,L),tt=m.tot,tavg=tt.qty?tt.rev/tt.qty:0;A.m=m;
 var ts=Object.keys(m.T).sort(function(a,b){return m.T[b].rev-m.T[a].rev}),h='';
 var kp=[['Layanan',tt.qty],['Omzet',Rp(tt.rev)],['Rata-rata/layanan',Rp(tavg)],['Transaksi',tt.tx],['Homecare',Pc(tt.hc,tt.tx)+'%'],['Transport',Rp(tt.tr)],['Tips',Rp(tt.tips)]];
 h+='<div class="ak">'+kp.map(function(x){return'<div><small>'+x[0]+'</small><b>'+x[1]+'</b></div>'}).join('')+'</div>';
 if(!ts.length)h+='<div class="ac m">Tidak ada data untuk filter ini.</div>';
 h+=ts.map(function(n,ix){var t=m.T[n],sv=Object.keys(t.sv).sort(function(a,b){return t.sv[b].rev-t.sv[a].rev}),ks=Object.keys(t.kat).sort(function(a,b){return t.kat[b]-t.kat[a]}),avg=t.qty?t.rev/t.qty:0,df=tavg?Math.round((avg/tavg-1)*100):0;
  return'<details class="ac"'+(ix<1||A.ter?' open':'')+'><summary><b>'+(ix+1)+'. '+esc(n)+'</b> <span class="m">'+t.qty+' layanan · '+Rp(t.rev)+' · '+Pc(t.rev,tt.rev)+'% · rata² '+Rp(avg)+' <span style="color:'+(df>=0?'var(--ok)':'var(--bad)')+'">'+(df>=0?'▲':'▼')+Math.abs(df)+'%</span></span></summary>'
  +'<div class="tw"><table><tr><th>Layanan</th><th>Jml</th><th>Omzet</th><th>%</th><th>Rata²</th></tr>'+sv.map(function(s){var x=t.sv[s];return'<tr><td>'+esc(s)+'</td><td>'+x.q+'</td><td>'+Rp(x.rev)+'</td><td>'+Pc(x.rev,t.rev)+'%</td><td>'+Rp(x.q?x.rev/x.q:0)+'</td></tr>'}).join('')+'</table></div>'
  +'<div style="margin:10px 0">'+ks.map(function(k){var p=Pc(t.kat[k],t.rev);return'<div style="display:flex;gap:8px;align-items:center;font-size:12px;margin:3px 0"><span style="width:110px">'+esc(k)+'</span><div style="flex:1"><div class="bar" style="width:'+p+'%"></div></div><span>'+p+'%</span></div>'}).join('')+'</div>'
  +'<b style="font-size:13px">Catatan evaluasi</b><ul class="ng">'+notes(t,m).map(function(x){return'<li>'+esc(x)+'</li>'}).join('')+'</ul></details>'}).join('');
 var kc=Object.keys(m.T).reduce(function(a,n){Object.keys(m.T[n].kat).forEach(function(k){a[k]=(a[k]||0)+m.T[n].kat[k]});return a},{}),kk=Object.keys(kc).sort(function(a,b){return kc[b]-kc[a]}).slice(0,8);
 if(ts.length>1&&kk.length)h+='<div class="ac"><b>Matriks terapis × kategori</b> <span class="m">(omzet; warna makin pekat = makin besar)</span><div class="tw"><table><tr><th>Terapis</th>'+kk.map(function(k){return'<th>'+esc(k)+'</th>'}).join('')+'</tr>'+ts.map(function(n){var mx=Math.max.apply(null,kk.map(function(k){return m.T[n].kat[k]||0}))||1;return'<tr><td>'+esc(n)+'</td>'+kk.map(function(k){var v=m.T[n].kat[k]||0;return'<td style="background:rgba(47,159,216,'+(v/mx*.45).toFixed(2)+')">'+(v?Rp(v):'-')+'</td>'}).join('')+'</tr>'}).join('')+'</table></div></div>';
 var sl=Object.keys(m.SV).sort(function(a,b){return m.SV[b].rev-m.SV[a].rev});
 if(sl.length)h+='<div class="ac"><b>Layanan: siapa yang mengerjakan</b><div class="tw"><table><tr><th>Layanan</th><th>Jml</th><th>Omzet</th><th>Rata²</th><th>Dikerjakan oleh</th></tr>'+sl.slice(0,25).map(function(s){var g=m.SV[s];return'<tr><td>'+esc(s)+'</td><td>'+g.q+'</td><td>'+Rp(g.rev)+'</td><td>'+Rp(g.rev/g.q)+'</td><td style="text-align:left;font-size:12px">'+Object.keys(g.by).sort(function(a,b){return g.by[b]-g.by[a]}).map(function(n){return esc(n)+' '+g.by[n]}).join(' · ')+'</td></tr>'}).join('')+'</table></div>'+(sl.length>25?'<div class="m">Menampilkan 25 dari '+sl.length+' layanan; lengkapnya ada di ekspor CSV.</div>':'')+'</div>';
 G('atb').innerHTML=h}
function head(){var c=A.p==='x';return'<div class="af"><select id="atp"><option value="hari">Hari ini</option><option value="7">7 hari</option><option value="30">30 hari</option><option value="bln">Bulan ini</option><option value="lalu">Bulan lalu</option><option value="x">Kustom</option></select>'
 +(c?'<input type="date" id="atf" value="'+A.f+'"><input type="date" id="att" value="'+A.t+'">':'')
 +'<select id="atter">'+opt(A.ters||[],A.ter,'Semua terapis')+'</select><select id="atkat">'+opt(A.kats||[],A.kat,'Semua kategori')+'</select>'
 +'<select id="atlok"><option value="">Outlet dan homecare</option><option value="out"'+(A.lok==='out'?' selected':'')+'>Outlet saja</option><option value="hc"'+(A.lok==='hc'?' selected':'')+'>Homecare saja</option></select>'
 +'<input id="atq" placeholder="Cari layanan" value="'+esc(A.q)+'"></div>'}
function load(){var r=rng(A.p);A.f=r[0];A.t=r[1];G('atf')&&(G('atf').value=A.f);G('atb').innerHTML='<div class="ac m">Memuat data…</div>';
 api('riwayat',{dari:A.f,sampai:A.t}).then(function(x){A.rows=x;var m=calc(x,{},((typeof D!=='undefined'&&D.terapis)||[]).map(function(s){return String(s).trim().toUpperCase()}));A.ters=m.ters;A.kats=m.kats;G('atf2').innerHTML=head();G('atp').value=A.p;view()}).catch(function(e){G('atb').innerHTML='<div class="ac" style="color:var(--bad)">'+esc(e.message)+'</div>'})}
function css(){if(G('atcss'))return;var s=document.createElement('style');s.id='atcss';s.textContent='#at{position:fixed;inset:0;z-index:65;background:var(--bg);color:var(--ink);overflow:auto}#at .ah{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:calc(10px + env(safe-area-inset-top)) 14px 10px;background:linear-gradient(120deg,var(--pr),var(--ac));color:#fff}#at .ah button{border:0;border-radius:10px;padding:8px 12px;font-weight:700;margin-left:6px}#at .af{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;padding:12px 14px}#at .ac{background:var(--cd);border:1px solid var(--ln);border-radius:16px;padding:12px;margin:10px 14px}#at .ak{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;padding:0 14px}#at .ak div{background:var(--cd);border:1px solid var(--ln);border-radius:14px;padding:10px}#at .ak b{display:block;font-size:16px}#at small,#at .m{color:var(--mut)}#at table{width:100%;border-collapse:collapse;font-size:13px}#at th,#at td{padding:6px 8px;text-align:right;border-bottom:1px solid var(--ln)}#at th:first-child,#at td:first-child{text-align:left}#at .tw{overflow-x:auto}#at .bar{height:8px;border-radius:4px;background:var(--pr)}#at .ng{font-size:13px;margin:4px 0;padding-left:18px}#at summary{cursor:pointer;line-height:1.5}';document.head.appendChild(s)}
window.__atCalc=calc;
window.openAT=function(){css();var o=G('at');if(o)o.remove();o=document.createElement('div');o.id='at';o.innerHTML='<div class="ah"><b>🔬 Analisis Terapis</b><span><button id="atcsv">⬇ CSV</button><button id="atx">✕</button></span></div><div id="atf2">'+head()+'</div><div id="atb"></div><div style="height:40px"></div>';document.body.appendChild(o);
 o.addEventListener('click',function(e){if(e.target.id==='atx')o.remove();else if(e.target.id==='atcsv'&&A.m)csv(A.m)});
 o.addEventListener('change',function(e){var i=e.target.id;if(i==='atp'){A.p=e.target.value;if(A.p==='x'){G('atf2').innerHTML=head();G('atp').value='x';return}load()}else if(i==='atf'||i==='att'){A.f=G('atf').value;A.t=G('att').value;if(A.f&&A.t)load()}else if(i==='atter'){A.ter=e.target.value;view()}else if(i==='atkat'){A.kat=e.target.value;view()}else if(i==='atlok'){A.lok=e.target.value;view()}});
 o.addEventListener('input',function(e){if(e.target.id==='atq'){A.q=e.target.value;clearTimeout(A.tm);A.tm=setTimeout(view,150)}});
 load()}
})();
