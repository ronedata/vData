'use strict';
/* সার্ভারবিহীন সংস্করণ — ডেটা আসে data/*.js ফাইল থেকে, অনুসন্ধান এখানেই */

const $ = id => document.getElementById(id);
const FIELDS = ['নাম', 'পিতা', 'মাতা', 'জন্ম', 'পেশা', 'লিঙ্গ'];
const ধাপ = ['seat', 'upazila', 'union', 'area'];
const পরের = { district: 'seat', seat: 'upazila', upazila: 'union', union: 'area' };
const নামধাম = { district: 'জেলা', seat: 'আসন', upazila: 'উপজেলা', union: 'ইউনিয়ন', area: 'ভোটার এলাকা' };
const পাতাপ্রতি = 20;

/* ---------- অ্যাপের নাম (config.js থেকে) ---------- */
const CFG = Object.assign(
  { শিরোনাম: 'তথ্য অনুসন্ধান', জেলা_দেখাও: false, মোট_দেখাও: false },
  window.__CONFIG__ || {});
document.title = CFG.শিরোনাম;
$('অ্যাপ-নাম').firstChild.textContent = CFG.শিরোনাম;

/* এলাকার তথ্য — info বাক্সে, খালি হলে লুকানো */
const এলাকা_তথ্য = লেখা => {
  const el = $('এলাকা-তথ্য');
  el.textContent = লেখা || '';
  el.classList.toggle('d-none', !লেখা);
};


let সূচি = null, চলতি = null;          // চলতি = এখন যে এলাকার ডেটা নামানো আছে
let ফল = [], page = 0, মোটপাতা = 1, শেষশর্ত = {};

/* ---------- ফাইল থেকে ডেটা আনা ----------
   fetch() নয় — ব্রাউজার file:// থেকে fetch আটকায়, <script> আটকায় না।
   তাই ডাবল-ক্লিক করেও চলে, ওয়েবসার্ভারেও চলে।                              */
const ঢোকাও = src => new Promise((মিলল, হলো_না) => {
  const s = document.createElement('script');
  s.src = src;
  s.onload = () => { s.remove(); মিলল(); };
  s.onerror = () => { s.remove(); হলো_না(new Error(src + ' পাওয়া গেল না')); };
  document.head.appendChild(s);
});

/* ---------- ড্রপডাউন ---------- */
const ভরাও = (sel, items, ফাঁকা, লেবেল) => {
  sel.innerHTML = '';
  if (ফাঁকা !== null) sel.appendChild(new Option(ফাঁকা, ''));
  // জেলার বস্তুতে id নেই, slug আছে; পেশা আবার স্রেফ লেখা
  for (const it of items)
    sel.appendChild(new Option(লেবেল(it), it.id ?? it.slug ?? it));
  sel.disabled = false;
};

const নিচেরগুলো_বন্ধ = from => {
  let lv = পরের[from];
  while (lv) {
    $(lv).innerHTML = `<option value="">— আগে ${নামধাম[from]} —</option>`;
    $(lv).disabled = true;
    $(lv).classList.remove('is-invalid', 'is-valid');
    from = lv; lv = পরের[lv];
  }
  এলাকা_তথ্য('');
};

const খুঁজে_নাও = (তালিকা, id) => তালিকা.find(x => String(x.id) === String(id));

/* ---------- শুরু ---------- */
let জেলাগুলো = [];

(async () => {
  try {
    await ঢোকাও('data/districts.js');
  } catch (e) {
    বার্তা('ডেটা পাওয়া গেল না। <code>data/districts.js</code> আছে কিনা দেখুন।', 'danger');
    return;
  }
  জেলাগুলো = window.__DISTRICTS__ || [];
  if (!জেলাগুলো.length) { বার্তা('কোনো জেলার ডেটা তৈরি নেই।', 'warning'); return; }

  // এক জেলা হলে নিজে থেকেই বসে যায়, একাধিক হলে বেছে নিতে হয়
  ভরাও($('district'), জেলাগুলো,
       জেলাগুলো.length > 1 ? '— বেছে নিন —' : null, x => x.নাম);
  $('পেশা').innerHTML = '<option value="">— সব —</option>';
  $('পেশা').disabled = true;
  if (জেলাগুলো.length === 1) {
    $('district').value = জেলাগুলো[0].slug;
    await জেলা_নাও(জেলাগুলো[0].slug);
  }
})();

/* এক জেলার সূচি নামানো */
async function জেলা_নাও(slug) {
  নিচেরগুলো_বন্ধ('district');
  সূচি = null;
  if (!slug) return;
  try {
    await ঢোকাও('data/' + slug + '/index.js');
  } catch (e) {
    বার্তা('এই জেলার ডেটা পাওয়া গেল না।', 'danger');
    return;
  }
  সূচি = window.__INDEX__;
  if (CFG.জেলা_দেখাও) $('জেলা-নাম').textContent = ' — ' + সূচি.জেলা;
  if (CFG.মোট_দেখাও) $('মোট-ভোটার').textContent = বাংলা(সূচি.মোট) + ' জন';
  ভরাও($('seat'), সূচি.আসন, '— বেছে নিন —', x => x.নাম);
}

$('district').onchange = e => জেলা_নাও(e.target.value);

$('seat').onchange = e => {
  নিচেরগুলো_বন্ধ('seat');
  const s = খুঁজে_নাও(সূচি.আসন, e.target.value);
  if (s) ভরাও($('upazila'), s.উপজেলা, '— বেছে নিন —', x => x.নাম);
};
$('upazila').onchange = e => {
  নিচেরগুলো_বন্ধ('upazila');
  const s = খুঁজে_নাও(সূচি.আসন, $('seat').value);
  const u = s && খুঁজে_নাও(s.উপজেলা, e.target.value);
  if (u) ভরাও($('union'), u.ইউনিয়ন, '— বেছে নিন —', x => x.নাম);
};
$('union').onchange = e => {
  নিচেরগুলো_বন্ধ('union');
  const s = খুঁজে_নাও(সূচি.আসন, $('seat').value);
  const u = s && খুঁজে_নাও(s.উপজেলা, $('upazila').value);
  const n = u && খুঁজে_নাও(u.ইউনিয়ন, e.target.value);
  if (n) ভরাও($('area'), n.এলাকা, '— বেছে নিন —',
              x => x.নং ? `${x.নাম} (${x.নং})` : x.নাম);
};

$('area').onchange = async function (e) {
  $('পেশা').innerHTML = '<option value="">— সব —</option>';
  $('পেশা').disabled = true;
  এলাকা_তথ্য('');
  if (!e.target.value) { চলতি = null; return; }
  এলাকা_তথ্য('এলাকার তথ্য নামছে…');
  try {
    await ঢোকাও('data/' + সূচি.slug + '/area/' + e.target.value + '.js');
    চলতি = window.__AREA__;
    এলাকা_তথ্য(`এই এলাকায় মোট ${বাংলা(চলতি.সারি.length)} জন ভোটার`);
    ভরাও($('পেশা'), চলতি.পেশা, '— সব —', x => x);   // এই এলাকার পেশাগুলো
  } catch (err) {
    চলতি = null;
    এলাকা_তথ্য('');
    বার্তা('এই এলাকার ফাইলটি পাওয়া গেল না।', 'danger');
  }
};

/* ---------- ফরম ---------- */
const ফরম = $('খোঁজ-ফরম');

ফরম.addEventListener('submit', e => {
  e.preventDefault(); e.stopPropagation();
  ফরম.classList.add('was-validated');
  if (!ফরম.checkValidity()) {
    const প্রথম = ফরম.querySelector(':invalid');
    if (প্রথম) { প্রথম.focus(); প্রথম.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    return;
  }
  // রিপোর্ট মোড চালু থাকলে অন্য পথে (report.js)
  if (typeof রিপোর্ট_মোড !== 'undefined' && রিপোর্ট_মোড) রিপোর্ট_দেখাও();
  else খোঁজো(true);
});

ফরম.addEventListener('reset', () => setTimeout(() => {
  ফরম.classList.remove('was-validated');
  নিচেরগুলো_বন্ধ('district');
  if (জেলাগুলো.length === 1) { $('district').value = জেলাগুলো[0].slug;
                               জেলা_নাও(জেলাগুলো[0].slug); }
  $('পেশা').innerHTML = '<option value="">— সব —</option>';
  $('পেশা').disabled = true;
  চলতি = null; ফল = [];
  $('ফলাফল').innerHTML = ''; $('ফলাফল-বাক্স').hidden = true;
  if ($('রিপোর্ট-বাক্স')) $('রিপোর্ট-বাক্স').hidden = true;
  বার্তা(''); $('পাতা-নেভ').hidden = true;
  bootstrap.Collapse.getOrCreateInstance($('ফিল্টার')).show();
}, 0));

/* ---------- অনুসন্ধান (ব্রাউজারেই) ---------- */
const বার্তা = (লেখা, ধরন = 'info') => {
  $('বার্তা').innerHTML = লেখা
    ? `<div class="alert alert-${ধরন} py-2 px-3 mb-3">${লেখা}</div>` : '';
};

const bn2ascii = s => s.replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d));

function অনুসন্ধান() {
  const q = {};
  FIELDS.forEach(f => { const v = $(f).value.trim(); if (v) q[f] = v; });
  শেষশর্ত = q;

  const লিঙ্গ_i = q.লিঙ্গ ? সূচি.লিঙ্গ.indexOf(q.লিঙ্গ) : -1;
  const পেশা_i = q.পেশা ? চলতি.পেশা.indexOf(q.পেশা) : -1;
  const জন্ম = q.জন্ম ? bn2ascii(q.জন্ম).trim() : '';
  // জন্ম: ১৯৯২ · ০৭/১৯৯২ · ০৪/০৭/১৯৯২ — সবই iso (1992-07-04) মিলিয়ে দেখি
  let জন্ম_খোঁজ = '';
  if (/^\d{4}$/.test(জন্ম)) জন্ম_খোঁজ = জন্ম + '-';
  else if (/^\d{2}\/\d{4}$/.test(জন্ম)) {
    const [m, y] = জন্ম.split('/'); জন্ম_খোঁজ = `${y}-${m}-`;
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(জন্ম)) {
    const [d, m, y] = জন্ম.split('/'); জন্ম_খোঁজ = `${y}-${m}-${d}`;
  } else জন্ম_খোঁজ = জন্ম;

  return চলতি.সারি.filter(r => {
    if (q.নাম && !r[1].includes(q.নাম)) return false;
    if (q.পিতা && !r[2].includes(q.পিতা)) return false;
    if (q.মাতা && !r[3].includes(q.মাতা)) return false;
    if (q.পেশা && r[4] !== পেশা_i) return false;
    if (জন্ম_খোঁজ && !r[5].startsWith(জন্ম_খোঁজ) && !r[5].includes(জন্ম_খোঁজ)) return false;
    if (q.লিঙ্গ && r[6] !== লিঙ্গ_i) return false;
    return true;
  });
}

function খোঁজো(নতুন = true, পাতা = 0) {
  if (!চলতি) { বার্তা('আগে ভোটার এলাকা বেছে নিন।', 'warning'); return; }
  const t0 = performance.now();
  if (নতুন) { ফল = অনুসন্ধান(); পাতা = 0; }
  page = পাতা;
  মোটপাতা = Math.max(1, Math.ceil(ফল.length / পাতাপ্রতি));

  $('ফলাফল').innerHTML = '';
  if ($('রিপোর্ট-বাক্স')) $('রিপোর্ট-বাক্স').hidden = true;
  if (ফল.length === 0) {
    বার্তা('এই শর্তে কাউকে পাওয়া যায়নি। কম শর্ত দিয়ে আবার চেষ্টা করুন।', 'warning');
    $('ফলাফল-বাক্স').hidden = true; $('পাতা-নেভ').hidden = true;
    return;
  }
  const অংশ = ফল.slice(page * পাতাপ্রতি, (page + 1) * পাতাপ্রতি);
  অংশ.forEach((r, i) => $('ফলাফল').appendChild(সারি_বানাও(r, page * পাতাপ্রতি + i)));
  $('ফলাফল-বাক্স').hidden = false;
  অবস্থান_দেখাও(ফল.length);
  পেজিনেশন(অংশ.length);

  if (নতুন) {
    বার্তা(`<b>${বাংলা(ফল.length)}</b> জন পাওয়া গেছে · ${বাংলা(((performance.now() - t0) / 1000).toFixed(3))} সেকেন্ড`, 'success');
    if (window.innerWidth < 768)
      bootstrap.Collapse.getOrCreateInstance($('ফিল্টার')).hide();
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/* ---------- পাতা ---------- */
function পেজিনেশন(এই_পাতায়) {
  const ul = $('পাতা-তালিকা');
  ul.innerHTML = '';
  $('পাতা-নেভ').hidden = মোটপাতা < 2;

  const বোতাম = (লেখা, পাতা, { সক্রিয় = false, বন্ধ = false } = {}) => {
    const li = document.createElement('li');
    li.className = 'page-item' + (সক্রিয় ? ' active' : '') + (বন্ধ ? ' disabled' : '');
    const a = document.createElement('button');
    a.type = 'button'; a.className = 'page-link'; a.textContent = লেখা;
    if (!বন্ধ && !সক্রিয়) a.onclick = () => খোঁজো(false, পাতা);
    li.appendChild(a); ul.appendChild(li);
  };

  বোতাম('আগের', page - 1, { বন্ধ: page === 0 });
  const শুরু = Math.max(0, Math.min(page - 2, মোটপাতা - 5));
  const শেষ = Math.min(মোটপাতা, শুরু + 5);
  if (শুরু > 0) { বোতাম(বাংলা(1), 0); if (শুরু > 1) বোতাম('…', 0, { বন্ধ: true }); }
  for (let i = শুরু; i < শেষ; i++) বোতাম(বাংলা(i + 1), i, { সক্রিয়: i === page });
  if (শেষ < মোটপাতা) {
    if (শেষ < মোটপাতা - 1) বোতাম('…', 0, { বন্ধ: true });
    বোতাম(বাংলা(মোটপাতা), মোটপাতা - 1);
  }
  বোতাম('পরের', page + 1, { বন্ধ: page + 1 >= মোটপাতা });

  $('পাতা-তথ্য').textContent =
    `${বাংলা(page * পাতাপ্রতি + 1)}–${বাংলা(page * পাতাপ্রতি + এই_পাতায়)} দেখানো হচ্ছে`
    + ` · মোট ${বাংলা(ফল.length)} · পৃষ্ঠা ${বাংলা(page + 1)}/${বাংলা(মোটপাতা)}`;
}

/* ---------- সারি ---------- */
const esc = s => (s ?? '').toString().replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const চিহ্নিত = (লেখা, খোঁজ) => {
  const t = esc(লেখা);
  if (!খোঁজ) return t;
  const k = esc(খোঁজ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return t.replace(new RegExp(k, 'g'), m => `<mark>${m}</mark>`);
};

/* [ক্রমিক, নাম, পিতা, মাতা, পেশা_i, জন্ম_iso, লিঙ্গ_i, ঠিকানা_i, নং] */
const পড়ো = r => ({
  ক্রমিক: r[0], নাম: r[1], পিতা: r[2], মাতা: r[3],
  পেশা: r[4] >= 0 ? চলতি.পেশা[r[4]] : '',
  জন্ম_iso: r[5],
  জন্ম_তারিখ: r[5] ? বাংলা(r[5].slice(8, 10) + '/' + r[5].slice(5, 7) + '/' + r[5].slice(0, 4)) : '',
  বয়স: r[5] ? Math.floor((Date.now() - new Date(r[5])) / 31557600000) : null,
  লিঙ্গ: r[6] >= 0 ? সূচি.লিঙ্গ[r[6]] : '',
  ঠিকানা: r[7] >= 0 ? চলতি.ঠিকানা[r[7]] : '',
  ভোটার_নং: বাংলা(r[8]),
});

function সারি_বানাও(r, i) {
  const v = পড়ো(r);
  const tr = document.createElement('tr');
  tr.dataset.i = i;
  tr.tabIndex = 0;
  tr.setAttribute('role', 'button');
  tr.title = 'পূর্ণ তথ্য দেখতে ক্লিক করুন';

  const ঘর = (label, html, cls = '') =>
    `<td data-label="${label}"${cls ? ' class="' + cls + '"' : ''}>` +
    `<span class="val">${html}</span></td>`;

  tr.innerHTML =
    ঘর('ক্রমিক', বাংলা(v.ক্রমিক), 'krom-cell') +
    ঘর('নাম',
       `<span class="nam">${চিহ্নিত(v.নাম || '(নাম নেই)', শেষশর্ত.নাম)}</span>` +
       (v.ঠিকানা ? `<span class="thikana">${esc(v.ঠিকানা)}</span>` : ''),
       'nam-cell') +
    ঘর('পিতা', চিহ্নিত(v.পিতা || '—', শেষশর্ত.পিতা)) +
    ঘর('মাতা', চিহ্নিত(v.মাতা || '—', শেষশর্ত.মাতা)) +
    ঘর('জন্ম তারিখ', (v.জন্ম_তারিখ || '—') +
       (v.বয়স != null ? ` <span class="boyos">(${বাংলা(v.বয়স)} বছর)</span>` : '')) +
    ঘর('পেশা', esc(v.পেশা || '—')) +
    ঘর('লিঙ্গ', esc(v.লিঙ্গ || '—')) +
    ঘর('ভোটার নম্বর', `<span class="nombor">${esc(v.ভোটার_নং || '—')}</span>`);
  return tr;
}

function অবস্থান_দেখাও(মোট) {
  const p = চলতি.পথ;
  $('অবস্থান-পট্টি').innerHTML = `
    <span class="thikana-path">
      <b>${esc(চলতি.নাম)}</b>${চলতি.নং ? ' (' + esc(চলতি.নং) + ')' : ''}
      · ${esc(p.ইউনিয়ন)}${p.ওয়ার্ড ? ' — ওয়ার্ড ' + বাংলা(p.ওয়ার্ড) : ''}
      · ${esc(p.উপজেলা)} · ${esc(p.আসন)}
    </span>
    <span class="badge rounded-pill text-bg-light">${বাংলা(মোট)} জন</span>`;
}

/* ---------- সারিতে ক্লিক → পূর্ণ কার্ড ---------- */
$('ফলাফল').addEventListener('click', e => {
  const tr = e.target.closest('tr[data-i]');
  if (tr) বিস্তারিত_দেখাও(পড়ো(ফল[+tr.dataset.i]));
});
$('ফলাফল').addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const tr = e.target.closest('tr[data-i]');
  if (tr) { e.preventDefault(); বিস্তারিত_দেখাও(পড়ো(ফল[+tr.dataset.i])); }
});

function বিস্তারিত_দেখাও(v) {
  const p = চলতি.পথ;
  $('বিস্তারিত-নাম').textContent = v.নাম || '(নাম নেই)';
  const সারি = (k, val) => val ? `<dt>${k}</dt><dd>${esc(val)}</dd>` : '';
  $('বিস্তারিত-দেহ').innerHTML = `
    <div class="d-flex flex-wrap gap-1 mb-3">
      ${v.লিঙ্গ ? `<span class="badge rounded-pill badge-soft">${esc(v.লিঙ্গ)}</span>` : ''}
      ${v.বয়স != null ? `<span class="badge rounded-pill badge-soft">${বাংলা(v.বয়স)} বছর</span>` : ''}
      ${v.পেশা ? `<span class="badge rounded-pill badge-soft">${esc(v.পেশা)}</span>` : ''}
    </div>
    <dl class="bistarito">
      ${সারি('ভোটার নম্বর', v.ভোটার_নং)}
      ${সারি('ক্রমিক', বাংলা(v.ক্রমিক))}
      ${সারি('পিতা', v.পিতা)}
      ${সারি('মাতা', v.মাতা)}
      ${সারি('জন্ম তারিখ', v.জন্ম_তারিখ)}
      ${সারি('পেশা', v.পেশা)}
      ${সারি('লিঙ্গ', v.লিঙ্গ)}
    </dl>
    <div class="thikana-box mt-3">
      <div class="section-label mb-1">ঠিকানা</div>
      <div class="mb-2">${esc(v.ঠিকানা || '—')}</div>
      <div class="section-label mb-1">অবস্থান</div>
      <div class="thikana-path small">
        ভোটার এলাকা <b>${esc(চলতি.নাম)}</b>${চলতি.নং ? ' (' + esc(চলতি.নং) + ')' : ''}<br>
        ইউনিয়ন/ওয়ার্ড <b>${esc(p.ইউনিয়ন)}</b>${p.ওয়ার্ড ? ' — ওয়ার্ড ' + বাংলা(p.ওয়ার্ড) : ''}<br>
        উপজেলা <b>${esc(p.উপজেলা)}</b> · আসন <b>${esc(p.আসন)}</b>
      </div>
    </div>`;
  $('কপি').dataset.text = [
    'নাম: ' + v.নাম, 'ভোটার নম্বর: ' + v.ভোটার_নং, 'পিতা: ' + v.পিতা,
    'মাতা: ' + v.মাতা, 'জন্ম তারিখ: ' + v.জন্ম_তারিখ, 'পেশা: ' + v.পেশা,
    'লিঙ্গ: ' + v.লিঙ্গ, 'ঠিকানা: ' + v.ঠিকানা,
    'এলাকা: ' + চলতি.নাম + ' · ' + p.ইউনিয়ন + ' · ' + p.উপজেলা + ' · ' + p.আসন,
  ].join('\n');
  bootstrap.Modal.getOrCreateInstance($('বিস্তারিত')).show();
}

$('কপি').onclick = async e => {
  try {
    await navigator.clipboard.writeText(e.target.dataset.text || '');
    e.target.textContent = 'কপি হয়েছে ✓';
    setTimeout(() => e.target.textContent = 'তথ্য কপি করুন', 1500);
  } catch { e.target.textContent = 'কপি করা গেল না'; }
};

/* ---------- সংখ্যা বাংলায় ---------- */
function বাংলা(n) {
  const t = (typeof n === 'number' && Number.isInteger(n) && Math.abs(n) >= 10000)
    ? n.toLocaleString('en-IN') : String(n ?? '');
  return t.replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
}
