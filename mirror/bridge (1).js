// bridge.js - connects the Netflix mockup to the mirror bear.
// It wraps functions from netflix.js (netflix.js itself is not edited) and keeps the bear's condition:
//   load = sim minutes watched since the bear was last rested, debt = how worn out he is (0..1).
function mirrorBridgeInit() {
  const KEY = 'mirrorBearV6-v1';
  let stage = document.getElementById('mirrorStage');                    // create it if the page did not have it
  if (!stage) { stage = document.createElement('div'); stage.id = 'mirrorStage'; document.body.appendChild(stage); }
  const P = {
    epMin: 60,
    strainPerMin: 0.004,             // A completed hour adds a visible but gradual amount of strain.
    benefit: 0.025,                   // A short break helps, but never erases accumulated viewing.
    breakFadeMinutes: 360,            // Break relief fades over a long session.
    recoverySecondsPerWatchHour: 30   // Demo scale: four viewing hours recover in two closed-app minutes.
  };
  const T = [
    'You planned to watch one episode.\n\nYour companion is still settled, though a little less bright after a long stretch.',
    'Two episodes have passed. Your companion is more tired now, even with small pauses.\n\nWould you like to continue?',
    'Three episodes have passed. Your companion is deep in the screen glow.\n\nA longer rest can help. Would you like to continue?'
  ];
  let S = { debt: 0, load: 0, ts: Date.now(), restStartedAt: null, recoveryMs: 0, recoveredMinutes: 0 };
  try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  const q = new URLSearchParams(location.search);
  if (q.get('load')) {
    S.load = Math.max(0, +q.get('load'));
    S.debt = Math.min(1, S.load * P.strainPerMin);
    S.restStartedAt = null;
    S.recoveryMs = 0;
    S.recoveredMinutes = 0;
  }

  function applyAwayTime(elapsedMs) {
    if (!S.restStartedAt || !S.recoveryMs || S.load <= 0) return;
    const progress = Math.min(1, Math.max(0, elapsedMs) / S.recoveryMs);
    const loadBeforeRest = S.load;
    const remaining = 1 - progress;
    S.load *= remaining;
    S.debt *= remaining;
    S.recoveredMinutes = (S.recoveredMinutes || 0) + (loadBeforeRest - S.load);
    if (progress >= 1) { S.load = 0; S.debt = 0; }
    S.restStartedAt = null;
    S.recoveryMs = 0;
  }

  const awayForDemo = Math.max(0, +q.get('away') || 0) * 60000;
  applyAwayTime((S.restStartedAt ? Date.now() - S.restStartedAt : 0) + awayForDemo);

  const save = () => {
    S.ts = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
  };
  const visualStrain = () => Math.min(1, S.debt * 1.4);
  const renderStrain = () => {
    const value = Math.round(S.debt * 100);
    const stageIndex = S.debt < 0.30 ? 0 : S.debt < 0.58 ? 1 : 2;
    const track = document.getElementById('strainTrack');
    document.getElementById('strainValue').innerText = value + '%';
    document.getElementById('strainFill').style.width = value + '%';
    track.setAttribute('aria-valuenow', String(value));
    track.setAttribute('aria-valuetext', value + ' percent session strain');
    track.dataset.stage = String(stageIndex + 1);
  };  if (S.recoveredMinutes >= 1) {
    const toast = document.getElementById('recoveryToast');
    toast.innerText = 'A little time away gave your companion room to settle.';
    toast.hidden = false;
    S.recoveredMinutes = 0;
    save();
    setTimeout(() => { toast.hidden = true; }, 6500);
  }
  const markAppClosed = () => {
    if (S.load > 0) {
      S.restStartedAt = Date.now();
      S.recoveryMs = (S.load / 60) * P.recoverySecondsPerWatchHour * 1000;
    }
    save();
  };
  setInterval(save, 5000);
  addEventListener('beforeunload', markAppClosed);
  // viewing time -> load -> debt
  let last = null, ep = 0;
  function add(min) {
    ep += min; S.load += min;
    S.debt = Math.min(1, S.debt + min * P.strainPerMin);
  }
  video.addEventListener('timeupdate', () => {
    const d = video.currentTime - (last === null ? video.currentTime : last);
    if (d > 0 && d < 1.5 && video.duration) add(d / video.duration * P.epMin);   // seeking forward does not count
    last = video.currentTime;
  });
  video.addEventListener('loadstart', () => { last = null; });
  video.addEventListener('ended', () => {
    dbg('video ended');
    setTimeout(() => { if (getComputedStyle(document.getElementById('reflection')).display === 'none') { dbg('card missing, calling showReflection'); showReflection(); } }, 150);
  });

  const dbg = q.get('debug') ? (() => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:2000;font:12px monospace;color:#9f9;background:rgba(0,0,0,.7);padding:6px 8px;max-width:60vw;white-space:pre-wrap'; document.body.appendChild(d); return m => { d.textContent += m + '\n'; }; })() : () => {};
  addEventListener('error', e => dbg('ERROR: ' + e.message));
  dbg('bridge loaded | p5: ' + (typeof resizeCanvas) + ' | sketch: ' + (typeof mirrorShow) + ' | debt ' + S.debt.toFixed(2));
  const ok = () => typeof mirrorShow === 'function' && typeof resizeCanvas === 'function';
  const show = () => { if (!ok()) return; document.body.classList.add('mirror-on'); stage.style.display = 'block'; M.target = visualStrain(); mirrorShow(true); if (window.setAmbientScene) setAmbientScene(true); };
  const hide = () => { document.body.classList.remove('mirror-on'); stage.style.display = 'none'; if (ok()) mirrorHide(); M.caption = ''; M.done = false; if (window.setAmbientScene) setAmbientScene(false); };
  stage.addEventListener('click', () => { if (M.done) hide(); });
  const wrap = (n, f) => { const o = window[n]; window[n] = function () { let r; try { r = o.apply(this, arguments); } catch (e) { console.error(e); dbg('your ' + n + ' threw: ' + e.message); } dbg(n + ' called'); try { f(); } catch (e) { console.error(e); dbg('ERROR in ' + n + ': ' + e.message); } return r; }; };

  wrap('showReflection', () => {                          // autoplay moment
    const card = document.getElementById('reflection'); if (card && getComputedStyle(card).display === 'none') card.style.display = 'block';   // make sure the card shows even if the original threw
    add(Math.max(0, P.epMin - ep)); ep = 0; save();       // a finished episode counts in full, even if skipped through
    const stageIndex = S.debt < 0.30 ? 0 : S.debt < 0.58 ? 1 : 2;
    const stageNames = ['Stage 1 · Daylight', 'Stage 2 · Dim room', 'Stage 3 · Screen glow'];
    const stageBadge = document.getElementById('stageBadge');
    stageBadge.innerText = stageNames[stageIndex];
    stageBadge.dataset.stage = String(stageIndex + 1);
    renderStrain();
    show();
  });
  wrap('continueWatching', () => { ep = 0; hide(); });

  wrap('startBreak', () => {                              // 20 s break: heals a little, less and less as load grows
    M.caption = ''; show();
    setTimeout(() => {
      const b = P.benefit * Math.max(0.1, 1 - S.load / P.breakFadeMinutes), before = S.debt;
      S.debt = Math.max(0, S.debt - b); M.target = visualStrain(); save(); renderStrain();
      M.caption = before <= 0 ? 'Still rested.' : b < 0.02 ? 'After this long, a pause barely helps. Real rest does.' : 'A little lighter.';
      if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) mirrorShow(true);
      setTimeout(hide, 5000);
    }, 20500);
  });

  wrap('stopWatching', () => {
    show();
    M.caption = S.load > 0
      ? 'Close the app for a while. Your companion will recover as time passes.'
      : 'Your companion is already rested.';
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) mirrorShow(true);
    M.done = true;
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mirrorBridgeInit); else mirrorBridgeInit();   // runs once the page is parsed
