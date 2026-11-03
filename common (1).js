const SB = supabase.createClient("https://qvgbrfgofbndrqfakdsz.supabase.co", "sb_publishable_zXavvG1noQ-cGA4MtNXItQ_qM-YjJLF");
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const TZ = "Asia/Tashkent";
const fm = d => new Date(d).toLocaleString("en-GB", { timeZone: TZ, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const tm = d => new Date(d).toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: TZ });
const lab = r => r.kind == "in" ? (r.status == "ok" ? "Vaqtida" : "Kechikdi") : (r.status == "ok" ? "Vaqtida ketdi" : "Erta ketdi");
const IC = p => '<svg class="i" viewBox="0 0 24 24">' + p + '</svg>';
const LOGO = '<svg class="logo" viewBox="0 0 100 100"><defs><linearGradient id="lgg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#A855F7"/><stop offset="1" stop-color="#3B82F6"/></linearGradient></defs><rect width="100" height="100" rx="24" fill="#070815"/><path d="M72 29A30 30 0 1 0 72 71" fill="none" stroke="url(#lgg)" stroke-width="11" stroke-linecap="round"/><path d="M40 51l10 10 22-24" fill="none" stroke="#22D3EE" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>';

document.documentElement.dataset.theme = localStorage.getItem("ck_theme") || "dark";
function theme(t) { document.documentElement.dataset.theme = t; localStorage.setItem("ck_theme", t); }
function toast(m) { const t = $("toast"); t.textContent = m; t.className = "on"; setTimeout(() => t.className = "", 3500); }

const mail = u => u.trim().toLowerCase() + "@checker.app";
async function me() {
  const { data: { session } } = await SB.auth.getSession();
  const user = session && session.user;
  if (!user) return null;
  const { data } = await SB.from("profiles").select("*").eq("id", user.id).single();
  return data;
}
async function upload(blob, uid) {
  const base = uid + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
  const med = await shrink(blob, 480, .7), st = SB.storage.from("checker-photos");
  const [a] = await Promise.all([st.upload(base + ".jpg", blob, { contentType: "image/jpeg" }), st.upload(base + "_m.jpg", med, { contentType: "image/jpeg" })]);
  if (a.error) throw a.error;
  return base + ".jpg";
}
const signedM = p => signed(p ? p.replace(/\.jpg$/, "_m.jpg") : p);
let _q = [], _t = null; const _c = {};
function signed(path) {
  if (!path) return Promise.resolve("");
  if (_c[path]) return Promise.resolve(_c[path]);
  return new Promise(res => {
    _q.push([path, res]);
    if (!_t) _t = setTimeout(async () => {
      const b = _q; _q = []; _t = null;
      const { data } = await SB.storage.from("checker-photos").createSignedUrls([...new Set(b.map(x => x[0]))], 3600);
      const m = {}; (data || []).forEach(d => { if (d.signedUrl) { m[d.path] = d.signedUrl; _c[d.path] = d.signedUrl; } });
      b.forEach(([p, r]) => r(m[p] || ""));
    }, 0);
  });
}
// call directly from a click handler (needs a user gesture); one persistent input stays in the page
let _pi = null;
function pick(cap) {
  return new Promise(r => {
    if (!_pi) { _pi = document.createElement("input"); _pi.type = "file"; _pi.accept = "image/*"; _pi.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0;width:1px;height:1px"; document.body.appendChild(_pi); }
    _pi.value = ""; if (cap) _pi.setAttribute("capture", cap); else _pi.removeAttribute("capture");
    _pi.onchange = () => r(_pi.files[0] || null);
    _pi.click();
  });
}
async function shrink(f, max = 1600, q = .85) {
  try {
    let bmp;
    try { bmp = await createImageBitmap(f); }
    catch (e) { bmp = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = URL.createObjectURL(f); }); }
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height)), c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    if (bmp.close) bmp.close();
    return await new Promise((ok, no) => c.toBlob(b => b ? ok(b) : no(), "image/jpeg", q));
  } catch (e) { return f; }
}
function loginView(V, msg, done) {
  V.innerHTML = '<div class="c" style="margin:30px 0">' + LOGO + '<h1 class="brand" style="margin-top:12px">CHECKER</h1><p class="m">Nazorat. Intizom. Natija.</p></div>' +
    '<div class="f"><input id="lu" placeholder="Login" autocomplete="username" autocapitalize="none"></div>' +
    '<div class="f"><input id="lp" type="password" placeholder="Parol" autocomplete="current-password"></div>' +
    '<div class="msg" id="err"></div><button class="btn" id="lb">Kirish</button>';
  const e = $("err"); if (msg) { e.style.display = "block"; e.textContent = msg; }
  const go = async () => {
    const b = $("lb"); if (b.disabled) return;
    b.disabled = true;
    const { error } = await SB.auth.signInWithPassword({ email: mail($("lu").value), password: $("lp").value });
    b.disabled = false;
    if (error) { e.style.display = "block"; e.textContent = "Login yoki parol noto‘g‘ri."; return; }
    done();
  };
  $("lb").onclick = go; $("lp").onkeydown = ev => { if (ev.key == "Enter") go(); };
}
if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
