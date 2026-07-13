:root {
  --sky-50:  #f0f9ff;
  --sky-100: #e0f2fe;
  --sky-200: #bae6fd;
  --sky-300: #7dd3fc;
  --sky-400: #38bdf8;
  --sky-500: #0ea5e9;
  --sky-600: #0284c7;
  --sky-700: #0369a1;
  --ink:     #0b2942;
  --muted:   #5b7a91;
  --card:    rgba(255,255,255,0.75);
  --border:  rgba(2,132,199,0.14);
  --shadow:  0 10px 30px -12px rgba(2,132,199,0.35);
  --radius:  20px;
  --grad:    linear-gradient(135deg, #7dd3fc 0%, #0ea5e9 50%, #0284c7 100%);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html, body, #root { height: 100%; }

body {
  font-family: 'Segoe UI', system-ui, -apple-system, Roboto, Helvetica, Arial, sans-serif;
  color: var(--ink);
  background:
    radial-gradient(1200px 600px at 10% -10%, #dff2ff 0%, transparent 55%),
    radial-gradient(1000px 500px at 110% 10%, #cfeeff 0%, transparent 50%),
    linear-gradient(180deg, var(--sky-50) 0%, #ffffff 100%);
  background-attachment: fixed;
  -webkit-font-smoothing: antialiased;
}

button { font-family: inherit; cursor: pointer; border: none; }
input, textarea, select { font-family: inherit; }
a { color: var(--sky-600); text-decoration: none; }

/* ---------- Layout base ---------- */
.app-shell { min-height: 100%; display: flex; flex-direction: column; max-width: 900px; margin: 0 auto; }
.page { flex: 1; padding: 18px 16px 110px; }
.page-title { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 4px; }
.page-sub { color: var(--muted); font-size: 14px; margin-bottom: 18px; }

/* ---------- Cards ---------- */
.card {
  background: var(--card);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 16px;
}
.card + .card { margin-top: 14px; }

/* ---------- Buttons ---------- */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 12px 18px; border-radius: 14px; font-weight: 700; font-size: 15px;
  background: var(--grad); color: #fff;
  box-shadow: 0 8px 20px -8px rgba(14,165,233,0.7);
  transition: transform .15s ease, box-shadow .15s ease, opacity .15s ease;
}
.btn:hover { transform: translateY(-2px); box-shadow: 0 14px 26px -10px rgba(14,165,233,0.8); }
.btn:active { transform: translateY(0); }
.btn:disabled { opacity: .55; cursor: not-allowed; transform: none; }
.btn.ghost {
  background: rgba(255,255,255,0.7); color: var(--sky-700);
  border: 1px solid var(--border); box-shadow: none;
}
.btn.ghost:hover { background: #fff; }
.btn.sm { padding: 9px 13px; font-size: 13px; border-radius: 11px; }
.btn.block { width: 100%; }

.chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: 999px; font-size: 13px; font-weight: 600;
  background: var(--sky-100); color: var(--sky-700); border: 1px solid var(--border);
  cursor: pointer; transition: all .15s ease;
}
.chip.active { background: var(--grad); color: #fff; border-color: transparent; }

/* ---------- Inputs ---------- */
.field { margin-bottom: 14px; }
.field label { display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px; color: var(--sky-700); }
.input, .textarea, .select {
  width: 100%; padding: 12px 14px; border-radius: 13px;
  border: 1px solid var(--border); background: rgba(255,255,255,0.85);
  font-size: 15px; color: var(--ink); outline: none;
  transition: border-color .15s ease, box-shadow .15s ease;
}
.input:focus, .textarea:focus, .select:focus {
  border-color: var(--sky-400);
  box-shadow: 0 0 0 4px rgba(56,189,248,0.18);
}
.textarea { min-height: 120px; resize: vertical; line-height: 1.5; }
.row { display: flex; gap: 10px; }
.row > * { flex: 1; }

/* ---------- Bottom nav ---------- */
.nav {
  position: fixed; left: 50%; transform: translateX(-50%); bottom: 16px;
  width: min(92%, 560px);
  display: flex; justify-content: space-around; align-items: center;
  background: rgba(255,255,255,0.82);
  backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
  border: 1px solid var(--border);
  border-radius: 22px; padding: 8px; box-shadow: var(--shadow); z-index: 40;
}
.nav a {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
  padding: 8px 4px; border-radius: 16px; color: var(--muted);
  font-size: 11px; font-weight: 700; transition: all .18s ease;
}
.nav a.active { color: var(--sky-600); background: var(--sky-100); }
.nav a svg { transition: transform .18s ease; }
.nav a.active svg { transform: translateY(-2px) scale(1.08); }

/* ---------- Top bar ---------- */
.topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px 6px;
}
.topbar .brand { display: flex; align-items: center; gap: 9px; font-weight: 900; font-size: 19px; letter-spacing: -0.5px; }
.topbar .brand img { width: 30px; height: 30px; }
.brand .job { background: var(--grad); -webkit-background-clip: text; background-clip: text; color: transparent; }
.avatar-mini { width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 2px solid #fff; box-shadow: var(--shadow); }
.avatar-mini.placeholder { display:flex; align-items:center; justify-content:center; background: var(--grad); color:#fff; font-weight:800; }

/* ---------- Misc ---------- */
.muted { color: var(--muted); }
.center { text-align: center; }
.spinner {
  width: 20px; height: 20px; border-radius: 50%;
  border: 3px solid rgba(255,255,255,0.4); border-top-color: #fff;
  animation: spin .7s linear infinite;
}
.spinner.dark { border: 3px solid var(--sky-200); border-top-color: var(--sky-600); }
@keyframes spin { to { transform: rotate(360deg); } }

.badge { font-size: 11px; font-weight: 800; padding: 3px 9px; border-radius: 999px; }
.badge.applied { background: #dcfce7; color: #166534; }
.badge.new { background: var(--sky-100); color: var(--sky-700); }

.empty { text-align: center; padding: 40px 20px; color: var(--muted); }
.empty svg { opacity: .5; margin-bottom: 10px; }

.job-item { display: flex; flex-direction: column; gap: 8px; }
.job-item h3 { font-size: 16px; font-weight: 800; }
.job-meta { display: flex; flex-wrap: wrap; gap: 8px; font-size: 13px; color: var(--muted); }
.job-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }

.doc-pill {
  display:flex; align-items:center; justify-content:space-between; gap:8px;
  padding:12px 14px; border-radius:14px; background: rgba(255,255,255,0.7);
  border:1px solid var(--border);
}

.tabs { display:flex; gap:8px; margin-bottom:16px; overflow-x:auto; padding-bottom:2px; }

.done { opacity: .5; }
.done h3 { text-decoration: line-through; }

.modal-backdrop {
  position: fixed; inset: 0; background: rgba(11,41,66,0.45);
  backdrop-filter: blur(4px); z-index: 60;
  display: flex; align-items: flex-end; justify-content: center;
}
.modal {
  background: #fff; width: 100%; max-width: 900px; max-height: 92vh; overflow-y: auto;
  border-radius: 24px 24px 0 0; padding: 20px 18px 30px;
}
@media (min-width: 640px){ .modal-backdrop{ align-items:center; } .modal{ border-radius:24px; } }
