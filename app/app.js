// Leonida Platinum Road — offline GTA 6 trophy guide and tracker.
// Loads app/data/trophies.json (same origin, no network), renders the checklist,
// the roadmap, the missables page and the guide detail pane, and saves progress
// in localStorage with export and import. No other file is fetched at run time.

const STORAGE_KEY = 'leonida-platinum-road-v1';
const EXAMPLE_EARNED_IDS = [2, 3, 8, 16, 19, 20, 21, 33, 35, 36, 42, 53, 55];

const KIND_LABELS = {
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  online: 'Online',
};

const trophyList = document.getElementById('trophy-list');
const detailCol = document.getElementById('detail-col');
const searchInput = document.getElementById('search');
const gradeFilter = document.getElementById('grade-filter');
const kindChips = document.getElementById('kind-chips');
const spoilerToggle = document.getElementById('spoiler-toggle');
const hideEarnedBox = document.getElementById('hide-earned');
const listCount = document.getElementById('list-count');
const onlineNote = document.getElementById('online-note');
const earnedCountEl = document.getElementById('earned-count');
const progressFill = document.getElementById('progress-fill');
const progressBar = document.getElementById('progress-bar');
const progressLine = document.getElementById('progress-line');
const progressNote = document.getElementById('progress-note');

let trophyData = null;
let earnedNames = new Set();
let selectedId = 28;
let activeTab = 'tracker';
let activeKind = 'all';

function loadSavedProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveProgress() {
  const payload = {
    app: 'leonida-platinum-road',
    version: 1,
    earned: [...earnedNames].sort(),
    spoilersHidden: spoilerToggle.checked,
    hideEarned: hideEarnedBox.checked,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Private mode or a full store: the page still works, it just does not persist.
  }
}

function applyUrlParams(saved) {
  const params = new URLSearchParams(location.search);
  if (params.get('seed') === '13' && !saved) {
    for (const id of EXAMPLE_EARNED_IDS) {
      const trophy = trophyData.trophies.find((entry) => entry.id === id);
      if (trophy) earnedNames.add(trophy.name);
    }
  }
  if (params.get('view') && ['tracker', 'roadmap', 'missables', 'about'].includes(params.get('view'))) {
    activeTab = params.get('view');
  }
  if (params.get('select')) {
    const wanted = Number(params.get('select'));
    if (trophyData.trophies.some((entry) => entry.id === wanted)) selectedId = wanted;
  }
  if (params.get('kind') && (params.get('kind') === 'all' || KIND_LABELS[params.get('kind')])) {
    activeKind = params.get('kind');
  }
  if (params.get('spoilers') === 'off') spoilerToggle.checked = false;
  if (params.get('spoilers') === 'on') spoilerToggle.checked = true;
}

function trophyById(id) {
  return trophyData.trophies.find((entry) => entry.id === id) || null;
}

function isStorySpoiler(trophy) {
  return spoilerToggle.checked && trophy.kinds.includes('story') && !earnedNames.has(trophy.name);
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function formatTarget(trophy) {
  if (trophy.target == null) return null;
  return 'PSN tracks 0/' + trophy.target.toLocaleString('en-US');
}

function medalBadge(trophy) {
  const medal = document.createElement('span');
  medal.className = 'medal medal-' + trophy.grade;
  const dot = document.createElement('span');
  dot.className = 'dot';
  medal.append(dot, document.createTextNode(gradeLabel(trophy.grade)));
  return medal;
}

function metaBadges(trophy) {
  const wrap = document.createElement('div');
  wrap.className = 'trophy-meta';
  wrap.append(medalBadge(trophy));
  if (trophy.hidden) {
    const hidden = document.createElement('span');
    hidden.className = 'tag tag-hidden';
    hidden.textContent = 'Hidden on PSN';
    wrap.append(hidden);
  }
  if (trophy.missable) {
    const flag = document.createElement('span');
    flag.className = 'tag tag-missable';
    flag.textContent = 'Missable';
    wrap.append(flag);
  }
  const target = formatTarget(trophy);
  if (target) {
    const chip = document.createElement('span');
    chip.className = 'tag tag-target';
    chip.textContent = target;
    wrap.append(chip);
  }
  for (const kind of trophy.kinds) {
    if (kind === 'missable' && trophy.missable) continue; // the red Missable flag above already says it
    const chip = document.createElement('span');
    chip.className = 'tag';
    chip.textContent = KIND_LABELS[kind] || kind;
    wrap.append(chip);
  }
  return wrap;
}

function visibleTrophies() {
  const query = searchInput.value.trim().toLowerCase();
  const grade = gradeFilter.value;
  return trophyData.trophies.filter((trophy) => {
    if (grade !== 'all' && trophy.grade !== grade) return false;
    if (activeKind === 'online') return false;
    if (activeKind !== 'all' && !trophy.kinds.includes(activeKind)) return false;
    if (hideEarnedBox.checked && earnedNames.has(trophy.name)) return false;
    if (query) {
      const haystack = (trophy.name + ' ' + trophy.description + ' ' + trophy.guide).toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

function renderProgressHeader() {
  const total = trophyData.trophies.length;
  const earned = earnedNames.size;
  earnedCountEl.textContent = String(earned);
  const pct = Math.round((earned / total) * 100);
  progressFill.style.width = pct + '%';
  progressBar.setAttribute('aria-valuenow', String(earned));
  const counts = {};
  for (const trophy of trophyData.trophies) {
    counts[trophy.grade] = counts[trophy.grade] || { total: 0, earned: 0 };
    counts[trophy.grade].total += 1;
    if (earnedNames.has(trophy.name)) counts[trophy.grade].earned += 1;
  }
  progressLine.textContent =
    'Platinum: ' + (counts.platinum?.earned || 0) + ' of ' + (counts.platinum?.total || 0) +
    ' · Gold: ' + (counts.gold?.earned || 0) + ' of ' + (counts.gold?.total || 0) +
    ' · Silver: ' + (counts.silver?.earned || 0) + ' of ' + (counts.silver?.total || 0) +
    ' · Bronze: ' + (counts.bronze?.earned || 0) + ' of ' + (counts.bronze?.total || 0);
  if (earned === total) {
    progressNote.textContent = 'Platinum earned — you are a Leonida Legend.';
  } else if (earned === 0) {
    progressNote.textContent = 'Tick a trophy when you earn it. Your progress is saved in this browser only.';
  } else {
    progressNote.textContent = pct + '% of the way to the platinum — ' + (total - earned) + ' trophies left.';
  }
}

function renderTrackerList() {
  const shown = visibleTrophies();
  trophyList.replaceChildren();
  for (const trophy of shown) {
    const item = document.createElement('li');
    item.className = 'trophy-row';
    if (earnedNames.has(trophy.name)) item.classList.add('is-earned');
    if (trophy.id === selectedId) item.classList.add('is-selected');
    item.dataset.trophyId = String(trophy.id);

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earnedNames.has(trophy.name);
    box.setAttribute('aria-label', 'Mark ' + trophy.name + ' as earned');
    box.addEventListener('change', (event) => {
      event.stopPropagation();
      toggleEarned(trophy);
    });

    const main = document.createElement('div');
    main.className = 'trophy-main';
    const nameEl = document.createElement('div');
    nameEl.className = 'trophy-name';
    const descEl = document.createElement('div');
    descEl.className = 'trophy-desc';
    if (isStorySpoiler(trophy)) {
      nameEl.textContent = 'Hidden story trophy';
      nameEl.classList.add('spoiler-mask');
      descEl.textContent = 'Spoilers hidden — earn it to reveal its name and description.';
      descEl.classList.add('spoiler-mask');
    } else {
      nameEl.textContent = trophy.name;
      descEl.textContent = trophy.description;
    }
    main.append(nameEl, descEl, metaBadges(trophy));
    item.append(box, main);
    item.addEventListener('click', () => {
      selectedId = trophy.id;
      renderTrackerList();
      renderTrophyDetail();
    });
    trophyList.append(item);
  }
  const total = trophyData.trophies.length;
  listCount.textContent = 'Showing ' + shown.length + ' of ' + total + ' trophies' +
    (earnedNames.size ? ' · ' + earnedNames.size + ' earned' : '');
  onlineNote.hidden = activeKind !== 'online';
}

function splitGuideIntoParagraphs(guide) {
  const sentences = guide.match(/[^.!?]+[.!?]+["”)]?\s*/g) || [guide];
  const paragraphs = [];
  for (let i = 0; i < sentences.length; i += 2) {
    paragraphs.push(sentences.slice(i, i + 2).join(' ').trim());
  }
  return paragraphs;
}

function renderTrophyDetail() {
  detailCol.replaceChildren();
  const trophy = trophyById(selectedId);
  if (!trophy) {
    const empty = document.createElement('p');
    empty.className = 'detail-empty';
    empty.textContent = 'Select a trophy from the list to read its guide.';
    detailCol.append(empty);
    return;
  }
  const badges = metaBadges(trophy);
  const heading = document.createElement('h2');
  const official = document.createElement('p');
  official.className = 'detail-official';
  const officialLabel = document.createElement('span');
  officialLabel.className = 'label';
  officialLabel.textContent = 'Official description — as PlayStation publishes it';
  const stageLine = document.createElement('p');
  stageLine.className = 'detail-stage';
  const stage = trophyData.roadmap.find((entry) => entry.stage === trophy.stage);
  stageLine.textContent = stage ? 'Roadmap stage ' + stage.stage + ': ' + stage.title : '';
  const guideWrap = document.createElement('div');
  guideWrap.className = 'detail-guide';

  if (isStorySpoiler(trophy)) {
    heading.textContent = 'Hidden story trophy';
    heading.classList.add('spoiler-mask');
    official.append(officialLabel, document.createTextNode('Spoilers hidden — earn it to reveal its name and description.'));
    const note = document.createElement('p');
    note.textContent = 'This is a story trophy. Its name and description stay hidden until you earn it, so the story is not spoiled. Tick it earned (left) once it pops and the guide appears here.';
    guideWrap.append(note);
  } else {
    heading.textContent = trophy.name;
    official.append(officialLabel, document.createTextNode(trophy.description));
    for (const paragraph of splitGuideIntoParagraphs(trophy.guide)) {
      const p = document.createElement('p');
      p.textContent = paragraph;
      guideWrap.append(p);
    }
  }

  const checkRow = document.createElement('div');
  checkRow.className = 'detail-check';
  const checkBtn = document.createElement('button');
  checkBtn.type = 'button';
  const isEarned = earnedNames.has(trophy.name);
  checkBtn.textContent = isEarned ? '✓ Earned — untick' : 'Mark as earned';
  if (isEarned) checkBtn.classList.add('is-earned-btn');
  checkBtn.addEventListener('click', () => toggleEarned(trophy));
  checkRow.append(checkBtn);

  detailCol.append(badges, heading, official, stageLine);
  if (trophy.missable && !isStorySpoiler(trophy)) {
    const warn = document.createElement('div');
    warn.className = 'detail-missable';
    warn.textContent = 'Missable: this is the only trophy in the list that can be missed. Read the guide carefully and keep a Chapter 1 save.';
    detailCol.append(warn);
  }
  detailCol.append(guideWrap, checkRow);

  if (!isStorySpoiler(trophy)) {
    const sourcesBox = document.createElement('div');
    sourcesBox.className = 'detail-sources';
    const sourcesHeading = document.createElement('h3');
    sourcesHeading.textContent = 'Sources for this guide';
    const list = document.createElement('ul');
    for (const key of trophy.sources) {
      const source = trophyData.sources[key];
      if (!source) continue;
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = source.label;
      item.append(link);
      list.append(item);
    }
    const ownWords = document.createElement('li');
    ownWords.textContent = 'Guide text: this entry’s own words, written from the sources above.';
    list.append(ownWords);
    sourcesBox.append(sourcesHeading, list);
    detailCol.append(sourcesBox);
  }
}

function renderRoadmapView() {
  const list = document.getElementById('roadmap-list');
  list.replaceChildren();
  for (const stage of trophyData.roadmap) {
    const stageTrophies = trophyData.trophies.filter((entry) => entry.stage === stage.stage);
    const earnedInStage = stageTrophies.filter((entry) => earnedNames.has(entry.name)).length;
    const item = document.createElement('li');
    item.className = 'roadmap-stage';
    const heading = document.createElement('h3');
    const num = document.createElement('span');
    num.className = 'stage-num';
    num.textContent = 'Stage ' + stage.stage;
    heading.append(num, document.createTextNode(stage.title));
    const body = document.createElement('p');
    body.textContent = stage.body;
    item.append(heading, body);
    if (stageTrophies.length) {
      const chips = document.createElement('div');
      chips.className = 'roadmap-trophies';
      for (const trophy of stageTrophies) {
        const chip = document.createElement('span');
        chip.className = 'roadmap-trophy' + (earnedNames.has(trophy.name) ? ' is-earned' : '');
        chip.append(
          document.createTextNode(trophy.name + ' '),
          Object.assign(document.createElement('span'), { className: 'stage-grade', textContent: '(' + gradeLabel(trophy.grade) + ')' }),
        );
        chips.append(chip);
      }
      item.append(chips);
      const progress = document.createElement('p');
      progress.className = 'stage-progress';
      progress.textContent = earnedInStage + ' of ' + stageTrophies.length + ' earned in this stage.';
      item.append(progress);
    } else {
      const note = document.createElement('p');
      note.className = 'stage-progress';
      note.textContent = 'No trophies — preparation only.';
      item.append(note);
    }
    list.append(item);
  }
}

function renderMissablesView() {
  const host = document.getElementById('missable-list');
  host.replaceChildren();
  const missable = trophyData.trophies.filter((entry) => entry.missable);
  for (const trophy of missable) {
    const card = document.createElement('div');
    card.className = 'trophy-row';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earnedNames.has(trophy.name);
    box.setAttribute('aria-label', 'Mark ' + trophy.name + ' as earned');
    box.addEventListener('change', () => toggleEarned(trophy));
    const main = document.createElement('div');
    main.className = 'trophy-main';
    const nameEl = document.createElement('div');
    nameEl.className = 'trophy-name';
    nameEl.textContent = trophy.name;
    const descEl = document.createElement('div');
    descEl.className = 'trophy-desc';
    descEl.textContent = trophy.description;
    const guideEl = document.createElement('div');
    guideEl.className = 'detail-guide';
    for (const paragraph of splitGuideIntoParagraphs(trophy.guide)) {
      const p = document.createElement('p');
      p.textContent = paragraph;
      guideEl.append(p);
    }
    main.append(nameEl, descEl, metaBadges(trophy), guideEl);
    const sourcesBox = document.createElement('div');
    sourcesBox.className = 'detail-sources';
    const sourcesHeading = document.createElement('h3');
    sourcesHeading.textContent = 'Sources for this guide';
    const list = document.createElement('ul');
    for (const key of trophy.sources) {
      const source = trophyData.sources[key];
      if (!source) continue;
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = source.label;
      item.append(link);
      list.append(item);
    }
    sourcesBox.append(sourcesHeading, list);
    main.append(sourcesBox);
    card.append(box, main);
    host.append(card);
  }
  const note = document.createElement('p');
  note.className = 'source-line';
  note.textContent = 'Every other trophy stays available after the credits. The five cryptic trophies (In The Beginning…, Capital Offense, Bad Luck, I Guess, The Truth Is Out There, Ten Pin) have no confirmed trigger yet — they are unconfirmed, not missable.';
  host.append(note);
}

function renderAboutView() {
  const host = document.getElementById('about-body');
  host.replaceChildren();
  const makeup = document.createElement('p');
  makeup.textContent = 'The official PlayStation 5 list has 55 trophies: 1 platinum, 2 gold, 6 silver and 46 bronze. 28 of them stay hidden on PlayStation until you earn them, and none of them is online — every trophy is single-player and offline.';
  const honesty = document.createElement('div');
  honesty.className = 'honesty-box';
  honesty.textContent = trophyData.honesty;
  const sourcesHeading = document.createElement('h3');
  sourcesHeading.textContent = 'Sources';
  const sourcesList = document.createElement('ul');
  for (const source of Object.values(trophyData.sources)) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = source.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = source.label;
    item.append(link);
    sourcesList.append(item);
  }
  const howHeading = document.createElement('h3');
  howHeading.textContent = 'How this tracker works';
  const howList = document.createElement('ul');
  const howItems = [
    'Tick a trophy when you earn it. Progress is saved in this browser (localStorage) and never leaves your machine.',
    'Export progress downloads a JSON file with your earned trophies. Import progress reads such a file back and replaces your ticks.',
    'Hide story spoilers masks the names and descriptions of story trophies until you earn them. Hidden trophies are also marked with a “Hidden on PSN” badge.',
    'The kind filters are Story, Missable, Collectibles, Activities and Online. This list has no online trophies, so that filter shows a note instead of an empty list.',
    'The whole app works offline: every file it loads lives under app/, and it makes no network request at run time. Source links open only when you follow them.',
  ];
  for (const text of howItems) {
    const item = document.createElement('li');
    item.textContent = text;
    howList.append(item);
  }
  host.append(makeup, honesty, sourcesHeading, sourcesList, howHeading, howList);
}

function renderAll() {
  renderProgressHeader();
  renderTrackerList();
  renderTrophyDetail();
  renderRoadmapView();
  renderMissablesView();
  renderAboutView();
}

function toggleEarned(trophy) {
  if (earnedNames.has(trophy.name)) earnedNames.delete(trophy.name);
  else earnedNames.add(trophy.name);
  saveProgress();
  renderAll();
}

function switchTab(tab) {
  activeTab = tab;
  for (const button of document.querySelectorAll('.tab')) {
    button.classList.toggle('is-active', button.dataset.tab === tab);
  }
  for (const panel of document.querySelectorAll('.view-panel')) {
    panel.hidden = panel.id !== 'view-' + tab;
  }
}

function exportProgressFile() {
  const payload = {
    app: 'leonida-platinum-road',
    version: 1,
    exportedAt: new Date().toISOString(),
    earned: [...earnedNames].sort(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'leonida-platinum-road-progress.json';
  link.click();
  URL.revokeObjectURL(url);
}

function importProgressFile(file) {
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const names = Array.isArray(parsed) ? parsed : parsed.earned;
      if (!Array.isArray(names)) throw new Error('no earned list');
      const known = new Set(trophyData.trophies.map((entry) => entry.name));
      const next = new Set();
      for (const name of names) {
        if (typeof name === 'string' && known.has(name)) next.add(name);
      }
      earnedNames = next;
      saveProgress();
      renderAll();
    } catch {
      listCount.textContent = 'That file could not be imported — it is not a progress file from this guide.';
    }
  });
  reader.readAsText(file);
}

function loadExampleProgress() {
  for (const id of EXAMPLE_EARNED_IDS) {
    const trophy = trophyById(id);
    if (trophy) earnedNames.add(trophy.name);
  }
  saveProgress();
  renderAll();
}

function resetProgress() {
  earnedNames = new Set();
  saveProgress();
  renderAll();
}

async function loadTrophyData() {
  const response = await fetch('data/trophies.json');
  if (!response.ok) throw new Error('trophies.json did not load');
  return response.json();
}

async function bootGuide() {
  trophyData = await loadTrophyData();
  const saved = loadSavedProgress();
  if (saved) {
    if (Array.isArray(saved.earned)) {
      const known = new Set(trophyData.trophies.map((entry) => entry.name));
      for (const name of saved.earned) {
        if (known.has(name)) earnedNames.add(name);
      }
    }
    if (typeof saved.spoilersHidden === 'boolean') spoilerToggle.checked = saved.spoilersHidden;
    if (typeof saved.hideEarned === 'boolean') hideEarnedBox.checked = saved.hideEarned;
  }
  applyUrlParams(saved);
  for (const chip of kindChips.querySelectorAll('.chip')) {
    chip.classList.toggle('is-active', chip.dataset.kind === activeKind);
    chip.addEventListener('click', () => {
      activeKind = chip.dataset.kind;
      for (const other of kindChips.querySelectorAll('.chip')) {
        other.classList.toggle('is-active', other === chip);
      }
      renderTrackerList();
    });
  }
  searchInput.addEventListener('input', renderTrackerList);
  gradeFilter.addEventListener('change', renderTrackerList);
  spoilerToggle.addEventListener('change', () => { saveProgress(); renderAll(); });
  hideEarnedBox.addEventListener('change', () => { saveProgress(); renderTrackerList(); });
  document.getElementById('export-btn').addEventListener('click', exportProgressFile);
  document.getElementById('import-file').addEventListener('change', (event) => {
    const file = event.target.files && event.target.files[0];
    if (file) importProgressFile(file);
    event.target.value = '';
  });
  document.getElementById('example-btn').addEventListener('click', loadExampleProgress);
  document.getElementById('reset-btn').addEventListener('click', resetProgress);
  for (const button of document.querySelectorAll('.tab')) {
    button.addEventListener('click', () => switchTab(button.dataset.tab));
  }
  saveProgress();
  renderAll();
  switchTab(activeTab);
}

bootGuide().catch((error) => {
  detailCol.textContent = 'This guide could not load its trophy data (' + error.message + '). Open it from a static server with app/ at its root.';
});
