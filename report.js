'use strict';
/* ───────── লুকানো ফিচার: সংখ্যার রিপোর্ট ─────────
   খোলার উপায় —  কম্পিউটারে : Ctrl + Alt + R
                  মোবাইলে   : উপরের পট্টির আইকনে ৩ সেকেন্ডের ভিতরে পরপর ৫ বার চাপ
   একবার খুললে মনে থাকে (localStorage)। বন্ধ করতে আবার একই কাজ।

   রিপোর্ট মোডে কোনো ঘরই বাধ্যতামূলক নয় — শুধু জেলা বাছলেই আসনওয়ারি
   হিসাব; যত নিচে বাছবেন, ভাগও তত নিচে নামবে।                          */

let রিপোর্ট_ডেটা = null;      // data/<slug>/report.js থেকে
let রিপোর্ট_মোড = false;
let বার্তা_পালা = 0;   // পুরোনো টাইমার যেন নতুন বার্তা না মোছে

const চাবি = 'রিপোর্ট-মোড';

/* index.html সরাসরি ডাবল-ক্লিক করে খুললে (file://) কোনো কোনো ব্রাউজার
   localStorage ছুঁতে দেয় না — ব্যতিক্রম উঠলে শুধু এই সেশনে মনে রাখি */
let মনে = null;
const খোলা_আছে = () => {
  try { return localStorage.getItem(চাবি) === '1'; } catch (e) { return মনে === '1'; }
};
const মনে_রাখো = মান => {
  মনে = মান;
  try { localStorage.setItem(চাবি, মান); } catch (e) { /* file:// — চলবে */ }
};

function ফিচার_দেখাও(দেখাব) {
  মনে_রাখো(দেখাব ? '1' : '0');
  $('মোড-বাছাই').classList.toggle('d-none', !দেখাব);
  if (!দেখাব) { $('মোড-খোঁজা').checked = true; মোড_বদলাও(false); }
  const আমার = ++বার্তা_পালা;
  বার্তা(দেখাব ? 'রিপোর্ট মোড চালু হলো।' : 'রিপোর্ট মোড বন্ধ হলো।',
        দেখাব ? 'success' : 'secondary');
  // ইতিমধ্যে নতুন কোনো বার্তা এসে থাকলে সেটা মুছে ফেলা চলবে না
  setTimeout(() => { if (আমার === বার্তা_পালা) বার্তা(''); }, 2500);
}

/* ---- খোলার দুটি উপায় ---- */
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.altKey && (e.key === 'r' || e.key === 'R')) {
    e.preventDefault();
    ফিচার_দেখাও($('মোড-বাছাই').classList.contains('d-none'));
  }
});

let চাপ = 0, চাপ_সময় = 0;
document.querySelector('.navbar-brand svg').addEventListener('click', () => {
  const now = Date.now();
  চাপ = (now - চাপ_সময় < 3000) ? চাপ + 1 : 1;
  চাপ_সময় = now;
  if (চাপ >= 5) {
    চাপ = 0;
    ফিচার_দেখাও($('মোড-বাছাই').classList.contains('d-none'));
  }
});

/* ---- মোড বদল ---- */
$('মোড-খোঁজা').addEventListener('change', () => মোড_বদলাও(false));
$('মোড-রিপোর্ট').addEventListener('change', () => মোড_বদলাও(true));

function মোড_বদলাও(রিপোর্ট) {
  রিপোর্ট_মোড = রিপোর্ট;
  $('শর্ত-শিরোনাম').textContent = রিপোর্ট ? 'রিপোর্টের শর্ত' : 'খোঁজার শর্ত';
  $('খোঁজ').textContent = রিপোর্ট ? 'রিপোর্ট দেখুন' : 'খুঁজুন';

  // রিপোর্টে কোনো ঘরই বাধ্যতামূলক নয়; ফাঁকা মানে "সব"
  ['district', 'seat', 'upazila', 'union', 'area'].forEach(id => {
    $(id).required = !রিপোর্ট;
    if ($(id).options.length && $(id).options[0].value === '')
      $(id).options[0].text = রিপোর্ট ? '— সব —' : '— বেছে নিন —';
  });
  // ছাঁকার ঘরগুলো রিপোর্টে কাজে লাগে না
  $('তথ্য-অংশ').classList.toggle('d-none', রিপোর্ট);

  ফরম.classList.remove('was-validated');
  $('ফলাফল-বাক্স').hidden = true;
  $('রিপোর্ট-বাক্স').hidden = true;
  $('পাতা-নেভ').hidden = true;
  বার্তা('');
}

/* ---- রিপোর্ট বানানো ---- */
async function রিপোর্ট_দেখাও() {
  if (!সূচি) { বার্তা('আগে জেলা বেছে নিন।', 'warning'); return; }
  if (!$('district').value) {
    বার্তা('আগে <b>জেলা</b> বেছে নিন।', 'warning');
    $('district').focus();
    return;
  }
  if (!রিপোর্ট_ডেটা || রিপোর্ট_ডেটা._slug !== সূচি.slug) {
    বার্তা('রিপোর্টের তথ্য নামছে…', 'secondary');
    try {
      await ঢোকাও('data/' + সূচি.slug + '/report.js');
      রিপোর্ট_ডেটা = window.__REPORT__;
      রিপোর্ট_ডেটা._slug = সূচি.slug;
    } catch (e) {
      বার্তা('রিপোর্টের ফাইল পাওয়া গেল না।', 'danger');
      return;
    }
  }

  const t0 = performance.now();
  const সংখ্যা = new Map(রিপোর্ট_ডেটা.সারি.map(r => [r[0], r]));

  // বাছাই অনুযায়ী কোন কোন এলাকা, আর কোন স্তরে যোগফল দেখাব
  const seatId = $('seat').value;
  const s = seatId ? খুঁজে_নাও(সূচি.আসন, seatId) : null;
  const upId = $('upazila').value, unId = $('union').value, arId = $('area').value;

  const সারি = [];              // {নাম, উপনাম, area_id?, সংখ্যা[]}
  let স্তরের_নাম = 'উপজেলা';

  const যোগ = () => [0, 0, 0, 0, 0, 0, 0, 0];
  const যোগ_করো = (a, r) => { for (let i = 0; i < 8; i++) a[i] += r[i + 1]; return a; };
  // একটা ডালের নিচের সব এলাকা যোগ করে দেয়
  const ডাল = এলাকাগুলো => {
    const t = যোগ(); let n = 0;
    এলাকাগুলো.forEach(a => { const r = সংখ্যা.get(a.id); if (r) { যোগ_করো(t, r); n++; } });
    return { সংখ্যা: t, উপনাম: বাংলা(n) + ' এলাকা' };
  };
  const সব_এলাকা = ডালগুলো => ডালগুলো.flatMap(x => x.এলাকা || []);

  if (!seatId) {                                 // পুরো জেলার সব আসন
    স্তরের_নাম = 'সংসদীয় আসন';
    for (const sx of সূচি.আসন)
      সারি.push(Object.assign({ নাম: sx.নাম },
        ডাল(সব_এলাকা(sx.উপজেলা.flatMap(u => u.ইউনিয়ন)))));
  } else if (!upId) {                            // আসনের সব উপজেলা
    for (const u of s.উপজেলা)
      সারি.push(Object.assign({ নাম: u.নাম }, ডাল(সব_এলাকা(u.ইউনিয়ন))));
  } else if (!unId) {                            // এক উপজেলার সব ইউনিয়ন
    স্তরের_নাম = 'ইউনিয়ন / ওয়ার্ড';
    const u = খুঁজে_নাও(s.উপজেলা, upId);
    for (const n of u.ইউনিয়ন)
      সারি.push(Object.assign({ নাম: n.নাম }, ডাল(n.এলাকা)));
  } else {                                       // ইউনিয়নের এলাকা (বা এক এলাকা)
    স্তরের_নাম = 'ভোটার এলাকা';
    const u = খুঁজে_নাও(s.উপজেলা, upId);
    const n = খুঁজে_নাও(u.ইউনিয়ন, unId);
    for (const a of n.এলাকা) {
      if (arId && String(a.id) !== arId) continue;
      const r = সংখ্যা.get(a.id);
      if (r) সারি.push({ নাম: a.নাম, উপনাম: a.নং ? 'এলাকা নং ' + a.নং : '',
                        area_id: a.id, সংখ্যা: r.slice(1) });
    }
  }

  আঁকো(সারি, স্তরের_নাম, performance.now() - t0);
}

function আঁকো(সারি, স্তরের_নাম, সময়) {
  const মোট = [0, 0, 0, 0, 0, 0, 0, 0];
  সারি.forEach(x => x.সংখ্যা.forEach((v, i) => মোট[i] += v));

  const পথ = [সূচি.জেলা];
  ['seat', 'upazila', 'union', 'area'].forEach(k => {
    if ($(k).value && $(k).selectedOptions[0]) পথ.push($(k).selectedOptions[0].text);
  });
  $('রিপোর্ট-শিরোনাম').innerHTML =
    `<span class="thikana-path">${পথ.map(x => esc(x)).join(' · ')}</span>`;

  const শতক = (v) => মোট[0] ? (v * 100 / মোট[0]).toFixed(1) : '0';
  $('রিপোর্ট-সারাংশ').innerHTML = `
    <div class="stat-box">
      <div class="stat"><b>${বাংলা(মোট[0])}</b><span>মোট ভোটার</span></div>
      <div class="stat"><b>${বাংলা(মোট[1])}</b><span>পুরুষ · ${বাংলা(শতক(মোট[1]))}%</span></div>
      <div class="stat"><b>${বাংলা(মোট[2])}</b><span>নারী · ${বাংলা(শতক(মোট[2]))}%</span></div>
      ${মোট[3] ? `<div class="stat"><b>${বাংলা(মোট[3])}</b><span>হিজড়া</span></div>` : ''}
      <div class="stat"><b>${বাংলা(সারি.length)}</b><span>${esc(স্তরের_নাম)}</span></div>
    </div>
    <div class="stat-box mt-2">
      ${['১৮-২৫', '২৬-৪০', '৪১-৬০', '৬০+'].map((l, i) =>
        `<div class="stat"><b>${বাংলা(মোট[i + 4])}</b><span>${l} বছর · ${বাংলা(শতক(মোট[i + 4]))}%</span></div>`
      ).join('')}
    </div>`;

  const শিরোনাম = [স্তরের_নাম, 'মোট', 'পুরুষ', 'নারী', 'হিজড়া',
                   '১৮-২৫', '২৬-৪০', '৪১-৬০', '৬০+'];
  $('রিপোর্ট-হেড').innerHTML = শিরোনাম
    .map((h, i) => `<th${i ? ' class="num"' : ''}>${h}</th>`).join('');

  $('রিপোর্ট-দেহ').innerHTML = সারি.map(x => `
    <tr${x.area_id ? ' data-area="' + x.area_id + '"' : ''}>
      <td>${esc(x.নাম)}${x.উপনাম ? `<span class="thikana">${esc(x.উপনাম)}</span>` : ''}</td>
      ${x.সংখ্যা.map(v => `<td class="num">${v ? বাংলা(v) : '—'}</td>`).join('')}
    </tr>`).join('');

  $('রিপোর্ট-পা').innerHTML = `<tr><td>মোট</td>${
    মোট.map(v => `<td class="num">${বাংলা(v)}</td>`).join('')}</tr>`;

  $('রিপোর্ট-বাক্স').hidden = false;
  বার্তা_পালা++;
  $('ফলাফল-বাক্স').hidden = true;
  $('পাতা-নেভ').hidden = true;
  বার্তা(`<b>${বাংলা(মোট[0])}</b> জন · ${বাংলা(সারি.length)} ${esc(স্তরের_নাম)}`
         + ` · ${বাংলা((সময় / 1000).toFixed(3))} সেকেন্ড`, 'success');
  if (window.innerWidth < 768)
    bootstrap.Collapse.getOrCreateInstance($('ফিল্টার')).hide();
}

/* ---- রিপোর্টের সারিতে ক্লিক → ওই এলাকার ভোটার তালিকা ---- */
$('রিপোর্ট-দেহ').addEventListener('click', async e => {
  const tr = e.target.closest('tr[data-area]');
  if (!tr) return;
  $('area').value = tr.dataset.area;
  await $('area').onchange({ target: $('area') });
  if (!চলতি) return;
  $('মোড-খোঁজা').checked = true;
  মোড_বদলাও(false);
  খোঁজো(true);
});

/* ---- শুরুতে মনে রাখা অবস্থা ---- */
if (খোলা_আছে()) $('মোড-বাছাই').classList.remove('d-none');
