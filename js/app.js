import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, addDoc, deleteDoc, updateDoc, collection, query, where, orderBy, onSnapshot, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const auth = getAuth(initializeApp(firebaseConfig));
const db = getFirestore(auth.app);
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const say = (t = "") => ($("#err").textContent = t);
const errText = (e) => ({
  "auth/invalid-credential": "Correo o contraseña incorrectos.",
  "auth/email-already-in-use": "Ese correo ya tiene una cuenta.",
  "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
  "permission-denied": "No tienes permiso para esta acción."
}[e.code] || e.message);

let me = null, started = false, opps = [], myApps = [], unsubs = [];

// ---------- Autenticación ----------
document.querySelectorAll(".tabs button").forEach((b) => (b.onclick = () => {
  document.querySelectorAll(".tabs button").forEach((x) => x.classList.toggle("on", x === b));
  $("#fLogin").hidden = b.dataset.t !== "login";
  $("#fReg").hidden = b.dataset.t !== "reg";
  say();
}));

// Permite abrir directamente la pestaña de registro desde los CTA de la web.
const initialTab = new URLSearchParams(window.location.search).get("tab");
if (initialTab === "registro" || initialTab === "reg") {
  document.querySelector('.tabs button[data-t="reg"]')?.click();
}

$("#fLogin").onsubmit = async (e) => {
  e.preventDefault(); say();
  const f = new FormData(e.target);
  try { await signInWithEmailAndPassword(auth, f.get("email"), f.get("password")); } catch (x) { say(errText(x)); }
};

$("#fReg").onsubmit = async (e) => {
  e.preventDefault(); say();
  const f = new FormData(e.target);
  try {
    const c = await createUserWithEmailAndPassword(auth, f.get("email"), f.get("password"));
    await setDoc(doc(db, "users", c.user.uid), {
      name: f.get("name").trim(), email: f.get("email"), role: f.get("role"), createdAt: serverTimestamp()
    });
  } catch (x) { say(errText(x)); }
};

$("#out").onclick = () => signOut(auth);

onAuthStateChanged(auth, (u) => {
  unsubs.forEach((f) => f()); unsubs = []; started = false; me = null;
  $("#auth").hidden = !!u; $("#app").hidden = !u; $("#out").hidden = !u;
  $("#who").textContent = "";
  if (!u) return;
  // Se espera al perfil (se crea justo después del registro).
  unsubs.push(onSnapshot(doc(db, "users", u.uid), (s) => {
    if (!s.exists()) return;
    me = { id: u.uid, ...s.data() };
    $("#who").textContent = `${me.name} · ${me.role === "company" ? "Empresa" : "Estudiante"}`;
    if (!started) start();
  }));
});

// ---------- Datos en tiempo real ----------
function start() {
  started = true;
  $("#companyPanel").hidden = me.role !== "company";
  $("#studentPanel").hidden = me.role !== "student";
  const sort = (a, b) => (b.createdAt?.seconds ?? 9e9) - (a.createdAt?.seconds ?? 9e9);

  unsubs.push(onSnapshot(query(collection(db, "opportunities"), orderBy("createdAt", "desc")), (s) => {
    opps = s.docs.map((d) => ({ id: d.id, ...d.data() })); renderList();
  }));
  const field = me.role === "student" ? "studentId" : "ownerId";
  unsubs.push(onSnapshot(query(collection(db, "applications"), where(field, "==", me.id)), (s) => {
    myApps = s.docs.map((d) => ({ id: d.id, ...d.data() })).sort(sort);
    renderList(); me.role === "student" ? renderMine() : renderApplicants();
  }));
}

// ---------- Vistas ----------
function renderList() {
  const q = $("#q").value.trim().toLowerCase(), ft = $("#ft").value;
  const rows = opps.filter((o) =>
    (!ft || o.type === ft) &&
    (!q || [o.title, o.company, o.location, ...(o.tags || [])].join(" ").toLowerCase().includes(q)));
  $("#list").innerHTML = rows.map((o) => {
    const applied = myApps.some((a) => a.oppId === o.id);
    const btn = me?.role === "student"
      ? `<button class="primary" data-act="apply" data-id="${esc(o.id)}" ${applied ? "disabled" : ""}>${applied ? "Ya te postulaste" : "Postularme"}</button>`
      : o.ownerId === me?.id ? `<button class="ghost" data-act="del" data-id="${esc(o.id)}">Eliminar</button>` : "";
    return `<article class="card"><span class="pill">${esc(o.type)}</span><h3>${esc(o.title)}</h3>
      <p class="meta">${esc(o.company)} · ${esc(o.location)}</p><p>${esc(o.description)}</p>
      <p>${(o.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</p>${btn}</article>`;
  }).join("") || `<p class="empty">Aún no hay oportunidades que coincidan.</p>`;
}

function renderMine() {
  $("#mine").innerHTML = myApps.map((a) => `<div class="row"><div><strong>${esc(a.oppTitle)}</strong>
    <span class="status ${esc(a.status)}">${esc(a.status)}</span></div>
    <button class="ghost" data-act="withdraw" data-id="${esc(a.id)}">Retirar</button></div>`).join("")
    || `<p class="empty">Todavía no te has postulado. Elige una oportunidad abajo.</p>`;
}

function renderApplicants() {
  $("#applicants").innerHTML = myApps.map((a) => `<div class="row"><div><strong>${esc(a.studentName)}</strong>
    para ${esc(a.oppTitle)} <span class="status ${esc(a.status)}">${esc(a.status)}</span></div>
    <div><button class="primary" data-act="accept" data-id="${esc(a.id)}">Aceptar</button>
    <button class="ghost" data-act="reject" data-id="${esc(a.id)}">Rechazar</button></div></div>`).join("")
    || `<p class="empty">Cuando alguien se postule, aparecerá aquí.</p>`;
}

// ---------- Acciones ----------
$("#q").oninput = $("#ft").onchange = renderList;

$("#fOpp").onsubmit = async (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  try {
    await addDoc(collection(db, "opportunities"), {
      title: f.get("title").trim(), location: f.get("location").trim(), type: f.get("type"),
      description: f.get("description").trim(), company: me.name, ownerId: me.id,
      tags: f.get("tags").split(",").map((t) => t.trim()).filter(Boolean).slice(0, 8),
      createdAt: serverTimestamp()
    });
    e.target.reset();
  } catch (x) { alert(errText(x)); }
};

document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const id = b.dataset.id;
  try {
    if (b.dataset.act === "apply") {
      const o = opps.find((x) => x.id === id);
      await setDoc(doc(db, "applications", `${id}_${me.id}`), {
        oppId: id, oppTitle: o.title, ownerId: o.ownerId, studentId: me.id,
        studentName: me.name, status: "pendiente", createdAt: serverTimestamp()
      });
    } else if (b.dataset.act === "withdraw") await deleteDoc(doc(db, "applications", id));
    else if (b.dataset.act === "del" && confirm("¿Eliminar esta oportunidad?")) await deleteDoc(doc(db, "opportunities", id));
    else if (b.dataset.act === "accept") await updateDoc(doc(db, "applications", id), { status: "aceptada" });
    else if (b.dataset.act === "reject") await updateDoc(doc(db, "applications", id), { status: "rechazada" });
  } catch (x) { alert(errText(x)); }
});
