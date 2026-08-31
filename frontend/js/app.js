// Global app: preloader, nav, auth state, toast
function toast(msg, type='info'){
  const root=document.getElementById('toast-root');
  if(!root) return alert(msg);
  const el=document.createElement('div');
  el.className=`toast ${type}`;
  el.textContent=msg;
  root.appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; el.style.transform='translateX(12px)'; el.style.transition='all 0.4s';},2600);
  setTimeout(()=> el.remove(),3200);
}

function initPreloader(){
  const pl=document.getElementById('preloader');
  if(!pl) return;
  // visible for 1 sec then fade out 1 sec (total 2 sec)
  setTimeout(()=>{ pl.classList.add('fade-out'); }, 1000);
  // ensure hidden after 2.2s
  setTimeout(()=>{ pl.style.display='none'; }, 2200);
}

function initHeader(){
  const btn=document.getElementById('hamburger');
  const nav=document.getElementById('mobileNav');
  if(btn && nav){
    btn.addEventListener('click',()=> nav.classList.toggle('open'));
    nav.querySelectorAll('a').forEach(a=> a.addEventListener('click',()=> nav.classList.remove('open')));
  }
  // auth state
  const token=localStorage.getItem('atdp_token');
  const userStr=localStorage.getItem('atdp_user');
  let user=null; try{ user=JSON.parse(userStr||'null'); }catch{}
  const authLinks=document.getElementById('authLinks');
  const userNav=document.getElementById('userNav');
  if(token && user){
    if(authLinks) authLinks.classList.add('hidden');
    if(userNav){
      userNav.classList.remove('hidden');
      userNav.innerHTML = `
        <span class="caption" style="color:var(--color-text-muted)">${user.name} • ${user.role}</span>
        <a href="${user.role==='admin' ? 'admin.html' : 'dashboard.html'}" class="btn btn-secondary btn-small">${user.role==='admin' ? 'Admin Panel' : 'Dashboard'}</a>
        <button class="btn btn-primary btn-small" id="logoutBtn">Logout</button>
      `;
      document.getElementById('logoutBtn')?.addEventListener('click',()=>{
        localStorage.removeItem('atdp_token'); localStorage.removeItem('atdp_user');
        toast('Logged out','success'); setTimeout(()=> location.href='index.html',600);
      });
    }
  } else {
    if(authLinks) authLinks.classList.remove('hidden');
    if(userNav) userNav.classList.add('hidden');
  }
  // also update mobile nav auth
  const mobileAuth=document.getElementById('mobileAuth');
  if(mobileAuth){
    if(token && user){
      mobileAuth.innerHTML = `<a href="${user.role==='admin'?'admin.html':'dashboard.html'}">${user.role==='admin'?'Admin Panel':'Dashboard'}</a><a href="#" id="mLogout">Logout (${user.name})</a>`;
      document.getElementById('mLogout')?.addEventListener('click',(e)=>{ e.preventDefault(); localStorage.clear(); location.href='index.html';});
    } else {
      mobileAuth.innerHTML = `<a href="login.html">Login</a><a href="register.html">Register</a>`;
    }
  }
}

function requireAuth(redirect='login.html'){
  const token=localStorage.getItem('atdp_token');
  if(!token){ toast('Please login first','error'); setTimeout(()=> location.href=redirect,800); return false; }
  return true;
}

document.addEventListener('DOMContentLoaded',()=>{
  initPreloader();
  initHeader();
  // show demo creds hint if on login
  const ipBanner=document.getElementById('ipBanner');
  if(ipBanner){
    fetch('https://api.ipify.org?format=json').then(r=>r.json()).then(d=> ipBanner.textContent=`Connected via IP: ${d.ip}`).catch(()=> ipBanner.textContent='Connected • ATDP Secure');
  }
});
