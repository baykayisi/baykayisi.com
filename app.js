(() => {
  const cfg = window.KAYISIHUB_CONFIG || {};
  const clientReady = !!(window.supabase && cfg.supabaseUrl && cfg.supabasePublishableKey);
  const db = clientReady ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey) : null;
  let user = null, currentCategory = "all", listings = [], authMode = "login", activeTab = "myListings";
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  const money = value => value == null ? "Fiyat sorunuz" : new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY",maximumFractionDigits:2}).format(Number(value));
  const toast = msg => { const el=$("toast"); el.textContent=msg; el.classList.remove("hidden"); setTimeout(()=>el.classList.add("hidden"),3200); };
  const show = id => $(id).classList.remove("hidden");
  const hide = id => $(id).classList.add("hidden");
  const statusText = s => ({draft:"Onay bekliyor",published:"Yayında",paused:"Duraklatıldı",archived:"Arşiv"}[s] || s);
  const categoryName = id => id === "ff408af8-58bd-4f3c-8cff-857e7689bc05" ? "MLBB Boost" : id === "1ca54e21-f1b1-4411-9bca-1ddba489624e" ? "Turnuva Lobisi" : "KayısıHub ilanı";

  async function loadListings() {
    const grid=$("listingGrid");
    if (!db) { grid.innerHTML='<div class="empty-card">Supabase bağlantı ayarları bulunamadı. assets/js/config.js dosyasını kontrol et.</div>'; return; }
    const {data,error}=await db.from("listings").select("id,title,description,price,currency,listing_type,category_id,seller_id,created_at,public_profiles(username,display_name)").eq("status","published").order("created_at",{ascending:false}).limit(30);
    if(error){grid.innerHTML='<div class="empty-card">İlanlar şu an yüklenemedi. Biraz sonra tekrar dene.</div>'; console.error(error);return;}
    listings=data||[]; renderListings();
  }
  function renderListings(){
    const term=$("searchInput").value.trim().toLocaleLowerCase("tr");
    const filtered=listings.filter(x=>(currentCategory==="all"||categoryName(x.category_id)===currentCategory)&&(!term||(x.title+" "+x.description).toLocaleLowerCase("tr").includes(term)));
    $("listingGrid").innerHTML=filtered.length?filtered.map(x=>`<article class="listing-card"><div class="listing-cover">${x.category_id==="1ca54e21-f1b1-4411-9bca-1ddba489624e"?"🏆":"⚡"}</div><div class="listing-body"><div class="listing-type">${esc(categoryName(x.category_id))}</div><h3>${esc(x.title)}</h3><p>${esc((x.description||"").slice(0,105))}${(x.description||"").length>105?"…":""}</p><div class="listing-meta"><span class="price">${esc(money(x.price))}</span><span class="seller-name">${esc(x.public_profiles?.display_name||x.public_profiles?.username||"Oyuncu")}</span></div><button class="btn btn-ghost listing-open" data-detail="${esc(x.id)}">İlanı incele</button></div></article>`).join(""):'<div class="empty-card">Bu filtrede henüz yayınlanmış ilan yok. İlk ilanı sen oluşturabilirsin.</div>';
    document.querySelectorAll("[data-detail]").forEach(b=>b.addEventListener("click",()=>openDetail(b.dataset.detail)));
  }
  async function loadNews(){
    if(!db)return; const {data,error}=await db.from("news_posts").select("id,title,summary,published_at").eq("status","published").order("published_at",{ascending:false}).limit(3);
    if(error||!data?.length)return;
    $("newsGrid").innerHTML=data.map(n=>`<article class="news-card"><div class="news-symbol">◈</div><b>${esc(n.title)}</b><p>${esc(n.summary||"Mobile Legends haber merkezi.")}</p></article>`).join("");
  }
  async function refreshUser(){
    if(!db)return; const {data}=await db.auth.getSession(); user=data.session?.user||null;
    $("loginOpen").classList.toggle("hidden",!!user); $("accountOpen").classList.toggle("hidden",!user);
    if(user){$("accountOpen").textContent="◎";$("accountOpen").title=user.email||"Hesabım";}
  }
  function authOpen(mode="login"){authMode=mode;$("authTitle").textContent=mode==="login"?"Tekrar hoş geldin.":"KayısıHub'a katıl."; $("authHint").textContent=mode==="login"?"Hesabına giriş yap ve pazaryerine katıl.":"Ücretsiz hesabını oluştur."; $("authSubmit").textContent=mode==="login"?"Giriş Yap":"Kayıt Ol"; $("usernameField").classList.toggle("hidden",mode==="login");$("authToggle").textContent=mode==="login"?"Hesabın yok mu? Kayıt ol":"Zaten hesabın var mı? Giriş yap";$("authMessage").textContent="";show("authModal");}
  async function submitAuth(){
    if(!db){$("authMessage").textContent="Supabase bağlantısı bulunamadı.";return;}
    const email=$("authEmail").value.trim(),password=$("authPassword").value,username=$("authUsername").value.trim();
    if(!email||password.length<8){$("authMessage").textContent="Geçerli e-posta ve en az 8 karakterli şifre gir.";return;}
    $("authSubmit").disabled=true;$("authMessage").textContent="İşleniyor…";
    try{
      if(authMode==="login"){
        const {error}=await db.auth.signInWithPassword({email,password});if(error)throw error;
        await refreshUser();hide("authModal");toast("Giriş başarılı.");loadAccount();
      }else{
        if(username.length<3){$("authMessage").textContent="Kullanıcı adı en az 3 karakter olmalı.";return;}
        const {data,error}=await db.auth.signUp({email,password,options:{data:{username,display_name:username}}});if(error)throw error;
        if(data.session){await ensureProfile(data.user,username);await refreshUser();hide("authModal");toast("Hesabın oluşturuldu.");}
        else{$("authMessage").textContent="Kayıt isteği alındı. E-postana gelen doğrulama bağlantısını aç, sonra giriş yap.";}
      }
    }catch(e){$("authMessage").textContent=e.message||"İşlem tamamlanamadı.";}finally{$("authSubmit").disabled=false;}
  }
  async function ensureProfile(u,username){
    const {error}=await db.from("profiles").upsert({id:u.id,username,display_name:username},{onConflict:"id"});if(error)console.warn("Profil oluşturma:",error.message);
  }
  async function createListing(){
    if(!user){hide("listingModal");authOpen("login");toast("İlan vermek için önce giriş yap.");return;}
    const title=$("listingTitle").value.trim(),description=$("listingDescription").value.trim(),category_id=$("listingCategory").value,priceRaw=$("listingPrice").value;
    if(title.length<5||description.length<10||!category_id){$("listingMessage").textContent="Başlık, kategori ve en az 10 karakter açıklama gerekli.";return;}
    const price=priceRaw===""?null:Number(priceRaw);if(price!==null&&(!Number.isFinite(price)||price<0)){$("listingMessage").textContent="Fiyat geçersiz.";return;}
    $("listingSubmit").disabled=true;$("listingMessage").textContent="İlan kaydediliyor…";
    const {error}=await db.from("listings").insert({seller_id:user.id,title,description,category_id,price,currency:"TRY",listing_type:"service",status:"draft",whatsapp_contact_enabled:false});
    $("listingSubmit").disabled=false;
    if(error){$("listingMessage").textContent=error.message;return;}
    $("listingMessage").textContent="İlanın taslak olarak kaydedildi. Yönetici onayından sonra yayına alınacak.";
    $("listingTitle").value="";$("listingDescription").value="";$("listingPrice").value="";
    toast("İlan taslak olarak kaydedildi.");
  }
  async function openDetail(id){
    const x=listings.find(a=>a.id===id);if(!x)return;
    $("detailContent").innerHTML=`<div class="eyebrow">${esc(categoryName(x.category_id))}</div><h2>${esc(x.title)}</h2><div class="detail-price">${esc(money(x.price))}</div><p class="detail-desc">${esc(x.description)}</p><p class="subtle">İlan sahibi: ${esc(x.public_profiles?.display_name||x.public_profiles?.username||"Oyuncu")}</p><button class="btn btn-primary full" id="contactSeller">İlan sahibiyle konuş</button><p class="form-message" id="contactMessage"></p>`;
    show("detailModal");$("contactSeller").addEventListener("click",()=>startConversation(x));
  }
  async function startConversation(x){
    if(!user){hide("detailModal");authOpen("login");return;}
    if(user.id===x.seller_id){$("contactMessage").textContent="Kendi ilanına mesaj gönderemezsin.";return;}
    $("contactSeller").disabled=true;
    const {data:existing}=await db.from("conversations").select("id").eq("listing_id",x.id).eq("buyer_id",user.id).eq("seller_id",x.seller_id).maybeSingle();
    let conversationId=existing?.id;
    if(!conversationId){const {data,error}=await db.from("conversations").insert({listing_id:x.id,buyer_id:user.id,seller_id:x.seller_id}).select("id").single();if(error){$("contactMessage").textContent=error.message;$("contactSeller").disabled=false;return;}conversationId=data.id;}
    const {error:msgError}=await db.from("conversation_messages").insert({conversation_id:conversationId,sender_id:user.id,message:"Merhaba, ilanınız hakkında bilgi almak istiyorum."});
    $("contactSeller").disabled=false;
    if(msgError){$("contactMessage").textContent=msgError.message;return;}
    hide("detailModal");show("accountModal");activeTab="myMessages";loadAccount();toast("Konuşma başlatıldı.");
  }
  async function loadAccount(){
    if(!user)return;
    const {data:p}=await db.from("profiles").select("display_name,username").eq("id",user.id).maybeSingle();
    $("accountName").textContent=p?.display_name||p?.username||"Hesabım";$("accountEmail").textContent=user.email||"";
    document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.tab===activeTab));
    const el=$("accountContent");el.textContent="Yükleniyor…";
    if(activeTab==="myListings"){
      const {data,error}=await db.from("listings").select("id,title,status,created_at").eq("seller_id",user.id).order("created_at",{ascending:false});
      el.innerHTML=error?"İlanlar yüklenemedi.":data?.length?data.map(x=>`<div class="account-row"><span>${esc(x.title)}</span><span class="status-tag">${esc(statusText(x.status))}</span></div>`).join(""):"Henüz ilan oluşturmadın.";
    }else if(activeTab==="myRequests"){
      const {data,error}=await db.from("service_requests").select("id,status,request_note,created_at,listings(title)").or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`).order("created_at",{ascending:false});
      el.innerHTML=error?"Talepler yüklenemedi.":data?.length?data.map(x=>`<div class="account-row"><span>${esc(x.listings?.title||"Hizmet talebi")}</span><span class="status-tag">${esc(x.status)}</span></div>`).join(""):"Henüz hizmet talebin yok.";
    }else{
      const {data,error}=await db.from("conversations").select("id,listing_id,buyer_id,seller_id,last_message_at,listings(title)").or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`).order("last_message_at",{ascending:false});
      if(error){el.textContent="Mesajlar yüklenemedi.";return;}
      el.innerHTML=data?.length?data.map(x=>`<div class="account-row"><span>${esc(x.listings?.title||"İlan konuşması")}<small style="display:block;color:#9299a7;margin-top:4px">${x.buyer_id===user.id?"Alıcı":"Satıcı"} olarak katılıyorsun</small></span><button class="btn btn-ghost" data-chat="${esc(x.id)}">Aç</button></div>`).join(""):"Henüz konuşman yok.";
      el.querySelectorAll("[data-chat]").forEach(b=>b.addEventListener("click",()=>openChat(b.dataset.chat)));
    }
  }
  async function openChat(id){
    const {data:msgs,error}=await db.from("conversation_messages").select("id,sender_id,message,created_at").eq("conversation_id",id).order("created_at",{ascending:true}).limit(100);
    const el=$("accountContent");if(error){el.textContent="Mesajlar açılamadı.";return;}
    el.innerHTML=`<button class="text-button" id="backChats">← Konuşmalara dön</button><div id="chatMessages" style="max-height:260px;overflow:auto;margin:10px 0">${(msgs||[]).map(m=>`<div class="account-row"><span style="max-width:80%;color:${m.sender_id===user.id?"#ffbd79":"#d2d7df"}">${esc(m.message)}</span><small>${new Date(m.created_at).toLocaleString("tr-TR")}</small></div>`).join("")}</div><form id="chatForm" style="display:flex;gap:8px"><input id="chatText" maxlength="5000" placeholder="Mesaj yaz..." style="flex:1;min-width:0;background:#111319;border:1px solid #ffffff22;color:white;padding:10px;border-radius:10px"><button class="btn btn-primary">Gönder</button></form>`;
    $("backChats").onclick=()=>{activeTab="myMessages";loadAccount();};
    $("chatForm").onsubmit=async e=>{e.preventDefault();const message=$("chatText").value.trim();if(!message)return;const {error}=await db.from("conversation_messages").insert({conversation_id:id,sender_id:user.id,message});if(error){toast(error.message);return;}openChat(id);};
  }
  function juniorAnswer(q){
    const s=q.toLocaleLowerCase("tr");
    if(s.includes("ilan")||s.includes("sat"))return "İlan vermek için üstteki “İlan Ver” düğmesine bas. Başlık, kategori ve açıklamayı doldur. İlk aşamada ilan taslak olarak kaydolur; yönetici onayı sonrası yayınlanır.";
    if(s.includes("mesaj")||s.includes("iletişim"))return "Bir ilanı açıp “İlan sahibiyle konuş” düğmesine bas. Giriş yaptıysan platform içinde konuşma başlatılır.";
    if(s.includes("kayıt")||s.includes("üye")||s.includes("şifre"))return "Sağ üstteki Giriş düğmesinden kayıt ekranına geçebilirsin. E-posta doğrulaması açıksa gelen bağlantıyı onaylaman gerekir.";
    if(s.includes("ödeme")||s.includes("para")||s.includes("güven"))return "İlk sürümde site içi ödeme veya emanet sistemi bulunmuyor. Platform ödeme koruması sağlamaz. Koşulları netleştirmeden ödeme yapma.";
    if(s.includes("turnuva")||s.includes("lobi"))return "Turnuva Lobisi kategorisinde lobi açan kullanıcıların ilanlarını bulabilir, kendi turnuva hizmetini de ilan olarak gönderebilirsin.";
    return "Şu an üyelik, ilan verme, mesajlaşma ve turnuva lobisi konularında yardımcı olabilirim. Gerçek zamanlı yapay zekâ bağlantım henüz etkin değil.";
  }
  function bindEvents(){
    $("year").textContent=new Date().getFullYear();
    $("loginOpen").onclick=()=>authOpen("login");$("sellOpen").onclick=()=>{if(!user){authOpen("login");return;}show("listingModal");};$("heroSell").onclick=$("sellOpen").onclick;
    $("accountOpen").onclick=()=>{show("accountModal");loadAccount();};
    $("authSubmit").onclick=submitAuth;$("authToggle").onclick=()=>authOpen(authMode==="login"?"signup":"login");
    $("listingSubmit").onclick=createListing;$("logoutBtn").onclick=async()=>{await db.auth.signOut();user=null;hide("accountModal");await refreshUser();toast("Çıkış yapıldı.");};
    document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>hide(b.dataset.close));
    document.querySelectorAll(".modal-backdrop").forEach(b=>b.addEventListener("click",e=>{if(e.target===b)hide(b.id);}));
    document.querySelectorAll(".filter-chip").forEach(b=>b.onclick=()=>{currentCategory=b.dataset.category;document.querySelectorAll(".filter-chip").forEach(x=>x.classList.toggle("active",x===b));renderListings();});
    $("searchBtn").onclick=renderListings;$("searchInput").oninput=renderListings;
    document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{activeTab=b.dataset.tab;loadAccount();});
    $("juniorOpen").onclick=()=>show("juniorPanel");$("juniorClose").onclick=()=>hide("juniorPanel");
    $("juniorForm").onsubmit=e=>{e.preventDefault();const input=$("juniorInput"),q=input.value.trim();if(!q)return;const body=$("juniorBody");body.insertAdjacentHTML("beforeend",`<div class="junior-bubble user">${esc(q)}</div><div class="junior-bubble">${esc(juniorAnswer(q))}</div>`);input.value="";body.scrollTop=body.scrollHeight;};
  }
  bindEvents();
  if(!clientReady){$("listingGrid").innerHTML='<div class="empty-card">Supabase bağlantısı yüklenemedi. İnternet bağlantını ve config.js ayarlarını kontrol et.</div>';}
  else{refreshUser().then(()=>{loadListings();loadNews();});db.auth.onAuthStateChange((_event,session)=>{user=session?.user||null;refreshUser();});}
})();