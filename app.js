const $=id=>document.getElementById(id);
const fmt=n=>isFinite(n)?n.toLocaleString(undefined,{maximumFractionDigits:2}):"–";
document.querySelectorAll("#tabs button").forEach(b=>b.onclick=()=>{
  document.querySelectorAll("#tabs button").forEach(x=>x.classList.toggle("on",x===b));
  ["home","dist","area","val","conv","gps","pro","ai"].forEach(id=>$(id).classList.toggle("hide",id!==b.dataset.t));if(b.dataset.t==="gps")openMap();if(b.dataset.t==="home")drawHome();if(b.dataset.t==="pro")vpList();
});
function useLoc(p){
  if(!navigator.geolocation){alert("Location isn’t available on this device.");return}
  navigator.geolocation.getCurrentPosition(pos=>{$(p+"lat").value=pos.coords.latitude.toFixed(6);$(p+"lng").value=pos.coords.longitude.toFixed(6)},()=>alert("Couldn’t get your location. Enter coordinates manually."));
}
function calcDist(){
  const v=["alat","alng","blat","blng"].map(i=>parseFloat($(i).value));
  const r=$("distRes");r.classList.remove("hide");
  if(v.some(isNaN)){r.innerHTML="Please fill in both points.";return}
  const R=6371008.8,rad=x=>x*Math.PI/180;
  const dLat=rad(v[2]-v[0]),dLng=rad(v[3]-v[1]);
  const h=Math.sin(dLat/2)**2+Math.cos(rad(v[0]))*Math.cos(rad(v[2]))*Math.sin(dLng/2)**2;
  const m=2*R*Math.asin(Math.sqrt(h));
  r.innerHTML=`<div class="big">${fmt(m/1000)} km</div><small>${fmt(m)} m · ${fmt(m*3.28084)} ft · ${fmt(m/1609.344)} miles</small>`;
}
const U={"Metres":1,"Kilometres":1000,"Feet":0.3048,"Yards":0.9144,"Miles":1609.344};
$("cfrom").innerHTML=Object.keys(U).map(k=>`<option>${k}</option>`).join("");
function conv(){
  const m=parseFloat($("cv").value)*U[$("cfrom").value];
  $("cvRes").innerHTML=isNaN(m)?"Enter a value.":Object.keys(U).map(k=>`${fmt(m/U[k])} ${k.toLowerCase()}`).join("<br>");
}
$("cv").oninput=conv;$("cfrom").onchange=conv;conv();
function calcArea(){
  const l=parseFloat($("len").value),w=parseFloat($("wid").value),f=parseFloat($("aunit").value),s=parseFloat($("shape").value);
  const r=$("areaRes");r.classList.remove("hide");
  if(isNaN(l)||isNaN(w)){r.innerHTML="Enter length and width.";return}
  const a=l*f*w*f*s;
  show('areaRes',a,s==1?2*(l+w)*f:null);
}
function showMethod(){const m=$("method").value;["inv","cmp","cost","pa","res","rd"].forEach(k=>$("m_"+k).classList.toggle("hide",k!==m))}
function calcInv(){
  const rent=parseFloat($("rent").value),o=parseFloat($("outg").value)||0,c=parseFloat($("cap").value);
  const r=$("invRes");r.classList.remove("hide");
  if(isNaN(rent)||isNaN(c)||c<=0){r.innerHTML="Enter rent and a cap rate above 0.";return}
  const noi=rent-o;
  r.innerHTML=`<div class="big">${fmt(noi/(c/100))}</div><small>Net income: ${fmt(noi)} ÷ ${c}% cap rate (years’ purchase: ${fmt(100/c)})</small>`;
}
function lines(id){return $(id).value.split(/\n/).map(x=>parseFloat(x.replace(/,/g,""))).filter(x=>!isNaN(x))}
function calcCmp(){
  const p=lines("comps"),s=lines("csz"),sub=parseFloat($("subsz").value);
  const r=$("vcmpRes");r.classList.remove("hide");
  if(!p.length||p.length!==s.length||isNaN(sub)){r.innerHTML="Give matching prices and sizes, plus the subject size.";return}
  const pp=p.map((x,i)=>x/s[i]),avg=pp.reduce((a,b)=>a+b,0)/pp.length;
  r.innerHTML=`<div class="big">${fmt(avg*sub)}</div><small>Average rate ${fmt(avg)} per m² (range ${fmt(Math.min(...pp))}–${fmt(Math.max(...pp))}) × ${fmt(sub)} m²</small>`;
}
function calcCost(){
  const land=parseFloat($("land").value)||0,a=parseFloat($("barea").value),rc=parseFloat($("rcost").value),age=parseFloat($("age").value)||0,life=parseFloat($("life").value);
  const r=$("costRes");r.classList.remove("hide");
  if(isNaN(a)||isNaN(rc)||isNaN(life)||life<=0){r.innerHTML="Enter building area, cost and life.";return}
  const gross=a*rc,dep=Math.min(1,age/life),net=gross*(1-dep);
  r.innerHTML=`<div class="big">${fmt(land+net)}</div><small>Land ${fmt(land)} + building ${fmt(net)} (replacement ${fmt(gross)} less ${fmt(dep*100)}% depreciation)</small>`;
}
const n=id=>parseFloat($(id).value)||0;
function calcPA(){
  const cap=n("pa_cap"),r=$("paRes");r.classList.remove("hide");
  if(!n("pa_rev")||cap<=0){r.innerHTML="Enter gross receipts and a cap rate above 0.";return}
  const div=n("pa_rev")-n("pa_purch")-n("pa_exp")-n("pa_prof");
  if(div<=0){r.innerHTML="No divisible balance: costs and tenant’s profit use up all receipts.";return}
  r.innerHTML=`<div class="big">${fmt(div/(cap/100))}</div><small>Divisible balance (rent): ${fmt(div)} ÷ ${cap}% cap rate</small>`;
}
function calcRes(){
  const g=n("rs_gdv"),b=n("rs_build"),r=$("rsRes");r.classList.remove("hide");
  if(!g||!b){r.innerHTML="Enter GDV and construction cost.";return}
  const f=b*n("rs_fees")/100,c=b*n("rs_cont")/100,fin=b*n("rs_fin")/100,p=g*n("rs_prof")/100;
  const land=g-b-f-c-fin-p;
  r.innerHTML=`<div class="big">${fmt(land)}</div><small>Residual land value = GDV ${fmt(g)} − build ${fmt(b)} − fees ${fmt(f)} − contingency ${fmt(c)} − finance ${fmt(fin)} − profit ${fmt(p)}${land<=0?"<br><b>Negative: the scheme isn’t viable as set out.</b>":""}</small>`;
}
function calcRd(){
  const g=n("rd_gdv"),b=n("rd_build"),r=$("rdRes");r.classList.remove("hide");
  if(!g||!b){r.innerHTML="Enter GDV and construction cost.";return}
  const d=n("rd_demo"),f=b*n("rd_fees")/100,fin=b*n("rd_fin")/100,p=g*n("rd_prof")/100;
  const v=g-d-b-f-fin-p,ex=n("rd_exist");
  let cmp="";
  if(ex)cmp=`<br>Existing use: ${fmt(ex)}. <b>${v>ex?"Redevelopment gives the higher value.":"Existing use is worth more."}</b>`;
  r.innerHTML=`<div class="big">${fmt(v)}</div><small>GDV ${fmt(g)} − demolition ${fmt(d)} − build ${fmt(b)} − fees ${fmt(f)} − finance ${fmt(fin)} − profit ${fmt(p)}${cmp}</small>`;
}
const fm=x=>isFinite(x)?(+x.toPrecision(8)).toLocaleString(undefined,{maximumFractionDigits:8}):'–';
const CAT={L:{Metres:1,Kilometres:1000,Feet:.3048,Yards:.9144,Miles:1609.344,Centimetres:.01,Inches:.0254},A:{'Square metres':1,'Square feet':.09290304,'Square yards':.83612736,Hectares:1e4,Acres:4046.8564224,'Square kilometres':1e6,'Plot (50×100 ft)':464.5152,'Plot (60×120 ft)':668.9019,'Plot (450 m²)':450,'Plot (600 m²)':600}};
const Q=[['L','Metres','Feet','m → ft'],['L','Feet','Metres','ft → m'],['A','Square metres','Square feet','m² → ft²'],['A','Acres','Hectares','ac → ha'],['A','Hectares','Acres','ha → ac'],['A','Square feet','Acres','ft² → ac'],['A','Square metres','Hectares','m² → ha'],['L','Kilometres','Metres','km → m'],['L','Miles','Kilometres','mi → km']];
function fillCat(f,t){const u=Object.keys(CAT[$('ccat').value]),o=u.map(k=>`<option>${k}</option>`).join('');$('cf2').innerHTML=o;$('ct2').innerHTML=o;$('cf2').value=f||u[0];$('ct2').value=t||u[1];conv2()}
function conv2(){const C=CAT[$('ccat').value],v=parseFloat($('cv2').value),r=$('cv2Res');if(isNaN(v)){r.innerHTML='Enter a value.';return}const b=v*C[$('cf2').value];r.innerHTML=`<div class='big'>${fm(b/C[$('ct2').value])} ${$('ct2').value.toLowerCase()}</div><small>${Object.keys(C).map(k=>fm(b/C[k])+' '+k.toLowerCase()).join('<br>')}</small>`}
let last=null;
const PL=[['50×100 ft plots',464.5152],['60×120 ft plots',668.9019],['450 m² plots',450],['600 m² plots',600]];
function show(id,a,p,note){last={area:a,perim:p};const r=$(id);r.classList.remove('hide');r.innerHTML=`<div class='big'>${fmt(a)} m²</div><small>${fmt(a*10.7639)} sq ft · ${fmt(a/10000)} ha · ${fmt(a/4046.856)} acres${p?`<br>Perimeter: ${fmt(p)} m (${fmt(p*3.28084)} ft)`:''}<br>≈ ${PL.map(x=>fmt(a/x[1])+' '+x[0]).join(' · ')}${note?'<br>'+note:''}</small>`}
function calcSec(){const f=parseFloat($('sunit').value);let a=0,c=0;$('secs').value.split('\n').forEach(l=>{const t=l.trim().split(/[\s,x×]+/),L=parseFloat(t[0]),W=parseFloat(t[1]);if(!isNaN(L)&&!isNaN(W)){a+=L*f*W*f*(/^t/i.test(t[2]||'')?.5:1);c++}});if(!c){const r=$('secRes');r.classList.remove('hide');r.innerHTML='Add at least one line, e.g. 30 20';return}show('secRes',a,null,c+' section(s) added')}
let pts=[];
function addPt(la,lo){if(isNaN(la)||isNaN(lo)){alert('Enter latitude and longitude.');return}pts.push([la,lo]);drawPoly()}
function addManual(){addPt(parseFloat($('plat').value),parseFloat($('plng').value));$('plat').value='';$('plng').value=''}
function markHere(){if(!navigator.geolocation){alert('Location isn’t available on this device.');return}navigator.geolocation.getCurrentPosition(p=>addPt(+p.coords.latitude.toFixed(6),+p.coords.longitude.toFixed(6)),()=>alert('Couldn’t get your location. Enter coordinates manually.'),{enableHighAccuracy:true})}
function undoPt(){pts.pop();drawPoly()}
function clearPts(){pts=[];drawPoly()}
function drawPoly(){$('ptList').innerHTML=pts.map((p,i)=>(i+1)+'. '+p[0]+', '+p[1]).join('<br>')||'No corners marked yet.';const r=$('polyRes'),s=$('polySvg');if(pts.length<3){r.classList.add('hide');s.innerHTML='';return}const lat0=pts.reduce((a,p)=>a+p[0],0)/pts.length,k=111320,xs=pts.map(p=>[(p[1]-pts[0][1])*k*Math.cos(lat0*Math.PI/180),(p[0]-pts[0][0])*k]);let A=0,per=0;xs.forEach((p,i)=>{const q=xs[(i+1)%xs.length];A+=p[0]*q[1]-q[0]*p[1];per+=Math.hypot(q[0]-p[0],q[1]-p[1])});const X=xs.map(p=>p[0]),Y=xs.map(p=>p[1]),mx=Math.min(...X),my=Math.max(...Y),w=Math.max(...X)-mx,h=my-Math.min(...Y),sc=180/Math.max(w,h,1e-9),pd=20,pp=xs.map(p=>[pd+(p[0]-mx)*sc,pd+(my-p[1])*sc]);s.setAttribute('viewBox',`0 0 ${w*sc+2*pd} ${h*sc+2*pd}`);s.innerHTML=`<polygon points='${pp.map(p=>p.join(',')).join(' ')}' fill='var(--accent)' fill-opacity='.18' stroke='var(--accent)' stroke-width='2'/>`+pp.map((p,i)=>`<circle cx='${p[0]}' cy='${p[1]}' r='5' fill='var(--accent2)'/><text x='${p[0]+7}' y='${p[1]-7}' font-size='12' fill='currentColor'>${i+1}</text>`).join('');show('polyRes',Math.abs(A)/2,per,pts.length+' corners')}
let recs=[];
function persist(){try{localStorage.setItem(recKey,JSON.stringify(recs))}catch(e){}}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function saveRec(){if(!last){alert('Measure a plot first.');return}recs.push({name:$('rname').value.trim()||'Plot '+(recs.length+1),area:last.area,perim:last.perim});$('rname').value='';persist();drawRecs()}
function delRec(i){recs.splice(i,1);persist();drawRecs()}
function drawRecs(){$('recList').innerHTML=recs.length?recs.map((x,i)=>`<div class='rec'><span><b>${esc(x.name)}</b><br><small>${fmt(x.area)} m²${x.perim?' · perimeter '+fmt(x.perim)+' m':''}</small></span><button onclick='delRec(${i})'>✕</button></div>`).join('')+`<div class='rec'><b>Total (${recs.length})</b><b>${fmt(recs.reduce((a,x)=>a+x.area,0))} m²</b></div>`:'<small>No saved plots yet.</small>';const o=recs.map((x,i)=>`<option value='${i}'>${esc(x.name)}</option>`).join('');$('cmpA').innerHTML=o;$('cmpB').innerHTML=o;if(recs.length>1)$('cmpB').value=1;cmpRecs()}
function cmpRecs(){const r=$('cmpRes');if(recs.length<2){r.classList.add('hide');return}r.classList.remove('hide');const a=recs[$('cmpA').value],b=recs[$('cmpB').value],d=a.area-b.area;r.innerHTML=`<div class='big'>${fmt(Math.abs(d))} m²</div><small>${d===0?'Same size.':esc(d>0?a.name:b.name)+' is larger by '+fmt(Math.abs(d)/Math.min(a.area,b.area)*100)+'%'}<br>${esc(a.name)}: ${fmt(a.area)} m² · ${esc(b.name)}: ${fmt(b.area)} m²${a.perim&&b.perim?'<br>Perimeter: '+fmt(a.perim)+' m vs '+fmt(b.perim)+' m':''}</small>`}
Q.forEach(q=>{const b=document.createElement('button');b.className='chip';b.textContent=q[3];b.onclick=()=>{$('ccat').value=q[0];fillCat(q[1],q[2])};$('chips').appendChild(b)});
fillCat();drawRecs();drawPoly();
let gmap=null,mpts=[],mdots=[],mline=null,mpoly=null,mmetric=true;
function mdist(a,b){const R=6371008.8,r=x=>x*Math.PI/180,dl=r(b.lat-a.lat),dg=r(b.lng-a.lng),h=Math.sin(dl/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dg/2)**2;return 2*R*Math.asin(Math.sqrt(h))}
function mfmt(m){if(mmetric)return m<1000?Math.round(m)+' m':(m/1000).toFixed(m<10000?2:1)+' km';const ft=m*3.28084,mi=m/1609.344;return mi<0.25?Math.round(ft)+' ft':mi.toFixed(mi<10?2:1)+' mi'}
function mArea(){const lat0=mpts.reduce((s,p)=>s+p.lat,0)/mpts.length,k=111320,xs=mpts.map(p=>[(p.lng-mpts[0].lng)*k*Math.cos(lat0*Math.PI/180),(p.lat-mpts[0].lat)*k]);let A=0,per=0;xs.forEach((p,i)=>{const q=xs[(i+1)%xs.length];A+=p[0]*q[1]-q[0]*p[1];per+=Math.hypot(q[0]-p[0],q[1]-p[1])});return{area:Math.abs(A)/2,perim:per}}
function openMap(){
  if(typeof L==='undefined'){$('mtotal').textContent='The map library did not load. Check your internet connection.';return}
  if(gmap){setTimeout(()=>gmap.invalidateSize(),50);return}
  gmap=L.map('mapdiv').setView([20,0],2);
  const sat=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:21,maxNativeZoom:19,attribution:'Imagery &copy; Esri, Maxar, Earthstar Geographics'});
  const lab=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',{maxZoom:21,maxNativeZoom:19});
  const st=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:21,maxNativeZoom:19,attribution:'&copy; OpenStreetMap contributors'});
  sat.addTo(gmap);lab.addTo(gmap);
  L.control.layers({'Satellite':sat,'Streets':st},{'Place names':lab}).addTo(gmap);
  gmap.on('click',e=>{mpts.push(e.latlng);mdots.push(L.circleMarker(e.latlng,{radius:6,fillOpacity:1}).addTo(gmap));mrefresh()});
  gmap.on('locationerror',()=>{$('mmsg').textContent='Could not get your location. Check location permission.'});
  $('mundo').onclick=()=>{if(!mpts.length)return;mpts.pop();gmap.removeLayer(mdots.pop());mrefresh()};
  $('mclear').onclick=()=>{mpts.length=0;mdots.forEach(d=>gmap.removeLayer(d));mdots.length=0;mrefresh()};
  $('munits').onclick=()=>{mmetric=!mmetric;mrefresh()};
  $('mme').onclick=()=>gmap.locate({setView:true,maxZoom:18});
  mrefresh();
}
function mrefresh(){
  if(mline){gmap.removeLayer(mline);mline=null}
  if(mpoly){gmap.removeLayer(mpoly);mpoly=null}
  if(mpts.length>=2)mline=L.polyline(mpts,{weight:5}).addTo(gmap);
  if(mpts.length>=3)mpoly=L.polygon(mpts,{weight:0,fillOpacity:.2}).addTo(gmap);
  const t=$('mtotal'),d=$('mdetail'),r=$('mapRes');$('mmsg').textContent='';
  if(mpts.length<3)r.classList.add('hide');
  if(mpts.length<2){t.textContent='Tap the map to add points';d.textContent='Points: '+mpts.length;return}
  let sum=0;for(let i=1;i<mpts.length;i++)sum+=mdist(mpts[i-1],mpts[i]);
  const n=mpts.length;
  t.textContent='Total: '+mfmt(sum);
  d.textContent='Points: '+n+' • Last leg: '+mfmt(mdist(mpts[n-2],mpts[n-1]))+' • Start to end: '+mfmt(mdist(mpts[0],mpts[n-1]));
  if(n>=3){const P=mArea();show('mapRes',P.area,P.perim,'Shape closes from the last point back to the first.')}
}
function saveMap(){if(mpts.length<3){$('mmsg').textContent='Add at least 3 points to save a plot.';return}const P=mArea();recs.push({name:$('mname').value.trim()||'Map plot '+(recs.length+1),area:P.area,perim:P.perim});$('mname').value='';persist();drawRecs();$('mmsg').textContent='Saved. Find it under Saved plots on the Land tab.'}

const enc=new TextEncoder();
async function hash(pw,salt){const b=await crypto.subtle.digest('SHA-256',enc.encode(salt+pw));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('')}
function users(){try{return JSON.parse(localStorage.getItem('pm_users')||'{}')}catch(e){return{}}}
let authMode='reg',recKey='pm_recs',me=null;
function go(t){document.querySelector('#tabs [data-t="'+t+'"]').click()}
function authSwitch(m){authMode=m;$('awrap').classList.toggle('hide',m!=='reg');$('abtn').textContent=m==='reg'?'Create account':'Log in';$('authFormTitle').textContent=m==='reg'?'Registration':'Login';$('authPanelTitle').textContent=m==='reg'?'Hello, Welcome!':'Welcome Back!';$('authPanelSub').textContent=m==='reg'?'Already have an account?':'Don’t have an account?';$('authPanelBtn').textContent=m==='reg'?'Log in':'Register';$('authPanelBtn').onclick=()=>authSwitch(m==='reg'?'login':'reg');$('apass').autocomplete=m==='reg'?'new-password':'current-password';$('amsg').textContent=''}
async function authGo(){
  const em=$('aemail').value.trim().toLowerCase(),pw=$('apass').value,msg=$('amsg');msg.textContent='';
  if(!/^\S+@\S+\.\S+$/.test(em)){msg.textContent='Enter a valid email.';return}
  if(pw.length<8){msg.textContent='Password must be at least 8 characters.';return}
  if(!window.crypto||!crypto.subtle){msg.textContent='This browser cannot secure passwords here. Open the app over https or localhost.';return}
  const u=users();
  if(authMode==='reg'){
    const nm=$('aname').value.trim();
    if(!nm){msg.textContent='Enter your name.';return}
    if(u[em]){msg.textContent='That email is already registered. Switch to Log in.';return}
    const salt=Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-');
    u[em]={name:nm,salt,hash:await hash(pw,salt)};
    try{localStorage.setItem('pm_users',JSON.stringify(u))}catch(e){msg.textContent='Could not save your account in this browser.';return}
  }else{
    const x=u[em];
    if(!x||x.hash!==await hash(pw,x.salt)){msg.textContent='Wrong email or password.';return}
  }
  try{localStorage.setItem('pm_session',em)}catch(e){}
  startSession(em);
}
function startSession(em){
  const x=users()[em];if(!x)return;
  me={email:em,name:x.name};recKey='pm_recs_'+em;
  try{recs=JSON.parse(localStorage.getItem(recKey)||'[]')}catch(e){recs=[]}
  $('auth').classList.add('hide');$('lo').classList.remove('hide');$('apass').value='';
  drawRecs();go('home');
}
function logout(){
  try{localStorage.removeItem('pm_session')}catch(e){}
  me=null;recs=[];recKey='pm_recs';drawRecs();
  $('lo').classList.add('hide');$('auth').classList.remove('hide');authSwitch('login');
}
function drawHome(){
  if(!me)return;
  $('hname').textContent=me.name;
  const t=recs.reduce((a,x)=>a+x.area,0);
  $('hcount').textContent=recs.length+(recs.length===1?' plot':' plots')+' · '+fmt(t)+' m²';
  $('hrecent').innerHTML=recs.length?recs.slice(-3).reverse().map(x=>`<div class='rec'><span><b>${esc(x.name)}</b><br><small>${fmt(x.area)} m²</small></span></div>`).join(''):'<small>No saved plots yet. Measure one on the Land or Map tab.</small>';
}
$('apass').addEventListener('keydown',e=>{if(e.key==='Enter')authGo()});
{const s=(()=>{try{return localStorage.getItem('pm_session')}catch(e){return null}})();
if(s&&users()[s])startSession(s);else authSwitch(Object.keys(users()).length?'login':'reg')}

// Professional Valuation Suite module
let vpCurrent=null,vpData=null;
function vpStore(){try{return JSON.parse(localStorage.getItem('pm_pro_'+(me?.email||'guest'))||'[]')}catch(e){return[]}}
function vpSave(list){localStorage.setItem('pm_pro_'+(me?.email||'guest'),JSON.stringify(list))}
function vpNew(){return{id:Date.now(),name:'',address:'',client:'',surveyor:'',date:new Date().toISOString().slice(0,10),plot:'',points:[],inspection:{},notes:'',price:'',rent:'',costs:'',cap:9,comps:[]}}
function vpCreate(){let name=$('vpName').value.trim();if(!name){alert('Enter a project name.');return}let p=vpNew();p.name=name;p.address=$('vpAddress').value.trim();let a=vpStore();a.push(p);vpSave(a);$('vpName').value='';$('vpAddress').value='';vpList();vpOpen(p.id)}
function vpList(){let a=vpStore();$('vpProjects').innerHTML=a.length?a.map(p=>`<div class="rec"><b>${esc(p.name)}</b><br><small>${esc(p.address||'No location')}</small><div class="row"><button class="btn alt" onclick="vpOpen(${p.id})">Open</button><button class="btn alt" onclick="vpDelete(${p.id})">Delete</button></div></div>`).join(''):'<p class="note">No valuation projects created yet.</p>'}
function vpGet(){return vpData}
function vpPersist(){if(!vpData)return;let a=vpStore(),i=a.findIndex(p=>p.id===vpCurrent);if(i>=0){a[i]=vpData;vpSave(a)}}
function vpOpen(id){vpCurrent=id;vpData=vpStore().find(p=>p.id===id)||null;let p=vpGet();if(!p)return;$('vpWork').classList.remove('hide');$('vpTitle').textContent=p.name;$('vpClient').value=p.client||'';$('vpSurveyor').value=p.surveyor||'';$('vpDate').value=p.date||'';$('vpPlot').value=p.plot||'';$('vpNotes').value=p.notes||'';$('vpPrice').value=p.price||'';$('vpRent').value=p.rent||'';$('vpCosts').value=p.costs||'';$('vpCap').value=p.cap||9;$('vpParts').value=4;vpDrawPoints();vpDrawInspection();vpDrawComps();vpCalcInvestment();vpSubdivide()}
function vpClose(){$('vpWork').classList.add('hide');vpCurrent=null;vpData=null;vpList()}
function vpDelete(id){if(!confirm('Delete this valuation project?'))return;vpSave(vpStore().filter(p=>p.id!==id));vpList();if(vpCurrent===id)vpClose()}
function vpSet(k,v){let p=vpGet();if(!p)return;p[k]=v;vpPersist()}
function vpAddPoint(){let p=vpGet(),e=Number($('vpE').value),n=Number($('vpN').value),l=$('vpLabel').value.trim()||'BP'+(p.points.length+1);if(!isFinite(e)||!isFinite(n)||$('vpE').value===''||$('vpN').value===''){alert('Enter valid Easting and Northing values.');return}p.points.push({l,e,n});vpPersist();$('vpE').value='';$('vpN').value='';$('vpLabel').value='BP'+(p.points.length+1);vpDrawPoints()}
function vpPolygon(){let pts=vpGet()?.points||[];if(pts.length<3)return null;let a=0,per=0;for(let i=0;i<pts.length;i++){let x=pts[i],y=pts[(i+1)%pts.length];a+=x.e*y.n-y.e*x.n;per+=Math.hypot(y.e-x.e,y.n-x.n)}return{area:Math.abs(a)/2,per}}
function vpDrawPoints(){let p=vpGet();$('vpPoints').innerHTML=p.points.map((x,i)=>`<div class="row"><span>${esc(x.l)} · E ${x.e} · N ${x.n}</span><button class="btn alt" onclick="vpRemovePoint(${i})">Remove</button></div>`).join('')||'<p class="note">No boundary points added.</p>';let z=vpPolygon();$('vpArea').textContent=z?`Area: ${z.area.toFixed(2)} m² · ${(z.area*10.7639).toFixed(1)} ft² · Perimeter: ${z.per.toFixed(2)} m`:'Add 3 or more points for area and perimeter.';vpSubdivide()}
function vpRemovePoint(i){vpGet().points.splice(i,1);vpPersist();vpDrawPoints()}
const vpItems=['Roof','Walls and plaster','Floors','Ceiling','Doors and windows','Plumbing','Electrical','Fence and gate','Drainage'];
function vpDrawInspection(){let p=vpGet();$('vpInspection').innerHTML=vpItems.map(n=>`<div class="row"><span>${n}</span><select onchange="vpRate('${n}',this.value)"><option value="">Not rated</option>${['Good','Fair','Poor'].map(x=>`<option ${p.inspection[n]===x?'selected':''}>${x}</option>`).join('')}</select></div>`).join('')}
function vpRate(n,v){let p=vpGet();if(v)p.inspection[n]=v;else delete p.inspection[n];vpPersist()}
function vpCalcInvestment(){if(!vpCurrent)return;let p=vpGet();p.price=$('vpPrice').value;p.rent=$('vpRent').value;p.costs=$('vpCosts').value;p.cap=$('vpCap').value;vpPersist();let net=Number(p.rent||0)-Number(p.costs||0),cap=Number(p.cap);$('vpInvestment').textContent=`Net annual income: ₦${net.toLocaleString('en-NG')} · Net yield: ${p.price>0?(net/Number(p.price)*100).toFixed(2)+'%':'—'} · Capital value: ${cap>0?'₦'+(net/(cap/100)).toLocaleString('en-NG',{maximumFractionDigits:0}):'—'}`}
function vpAddComp(){let p=vpGet(),name=$('vpCompName').value.trim(),price=Number($('vpCompPrice').value),adj=Number($('vpCompAdj').value||0);if(!name||!price){alert('Enter comparable description and sale price.');return}p.comps.push({name,price,adj});vpPersist();$('vpCompName').value='';$('vpCompPrice').value='';$('vpCompAdj').value='';vpDrawComps()}
function vpDrawComps(){let p=vpGet();$('vpComps').innerHTML=p.comps.map((c,i)=>`<div class="row"><span>${esc(c.name)} · ₦${c.price.toLocaleString('en-NG')} · adj. ${c.adj}%</span><button class="btn alt" onclick="vpRemoveComp(${i})">Remove</button></div>`).join('')||'<p class="note">No comparable sales entered.</p>';let v=p.comps.map(c=>c.price*(1+c.adj/100));$('vpCompResult').textContent=v.length?'Adjusted comparable average: ₦'+(v.reduce((a,b)=>a+b,0)/v.length).toLocaleString('en-NG',{maximumFractionDigits:0}):''}
function vpRemoveComp(i){vpGet().comps.splice(i,1);vpPersist();vpDrawComps()}
function vpSubdivide(){if(!vpCurrent)return;let z=vpPolygon(),n=Math.max(2,Math.min(12,Number($('vpParts').value)||2));$('vpSub').textContent=z?`Approximate equal-area target: ${(z.area/n).toFixed(2)} m² per plot (${n} plots). For legal subdivision, use a qualified surveyor's approved layout.`:'Add at least 3 coordinate points to calculate subdivision area.'}
function vpReport(){let p=vpGet(),z=vpPolygon();$('vpReport').innerHTML=`<div class="res"><h3>${esc(p.name)}</h3><p>${esc(p.address)} · ${esc(p.date)}</p><p>Client: ${esc(p.client||'—')} · Surveyor: ${esc(p.surveyor||'—')}</p><p>Plot: ${esc(p.plot||'—')}</p><p>Boundary points: ${p.points.length}</p><p>Area: ${z?z.area.toFixed(2)+' m²':'Not calculated'} · Perimeter: ${z?z.per.toFixed(2)+' m':'—'}</p><p>Inspection: ${Object.entries(p.inspection).map(x=>esc(x[0])+': '+esc(x[1])).join('; ')||'Not recorded'}</p><p>Notes: ${esc(p.notes||'—')}</p><p>Net annual income: ₦${(Number(p.rent||0)-Number(p.costs||0)).toLocaleString('en-NG')}</p><p>Comparables: ${p.comps.length}</p><button class="btn" onclick="window.print()">Print / Save as PDF</button></div>`}
function vpCSV(){let p=vpGet(),z=vpPolygon(),rows=[['Property valuation report'],['Project',p.name],['Address',p.address],['Client',p.client],['Surveyor',p.surveyor],['Date',p.date],['Plot number',p.plot],[],['Point','Easting (m)','Northing (m)'],...p.points.map(x=>[x.l,x.e,x.n]),['Area (m2)',z?.area||''],['Perimeter (m)',z?.per||''],[],['Inspection item','Condition'],...Object.entries(p.inspection),['Notes',p.notes],['Purchase price',p.price],['Annual rent',p.rent],['Annual costs',p.costs],['Capitalisation rate',p.cap],[],['Comparable','Sale price','Adjustment (%)'],...p.comps.map(c=>[c.name,c.price,c.adj])];let csv=rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');let a=document.createElement('a'),u=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));a.href=u;a.download='PropMeasure-valuation-report.csv';a.click();URL.revokeObjectURL(u)}
function vpBackup(){let b=new Blob([JSON.stringify(vpStore(),null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='PropMeasure-project-backup.json';a.click();URL.revokeObjectURL(u)}
function vpRestore(el){let f=el.files[0];if(!f)return;let r=new FileReader();r.onload=()=>{try{let d=JSON.parse(r.result);if(!Array.isArray(d))throw 0;vpSave(d);vpList();alert('Project backup restored.')}catch(e){alert('Invalid PropMeasure backup file.')}};r.readAsText(f)}


function socialNotice(provider){$('amsg').textContent=provider+' sign-in is not connected yet. Use your email and password to create an account or log in.'}
function aiExample(t){$('aiInput').value=t;$('aiInput').focus()}
function aiAdd(text,who){const d=document.createElement('div');d.className='ai-message '+(who==='user'?'ai-user':'ai-bot');d.innerHTML=who==='user'?'<b>You</b><br>'+aiEsc(text):'<b>My off AI</b><br>'+aiEsc(text).replace(/\n/g,'<br>');$('aiChat').appendChild(d);$('aiChat').scrollTop=$('aiChat').scrollHeight}
function aiEsc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function aiNum(s){const m=String(s).replace(/,/g,'').match(/-?\d+(?:\.\d+)?/);return m?Number(m[0]):NaN}
function aiMoney(n){return '₦'+Number(n).toLocaleString('en-NG',{maximumFractionDigits:2})}
function aiSolve(q){const t=q.toLowerCase(),nums=(q.match(/\d[\d,]*(?:\.\d+)?/g)||[]).map(x=>Number(x.replace(/,/g,'')));
 if(/area|plot|rectangle|square metre|square meter/.test(t)&&(/by|x|×/.test(t))&&nums.length>=2){let a=nums[0],b=nums[1],ft=/feet|foot|\bft\b/.test(t),yd=/yards|\byd\b/.test(t),factor=ft?.3048:yd?.9144:1,area=a*b*factor*factor,per=2*(a+b)*factor;return `Plot area result\nDimensions: ${fmt(a)} × ${fmt(b)} ${ft?'ft':yd?'yd':'m'}\nArea: ${fmt(area)} m²\nArea: ${fmt(area*10.7639104)} ft²\nArea: ${fmt(area/4046.8564224,4)} acres\nPerimeter: ${fmt(per)} m\nThis is a rectangle calculation.`}
 if(/yield|rental return|rental return/.test(t)&&nums.length>=2){let price=nums[0],rent=nums[1],cost=nums[2]||0,net=rent-cost;if(price<=0)return 'Enter a purchase price greater than zero.';return `Rental investment result\nAnnual rent: ${aiMoney(rent)}\nAnnual expenses: ${aiMoney(cost)}\nNet annual income: ${aiMoney(net)}\nNet rental yield: ${fmt(net/price*100)}%\nGross rental yield: ${fmt(rent/price*100)}%`}
 if(/capital value|capitalisation|capitalization|cap rate/.test(t)&&nums.length>=2){let net=nums[0],rate=nums[1];if(rate<=0)return 'The capitalisation rate must be greater than zero.';return `Income capitalisation result\nNet annual income: ${aiMoney(net)}\nCapitalisation rate: ${fmt(rate)}%\nIndicated capital value: ${aiMoney(net/(rate/100))}\nFormula: Net annual income ÷ capitalisation rate.`}
 if(/depreciat/.test(t)&&nums.length>=3){let cost=nums[0],age=nums[1],life=nums[2],salvage=nums[3]||0;if(life<=0||age<0)return 'Enter a useful life above zero and a non-negative age.';let annual=(cost-salvage)/life,acc=Math.min(age,life)*annual;return `Straight-line depreciation estimate\nDepreciable amount: ${aiMoney(cost-salvage)}\nAnnual depreciation: ${aiMoney(annual)}\nAccumulated depreciation: ${aiMoney(acc)}\nEstimated book value: ${aiMoney(Math.max(salvage,cost-acc))}\nAssumes a constant annual depreciation charge.`}
 if(/price per|rate per|per square metre|per sqm|per m2/.test(t)&&nums.length>=2){let price=nums[0],area=nums[1];if(area<=0)return 'Area must be greater than zero.';return `Land rate result\nTotal price: ${aiMoney(price)}\nArea: ${fmt(area)} m²\nRate per square metre: ${aiMoney(price/area)} /m²`}
 if(/convert|hectare|acre|square feet|sq ft|square metre|square meter/.test(t)&&nums.length>=1){let v=nums[0];if(/hectare/.test(t))return `${fmt(v)} hectare(s) = ${fmt(v*10000)} m² = ${fmt(v*2.4710538)} acres = ${fmt(v*107639.104)} ft²`;if(/acre/.test(t))return `${fmt(v)} acre(s) = ${fmt(v*4046.8564224)} m² = ${fmt(v*0.404685642)} hectares`;if(/square feet|sq ft/.test(t))return `${fmt(v)} ft² = ${fmt(v*0.09290304)} m²`;return `${fmt(v)} m² = ${fmt(v*10.7639104)} ft² = ${fmt(v/10000)} hectares = ${fmt(v/4046.8564224,4)} acres`}
 if(/perimeter/.test(t)&&nums.length>=2){let a=nums[0],b=nums[1],f=/feet|foot|\bft\b/.test(t)?.3048:1;return `Rectangular perimeter: ${fmt(2*(a+b)*f)} metres.`}
 return 'I could not identify the calculation yet. Try one of these formats:\n• Area: 100 by 50 feet plot\n• Rental yield: price 50000000, annual rent 6000000, expenses 1000000\n• Capital value: net income 4500000, cap rate 9 percent\n• Depreciation: cost 10000000, age 5, life 50\n• Price per square metre: total price 30000000, area 450'}
function aiSend(){let q=$('aiInput').value.trim();if(!q)return;aiAdd(q,'user');aiAdd(aiSolve(q),'bot');$('aiInput').value=''}
function aiClear(){$('aiChat').innerHTML='<div class="ai-message ai-bot"><b>My off AI</b><br>Chat cleared. What estate calculation do you need?</div>'}
$('aiInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();aiSend()}});

