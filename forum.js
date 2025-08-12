// forum.js - same as previous version, with minor safety checks
if(typeof firebase === 'undefined'){
  console.warn('Firebase SDK not loaded. Forum will not work until firebase scripts are available.');
} else {
  if(typeof firebaseConfig === 'undefined'){
    console.warn('firebaseConfig not found. Copy your config to js/firebase-config.js');
  }
}

let app, auth, db, storage;
function initFirebase() {
  if(typeof firebase === 'undefined' || typeof firebaseConfig === 'undefined') return;
  try{
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();
    setupAuthUI();
    loadPosts();
  }catch(e){
    console.warn('Firebase init error', e);
  }
}

function setupAuthUI(){
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const btnSignup = document.getElementById('btnSignup');
  const btnLogin = document.getElementById('btnLogin');
  const btnLogout = document.getElementById('btnLogout');
  const userInfo = document.getElementById('userInfo');
  const newPost = document.getElementById('newPost');

  if(btnSignup) btnSignup.onclick = ()=>{ auth.createUserWithEmailAndPassword(email.value, password.value).then(u=>{ userInfo.textContent = 'Cuenta creada: ' + u.user.email; }).catch(e=> alert(e.message)); };
  if(btnLogin) btnLogin.onclick = ()=>{ auth.signInWithEmailAndPassword(email.value, password.value).catch(e=> alert(e.message)); };
  if(btnLogout) btnLogout.onclick = ()=> auth.signOut();

  auth.onAuthStateChanged(user=>{
    if(!user) return;
    if(user){
      if(userInfo) userInfo.textContent = 'Conectado: ' + user.email;
      if(btnLogout) btnLogout.style.display = 'inline-block';
      if(btnLogin) btnLogin.style.display = 'none';
      if(btnSignup) btnSignup.style.display = 'none';
      if(newPost) newPost.style.display = 'block';
    } else {
      if(userInfo) userInfo.textContent = 'No estás conectado.';
      if(btnLogout) btnLogout.style.display = 'none';
      if(btnLogin) btnLogin.style.display = 'inline-block';
      if(btnSignup) btnSignup.style.display = 'inline-block';
      if(newPost) newPost.style.display = 'none';
    }
  });

  const btnPost = document.getElementById('btnPost');
  if(btnPost) btnPost.onclick = publishPost;
}

async function publishPost(){
  const title = document.getElementById('title').value.trim();
  const content = document.getElementById('content').value.trim();
  const imgFile = document.getElementById('imgUpload').files[0];
  if(!title || !content){ alert('Escribe título y contenido.'); return; }
  const user = auth.currentUser;
  if(!user){ alert('Debes iniciar sesión.'); return; }

  let imgURL = '';
  try{
    if(imgFile){
      const ref = storage.ref().child('posts/' + Date.now() + '_' + imgFile.name);
      await ref.put(imgFile);
      imgURL = await ref.getDownloadURL();
    }
    await db.collection('posts').add({
      title, content, imgURL, author: user.email, createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    document.getElementById('title').value = '';
    document.getElementById('content').value = '';
    document.getElementById('imgUpload').value = '';
    loadPosts();
  }catch(e){
    alert('Error publicando: ' + e.message);
  }
}

function loadPosts(){
  const list = document.getElementById('postsList');
  if(!list) return;
  if(!db){ list.innerHTML = '<p class="muted">Foro inactivo — configura Firebase (ver README)</p>'; return; }
  db.collection('posts').orderBy('createdAt','desc').onSnapshot(snapshot=>{
    list.innerHTML = '';
    snapshot.forEach(doc=>{
      const d = doc.data();
      const el = document.createElement('div');
      el.className = 'post-card card';
      el.innerHTML = `<strong>${escapeHtml(d.title)}</strong><div class="muted">por ${escapeHtml(d.author||'anónimo')} · ${d.createdAt?d.createdAt.toDate():''}</div>
                      <p>${escapeHtml(d.content)}</p>` + (d.imgURL?`<img src="${d.imgURL}" style="max-width:100%;border-radius:8px;margin-top:8px">`:''); 
      list.appendChild(el);
    });
  }, err=>{ list.innerHTML = '<p class="muted">No se pudieron cargar publicaciones. Revisa configuración de Firestore.</p>'; });
}

function escapeHtml(s){ if(!s) return ''; return s.replace(/[&<>'"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;',\"'\":\"&#39;",'\"':'&quot;'})[c]); }

document.addEventListener('DOMContentLoaded', ()=>{ initFirebase(); });