(function(){
/* ===== FIREBASE WEB CONFIGURATION =====
   Paste the complete config from Firebase Console > Project settings > Your apps.
   Google and email/password sign-in will remain disabled until these values are filled in.
*/
const PM_FIREBASE={
  apiKey:"",
  authDomain:"",
  projectId:"",
  storageBucket:"",
  messagingSenderId:"",
  appId:""
};
const useFB=!!PM_FIREBASE.apiKey;
let fb=null,db=null;

/* ===== Inject new interface elements ===== */
document.body.insertAdjacentHTML('afterbegin',
 `<div id="topbar"><button id="menuBtn" aria-label="Menu">☰</button><b>PropMeasure</b><button id="topUser" aria-label="Profile">?</button></div>
  <div id="scrim"></div>`);
document.body.insertAdjacentHTML('beforeend',
 `<div id="bbar">
  <button data-g="home"><i>🏠</i>Home</button><button data-g="area"><i>📐</i>Land</button><button data-g="gps"><i>🗺️</i>Map</button>
  <button data-g="val"><i>💰</i>Value</button><button data-g="menu"><i>☰</i>Menu</button></div>`);
document.querySelector('main').insertAdjacentHTML('afterbegin',''); 
$('lo').insertAdjacentHTML('beforebegin','<button data-t="prof">Profile</button>');
document.querySelector('main').insertAdjacentHTML('beforeend',
 `<section id="prof" class="hide">
  <div class="card prof-card"><div class="avatar" id="pAv">?</div><h2 id="pName"></h2><p class="note" id="pMail"></p></div>
  <div class="card"><h2>Edit profile</h2><label>Full name</label><input id="pNameIn"><button class="btn" onclick="pmSaveName()">Save name</button></div>
  <div class="card"><h2>Change password</h2><label>New password</label><input id="pPass" type="password" autocomplete="new-password" placeholder="At least 8 characters"><button class="btn" onclick="pmChangePass()">Update password</button></div>
  <div class="card"><h2>Account</h2><div class="note" id="pStat"></div><div class="note" id="pMsg" style="font-weight:600"></div>
  <button class="btn alt" onclick="logout()">Log out</button><button class="btn alt" style="color:#b42318;border-color:#b42318" onclick="pmDelete()">Delete account</button></div></section>`);
$('abtn').insertAdjacentHTML('afterend','<a id="forgot" href="#" onclick="pmForgot();return false">Forgot password?</a>');
document.querySelectorAll('.auth-social button').forEach((b,i)=>{if(i)b.remove()});
document.querySelector('.auth-foot').textContent=useFB?'Your account and saved plots are stored securely online.':'Online login is not set up yet: accounts are stored on this device only.';

/* ===== Navigation behaviour ===== */
const openMenu=()=>{$('tabs').classList.add('open');$('scrim').classList.add('show')};
const closeMenu=()=>{$('tabs').classList.remove('open');$('scrim').classList.remove('show')};
$('menuBtn').onclick=openMenu;$('scrim').onclick=closeMenu;$('topUser').onclick=()=>go('prof');
document.querySelectorAll('#bbar button').forEach(b=>b.onclick=()=>b.dataset.g==='menu'?openMenu():go(b.dataset.g));
document.querySelector('#tabs [data-t="prof"]').onclick=function(){
  document.querySelectorAll('#tabs button').forEach(x=>x.classList.toggle('on',x===this));
  ['home','dist','area','val','conv','gps','pro','ai'].forEach(id=>$(id).classList.add('hide'));
};
document.querySelectorAll('#tabs button[data-t]').forEach(b=>b.addEventListener('click',()=>{
  const t=b.dataset.t;$('prof').classList.toggle('hide',t!=='prof');if(t==='prof')fillProf();
  closeMenu();document.querySelectorAll('#bbar [data-g]').forEach(x=>x.classList.toggle('on',x.dataset.g===t));scrollTo(0,0);
}));

/* Offline-friendly mode: keep local tools accessible without a network connection. */
if('serviceWorker' in navigator)navigator.serviceWorker.getRegistrations().then(r=>r.forEach(x=>x.unregister()));

/* ===== Firebase (auth + cloud backup) ===== */
const loadScript=src=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s)});
const ready=(async()=>{
  if(!useFB)return;
  const b='https://www.gstatic.com/firebasejs/10.12.2/firebase-';
  await loadScript(b+'app-compat.js');await loadScript(b+'auth-compat.js');await loadScript(b+'firestore-compat.js');
  firebase.initializeApp(PM_FIREBASE);fb=firebase.auth();db=firebase.firestore();
  await fb.setPersistence(firebase.auth.Auth.Persistence.LOCAL); // keep the signed-in session on this device
  // Complete Google sign-in when the browser returns from Google's redirect.
  const result=await fb.getRedirectResult();
  if(result && result.user) await enter(result.user);
})().catch(e=>{fb=null;console.error('PropMeasure Firebase setup:',e)});
const FE={'auth/email-already-in-use':'That email is already registered. Switch to Log in.','auth/invalid-credential':'Wrong email or password.','auth/wrong-password':'Wrong email or password.','auth/user-not-found':'No account found with that email.','auth/too-many-requests':'Too many attempts. Try again later.','auth/network-request-failed':'No internet connection.','auth/weak-password':'Password is too weak.','auth/requires-recent-login':'For security, log out, log in again, then retry.','auth/invalid-email':'Enter a valid email.'};
const fe=e=>FE[e.code]||e.message||'Something went wrong.';
let tm;
function cloudSave(){
  if(!db||!me||!fb||!fb.currentUser)return;clearTimeout(tm);
  tm=setTimeout(()=>db.collection('users').doc(fb.currentUser.uid).set({recs,pro:JSON.parse(localStorage.getItem('pm_pro_'+me.email)||'[]'),updated:Date.now()},{merge:true}).catch(()=>{}),800);
}
async function cloudLoad(u){
  try{const d=await db.collection('users').doc(u.uid).get();
    if(d.exists){const x=d.data();if(x.recs)localStorage.setItem('pm_recs_'+u.email,JSON.stringify(x.recs));if(x.pro)localStorage.setItem('pm_pro_'+u.email,JSON.stringify(x.pro))}}catch(e){}
}
const op=persist,ovs=vpSave;
window.persist=function(){op();cloudSave()};
window.vpSave=function(l){ovs(l);cloudSave()};

/* ===== Login / session ===== */
function begin(email,name){
  me={email,name};recKey='pm_recs_'+email;
  try{recs=JSON.parse(localStorage.getItem(recKey)||'[]')}catch(e){recs=[]}
  $('auth').classList.add('hide');$('lo').classList.remove('hide');$('apass').value='';
  document.body.classList.add('authed');$('topUser').textContent=(name||'?')[0].toUpperCase();
  drawRecs();go('home');
}
async function enter(u){await cloudLoad(u);begin(u.email,u.displayName||u.email.split('@')[0])}
const oAuth=authGo;
window.authGo=async function(){
  const em=$('aemail').value.trim().toLowerCase(),pw=$('apass').value,msg=$('amsg');msg.textContent='';
  if(!useFB){await oAuth();try{localStorage.removeItem('pm_session')}catch(e){}return}
  if(!/^\S+@\S+\.\S+$/.test(em)){msg.textContent='Enter a valid email.';return}
  if(pw.length<8){msg.textContent='Password must be at least 8 characters.';return}
  msg.textContent='Please wait…';await ready;
  if(!fb){msg.textContent='Cannot reach the server. Check your internet.';return}
  try{
    let c;
    if(authMode==='reg'){
      const nm=$('aname').value.trim();if(!nm){msg.textContent='Enter your name.';return}
      c=await fb.createUserWithEmailAndPassword(em,pw);await c.user.updateProfile({displayName:nm});c.user.sendEmailVerification().catch(()=>{});
    }else c=await fb.signInWithEmailAndPassword(em,pw);
    msg.textContent='';await enter(c.user);
  }catch(e){msg.textContent=fe(e)}
};
window.socialNotice=async function(p){
  const m=$('amsg');
  if(p!=='Google'){m.textContent=p+' sign-in is not enabled yet. Use Google or email and password.';return}
  if(!useFB){m.textContent='Google sign-in is not configured yet. Connect PropMeasure to Firebase first.';return}
  m.textContent='Opening Google sign-in…';await ready;
  if(!fb){m.textContent='Firebase could not load. Check your internet connection and Firebase configuration.';return}
  try{
    const provider=new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({prompt:'select_account'});
    // Redirect is more reliable than popups inside Android app WebViews.
    await fb.signInWithRedirect(provider);
  }catch(e){m.textContent=fe(e)}
};
window.pmForgot=async function(){
  const em=$('aemail').value.trim().toLowerCase(),m=$('amsg');
  if(!/^\S+@\S+\.\S+$/.test(em)){m.textContent='Type your email above first, then tap Forgot password.';return}
  if(!useFB){m.textContent='Password reset by email needs the online account setup (Firebase).';return}
  await ready;
  try{await fb.sendPasswordResetEmail(em);m.textContent='Reset link sent. Check your inbox and spam folder.'}catch(e){m.textContent=fe(e)}
};
const oSw=authSwitch;
window.authSwitch=function(m){oSw(m);$('forgot').style.display=m==='login'?'block':'none'};
window.logout=async function(){
  try{localStorage.removeItem('pm_session')}catch(e){}
  try{if(fb)await fb.signOut()}catch(e){}
  me=null;recs=[];recKey='pm_recs';drawRecs();closeMenu();
  document.body.classList.remove('authed');$('lo').classList.add('hide');$('auth').classList.remove('hide');
  authSwitch('login');$('aemail').value='';$('apass').value='';
};
/* always start at login, and log out after 60s in the background */
try{localStorage.removeItem('pm_session')}catch(e){}
me=null;recs=[];recKey='pm_recs';document.body.classList.remove('authed');
$('lo').classList.add('hide');$('auth').classList.remove('hide');
authSwitch(useFB||Object.keys(users()).length?'login':'reg');
let away=0;
document.addEventListener('visibilitychange',()=>{if(document.hidden)away=Date.now();else if(me&&away&&Date.now()-away>60000)logout()});

/* ===== Profile / account management ===== */
function fillProf(){
  if(!me)return;
  $('pName').textContent=me.name;$('pMail').textContent=me.email;$('pNameIn').value=me.name;$('pAv').textContent=(me.name||'?')[0].toUpperCase();
  $('pStat').textContent=useFB?'Online account · cloud backup on':'Local account on this device';$('pMsg').textContent='';
}
window.pmSaveName=async function(){
  const n=$('pNameIn').value.trim(),m=$('pMsg');if(!n){m.textContent='Enter a name.';return}
  try{
    if(useFB)await fb.currentUser.updateProfile({displayName:n});
    else{const u=users();u[me.email].name=n;localStorage.setItem('pm_users',JSON.stringify(u))}
    me.name=n;$('topUser').textContent=n[0].toUpperCase();$('hname').textContent=n;fillProf();$('pMsg').textContent='Name updated.';
  }catch(e){m.textContent=fe(e)}
};
window.pmChangePass=async function(){
  const p=$('pPass').value,m=$('pMsg');if(p.length<8){m.textContent='Password must be at least 8 characters.';return}
  try{
    if(useFB)await fb.currentUser.updatePassword(p);
    else{const u=users(),s=Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-');u[me.email].salt=s;u[me.email].hash=await hash(p,s);localStorage.setItem('pm_users',JSON.stringify(u))}
    $('pPass').value='';m.textContent='Password updated.';
  }catch(e){m.textContent=fe(e)}
};
window.pmDelete=async function(){
  if(!confirm('Delete your account and all saved data? This cannot be undone.'))return;
  const em=me.email;
  try{
    if(useFB){await db.collection('users').doc(fb.currentUser.uid).delete().catch(()=>{});await fb.currentUser.delete()}
    else{const u=users();delete u[em];localStorage.setItem('pm_users',JSON.stringify(u))}
    localStorage.removeItem('pm_recs_'+em);localStorage.removeItem('pm_pro_'+em);logout();
  }catch(e){$('pMsg').textContent=fe(e)}
};

/* ===== GPS / coordinates fix ===== */
function getPos(ok,bad){
  if(!navigator.geolocation){bad('Location is not supported on this device.');return}
  navigator.geolocation.getCurrentPosition(ok,e=>bad(
    e.code===1?'Location is blocked. Allow Location for PropMeasure: Phone Settings > Apps > PropMeasure > Permissions > Location.':
    e.code===3?'Location timed out. Turn on GPS, go outside, and try again.':'Could not get your location. Turn on GPS and try again.'),
    {enableHighAccuracy:true,timeout:20000,maximumAge:0});
}
window.useLoc=p=>getPos(pos=>{$(p+'lat').value=pos.coords.latitude.toFixed(6);$(p+'lng').value=pos.coords.longitude.toFixed(6)},alert);
window.markHere=()=>getPos(p=>addPt(+p.coords.latitude.toFixed(6),+p.coords.longitude.toFixed(6)),alert);
let meDot=null,meCirc=null;
function locateMe(){
  $('mmsg').textContent='Finding your location…';
  getPos(p=>{
    const ll=[p.coords.latitude,p.coords.longitude],t=ll.map(x=>x.toFixed(6)).join(', ');
    if(meDot){gmap.removeLayer(meDot);gmap.removeLayer(meCirc)}
    meCirc=L.circle(ll,{radius:p.coords.accuracy,weight:1}).addTo(gmap);
    meDot=L.circleMarker(ll,{radius:8,color:'#fff',fillColor:'#1a73e8',fillOpacity:1,weight:3}).addTo(gmap);
    gmap.setView(ll,18);
    $('mmsg').innerHTML='Your coordinates: <b>'+t+'</b> (±'+Math.round(p.coords.accuracy)+' m)<br><a href="#" id="cpy">Copy</a> · <a target="_blank" href="https://www.google.com/maps?q='+t.replace(', ',',')+'">Open in Google Maps</a>';
    $('cpy').onclick=e=>{e.preventDefault();navigator.clipboard&&navigator.clipboard.writeText(t);$('cpy').textContent='Copied'};
  },m=>{$('mmsg').textContent=m});
}
const oOpen=openMap;
window.openMap=function(){oOpen();if(gmap&&!gmap._pm){gmap._pm=1;$('mme').onclick=locateMe;locateMe()}};
})();

