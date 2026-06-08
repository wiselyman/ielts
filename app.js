const videoLessons = window.videoLessons || [];
const lessonSummaries = window.lessonSummaries || {};
const currentLessonData = window.currentLessonData || null;
const i18n = window.i18n;

const state = {
  lessonIndex: initialLessonIndex(),
  player: null,
  subtitleTimer: null,
  lastVideoTime: 0,
  lastWallTime: 0,
  lastPlayerState: 0,
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const shouldAutoplay = new URLSearchParams(window.location.search).get("autoplay") === "1";

function currentLesson() {
  const baseLesson = videoLessons[state.lessonIndex % videoLessons.length] || {};
  if (currentLessonData?.id === baseLesson.id) return { ...baseLesson, ...currentLessonData };
  return baseLesson;
}

function lessonOrder() {
  return [...videoLessons]
    .map((lesson, index) => ({ lesson, index }))
    .sort((a, b) => Number(a.lesson.level) - Number(b.lesson.level) || a.index - b.index);
}

function nextLessonIndex() {
  const ordered = lessonOrder();
  const current = ordered.findIndex((item) => item.index === state.lessonIndex);
  return ordered[(current + 1) % ordered.length].index;
}

function autoplayRequested() {
  return shouldAutoplay;
}

function lessonCues() {
  return [...(currentLesson().cues || [])].sort((a, b) => a.at - b.at);
}

function initialLessonIndex() {
  const fileName = window.location.pathname.split("/").pop();
  const fromPath = videoLessons.findIndex((lesson) => lesson.path === fileName);
  if (fromPath >= 0) return fromPath;
  const courseId = new URLSearchParams(window.location.search).get("course");
  const fromUrl = videoLessons.findIndex((lesson) => lesson.id === courseId);
  if (fromUrl >= 0) return fromUrl;
  const fromPage = videoLessons.findIndex((lesson) => lesson.id === window.DEFAULT_COURSE);
  if (fromPage >= 0) return fromPage;
  return Number(localStorage.getItem("lessonIndex") || 0);
}

function updateCourseUrl() {
  if (!window.DEFAULT_COURSE) return;
  window.history.replaceState({}, "", currentLesson().path);
}

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 1600);
}

function openCourseDrawer() {
  $("#course-overlay").hidden = false;
  $("#course-drawer").hidden = false;
}

function closeCourseDrawer() {
  $("#course-overlay").hidden = true;
  $("#course-drawer").hidden = true;
}

function speakTerm(term) {
  if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
    toast(i18n?.t("pronunciationNotSupported") || "当前浏览器不支持发音");
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(term);
  utterance.lang = "en-GB";
  utterance.rate = 0.86;
  window.speechSynthesis.speak(utterance);
}

function cueHasTerm(cue, term) {
  const item = vocabByTerm().get(term.toLowerCase());
  const keepAfter = item?.keepAfter || "";
  return termForms(term).some((form) => {
    const pattern = new RegExp(`\\b${escapeRegExp(form)}\\b${keepAfter ? `(${escapeRegExp(keepAfter)})?` : ""}`, "i");
    return pattern.test(cue.text);
  });
}

function firstCueForTerm(term) {
  return lessonCues().find((cue) => cueHasTerm(cue, term));
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function vocabByTerm() {
  return new Map((currentLesson().vocab || []).map((item) => [item.term.toLowerCase(), item]));
}

function termForms(term) {
  const item = vocabByTerm().get(term.toLowerCase());
  return [term, ...(item?.aliases || [])].sort((a, b) => b.length - a.length);
}

function isPhraseItem(item) {
  return /\bphrase\b/i.test(item.pos || "");
}

function vocabMeta(item) {
  if (isPhraseItem(item)) return "";
  return `<span class="vocab-meta">${item.phonetic} · ${shortPos(item.pos)}</span>`;
}

function shortPos(pos = "") {
  const normalized = pos.toLowerCase().trim();
  const map = {
    adjective: "adj",
    noun: "n",
    verb: "v",
    adverb: "adv",
    "plural noun": "pl n",
    "phrasal verb": "phr v",
  };
  return map[normalized] || normalized.replace(/\badjective\b/g, "adj").replace(/\bnoun\b/g, "n").replace(/\bverb\b/g, "v");
}

function vocabMeaning(item) {
  return i18n?.localizeVocab(item.term, item.zh) || item.zh;
}

function renderThemeTags(theme) {
  return String(theme)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => `<span class="theme-tag">${escapeHtml(i18n?.localizeTheme(tag) || tag)}</span>`)
    .join("");
}

function renderSubtitleText(cue) {
  const text = cue.text || "";
  const vocab = vocabByTerm();
  const candidates = [];

  [...(cue.terms || [])].forEach((term) => {
    const item = vocab.get(term.toLowerCase());
    if (!item) return;
    const keepAfter = item?.keepAfter || "";
    const tailPattern = keepAfter ? escapeRegExp(keepAfter) : "[,;:]?\\s+[A-Za-z]+";
    const formPattern = termForms(term).map(escapeRegExp).join("|");
    const pattern = new RegExp(`(^|\\s)([A-Za-z']+\\s+)?(["'“‘])?(\\b(?:${formPattern})\\b)(["'”’])?(${tailPattern})?`, "gi");
    [...text.matchAll(pattern)].forEach((match) => {
      const leading = match[1] || "";
      const prefix = match[2] || "";
      const openQuote = match[3] || "";
      const word = match[4] || "";
      const closeQuote = match[5] || "";
      const suffix = match[6] || "";
      const start = match.index + leading.length;
      const prefixStart = start;
      const wordStart = prefixStart + prefix.length + openQuote.length;
      const wordEnd = wordStart + word.length;
      const end = wordEnd + closeQuote.length + suffix.length;
      candidates.push({ start, end, prefixStart, wordStart, wordEnd, item });
    });
  });

  const matches = candidates
    .sort((a, b) => a.start - b.start || b.wordEnd - b.wordStart - (a.wordEnd - a.wordStart))
    .reduce((kept, candidate) => {
      if (kept.some((match) => candidate.start < match.end && candidate.end > match.start)) return kept;
      kept.push(candidate);
      return kept;
    }, [])
    .sort((a, b) => a.start - b.start);

  let html = "";
  let cursor = 0;
  matches.forEach((match) => {
    html += escapeHtml(text.slice(cursor, match.start));
    const head = text.slice(match.prefixStart, match.wordStart);
    const word = text.slice(match.wordStart, match.wordEnd);
    const tail = text.slice(match.wordEnd, match.end);
    html += `<span class="term-pack">`;
    if (head) html += `<span class="inline-tail">${escapeHtml(head)}</span>`;
    html += `<span class="inline-term">${escapeHtml(word)}</span><span class="inline-zh">${escapeHtml(vocabMeaning(match.item))}</span>`;
    if (tail) html += `<span class="inline-tail">${escapeHtml(tail)}</span>`;
    html += `</span>`;
    cursor = match.end;
  });
  html += escapeHtml(text.slice(cursor));
  return html;
}

function renderLessonList() {
  $("#lesson-list").innerHTML = lessonOrder()
    .map(({ lesson, index }) => {
      return `
        <button class="lesson-card ${index === state.lessonIndex ? "active" : ""}" data-lesson-index="${index}" data-level="${lesson.level}" type="button">
          <span class="lesson-card-title">${lesson.title}</span>
          <span class="lesson-card-meta">${lesson.source} · ${lesson.duration} · ${i18n?.t("ieltsBand", { level: lesson.level }) || `雅思 ${lesson.level} 分`}</span>
          <span class="theme-tags">${renderThemeTags(lesson.theme)}</span>
        </button>
      `;
    })
    .join("");
}

function ensureSummaryPanel() {
  let panel = $("#video-summary");
  if (panel) return panel;
  const subtitlePanel = $(".subtitle-panel");
  panel = document.createElement("section");
  panel.id = "video-summary";
  panel.className = "video-summary";
  subtitlePanel?.insertAdjacentElement("afterend", panel);
  return panel;
}

function renderVideoSummary() {
  const panel = ensureSummaryPanel();
  panel.innerHTML = `<p>${escapeHtml(i18n?.localizeSummary(currentLesson()) || lessonSummaries[currentLesson().id] || currentLesson().summary)}</p>`;
}

function renderVocab() {
  $("#vocab-list").innerHTML = currentLesson()
    .vocab?.map((item) => {
      const cue = firstCueForTerm(item.term);
      const seekTime = cue ? cue.at : "";
      return `
        <div class="vocab-card" data-term="${item.term.toLowerCase()}" data-seek-time="${seekTime}" role="button" tabindex="0">
          <span class="vocab-main">
            <strong>${item.term}</strong>
            <button class="sound-button" data-speak-term="${item.term}" type="button" aria-label="${escapeHtml(i18n?.t("playPronunciation", { term: item.term }) || `播放 ${item.term} 的发音`)}">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 9v6h4l5 4V5L8 9H4z"></path>
                <path d="M16 8.5a5 5 0 0 1 0 7"></path>
                <path d="M18.5 6a8 8 0 0 1 0 12"></path>
              </svg>
            </button>
            ${vocabMeta(item)}
          </span>
          <span>${escapeHtml(vocabMeaning(item))}</span>
          <small>${item.definition}</small>
        </div>
      `;
    })
    .join("") || "";
}

function createOrLoadPlayer() {
  const lesson = currentLesson();
  if (!window.YT?.Player) {
    $("#video-frame").innerHTML = `<div class="player-loading">${escapeHtml(i18n?.t("youtubeLoading") || "YouTube player is loading...")}</div>`;
    return;
  }
  $("#video-frame").innerHTML = `<div id="youtube-player"></div>`;
  state.player = new YT.Player("youtube-player", {
    videoId: lesson.youtubeId,
    playerVars: {
      rel: 0,
      modestbranding: 1,
      playsinline: 1,
      cc_load_policy: 1,
      autoplay: autoplayRequested() ? 1 : 0,
    },
    events: {
      onReady: () => {
        syncVideoClock();
        resizeYouTubeFrame();
        renderSubtitle();
        startSubtitleSync();
      },
      onStateChange: (event) => {
        state.lastPlayerState = event.data;
        syncVideoClock();
        if (event.data === 1) startSubtitleSync();
        if (event.data === 0) playNextLesson();
        renderSubtitle();
      },
    },
  });
  scheduleYouTubeResize();
}

function resizeYouTubeFrame() {
  const frame = document.querySelector("iframe#youtube-player, #youtube-player iframe");
  if (!frame) return;
  const frameWidth = frame.parentElement?.clientWidth || frame.clientWidth || 0;
  const frameHeight = Math.round((frameWidth * 9) / 16);
  frame.removeAttribute("width");
  frame.removeAttribute("height");
  frame.style.width = "100%";
  frame.style.maxWidth = "100%";
  frame.style.height = frameHeight ? `${frameHeight}px` : "auto";
  frame.style.aspectRatio = "16 / 9";
}

function scheduleYouTubeResize() {
  [100, 500, 1200, 2500].forEach((delay) => setTimeout(resizeYouTubeFrame, delay));
}

function formatTime(seconds) {
  const min = String(Math.floor(seconds / 60)).padStart(2, "0");
  const sec = String(Math.floor(seconds % 60)).padStart(2, "0");
  return `${min}:${sec}`;
}

function activeCue() {
  const cues = lessonCues();
  return cues.reduce((active, cue) => (cue.at <= currentVideoTime() ? cue : active), { at: 0, text: "", terms: [] });
}

function renderSubtitle() {
  const cue = activeCue();
  const seconds = currentVideoTime();
  $("#subtitle-time").textContent = formatTime(seconds);
  $("#big-subtitle").innerHTML = renderSubtitleText(cue);
  $("#subtitle-vocab").innerHTML = "";
  $$(".vocab-card").forEach((card) => {
    card.classList.toggle("active-word", cueHasTerm(cue, card.dataset.term));
  });
}

function syncVideoClock(forcedTime) {
  const seconds = Number.isFinite(forcedTime) ? forcedTime : readPlayerTime();
  state.lastVideoTime = seconds;
  state.lastWallTime = performance.now();
}

function readPlayerTime() {
  try {
    const seconds = state.player?.getCurrentTime?.();
    return Number.isFinite(seconds) ? Math.max(0, seconds) : state.lastVideoTime;
  } catch {
    return state.lastVideoTime;
  }
}

function playerState() {
  try {
    const nextState = state.player?.getPlayerState?.();
    if (Number.isFinite(nextState)) state.lastPlayerState = nextState;
  } catch {}
  return state.lastPlayerState;
}

function currentVideoTime() {
  const raw = readPlayerTime();
  const now = performance.now();
  const isPlaying = playerState() === 1;
  const movedNormally = Math.abs(raw - state.lastVideoTime) > 0.05;
  const jumped = Math.abs(raw - state.lastVideoTime) > 1;
  if (!state.lastWallTime || movedNormally || jumped || !isPlaying) {
    syncVideoClock(raw);
    return raw;
  }
  return state.lastVideoTime + (now - state.lastWallTime) / 1000;
}

function startSubtitleSync() {
  clearInterval(state.subtitleTimer);
  if ($("#subtitle-toggle")) $("#subtitle-toggle").textContent = "同步字幕中";
  state.subtitleTimer = setInterval(() => {
    renderSubtitle();
  }, 250);
}

function stopSubtitleSync() {
  clearInterval(state.subtitleTimer);
  if ($("#subtitle-toggle")) $("#subtitle-toggle").textContent = "同步字幕";
}

function resetSubtitles() {
  try {
    state.player?.seekTo?.(0, true);
  } catch {}
  renderSubtitle();
}

function render() {
  const lesson = currentLesson();
  i18n?.applyStaticText();
  i18n?.renderLanguageSwitcher();
  updateCourseUrl();
  renderLocalizedLesson();
  renderLessonList();
  createOrLoadPlayer();
  renderVocab();
  renderVideoSummary();
  renderSubtitle();
}

function renderLocalizedLesson() {
  const lesson = currentLesson();
  document.title = `${lesson.title} | ${i18n?.t("siteTitle") || "雅思视频实验室"}`;
  $("#lesson-title").textContent = lesson.title;
  $("#lesson-meta").textContent = `${lesson.source} · ${lesson.duration} · ${i18n?.t("ieltsBand", { level: lesson.level }) || `雅思 ${lesson.level} 分`}`;
}

function playNextLesson() {
  window.location.href = `${videoLessons[nextLessonIndex()].path}?autoplay=1`;
}

function seekBy(delta) {
  const nextTime = Math.max(0, currentVideoTime() + delta);
  state.player?.seekTo?.(nextTime, true);
  syncVideoClock(nextTime);
  startSubtitleSync();
  renderSubtitle();
}

function togglePlayPause() {
  const currentState = playerState();
  if (currentState === 1) state.player?.pauseVideo?.();
  else state.player?.playVideo?.();
}

document.addEventListener("click", (event) => {
  const difficultyChip = event.target.closest("[data-filter-level]");
  if (difficultyChip) {
    const level = difficultyChip.dataset.filterLevel;
    const filter = difficultyChip.closest(".difficulty-filter");
    filter?.querySelectorAll(".difficulty-chip").forEach((chip) => chip.classList.toggle("active", chip === difficultyChip));
    const scope = difficultyChip.closest(".course-drawer") || document;
    scope.querySelectorAll(".lesson-card, .home-course-card").forEach((card) => {
      card.hidden = level !== "all" && card.dataset.level !== level;
    });
    const visibleCount = [...scope.querySelectorAll(".lesson-card, .home-course-card")].filter((card) => !card.hidden).length;
    const emptyState = scope.querySelector(".empty-state");
    if (emptyState) emptyState.hidden = visibleCount > 0;
    return;
  }

  const speakButton = event.target.closest("[data-speak-term]");
  if (speakButton) {
    speakTerm(speakButton.dataset.speakTerm);
    return;
  }

  if (event.target.closest("#open-course-list")) {
    openCourseDrawer();
    return;
  }

  if (event.target.closest("#close-course-list") || event.target.closest("#course-overlay")) {
    closeCourseDrawer();
    return;
  }

  const vocabCard = event.target.closest(".vocab-card");
  if (vocabCard) {
    const seekTime = Number(vocabCard.dataset.seekTime);
    if (Number.isFinite(seekTime)) {
      state.player?.seekTo?.(seekTime, true);
      syncVideoClock(seekTime);
      startSubtitleSync();
      setTimeout(renderSubtitle, 120);
      toast(i18n?.t("jumpTo", { time: formatTime(seekTime) }) || `跳到 ${formatTime(seekTime)}`);
    }
    return;
  }

  const lessonCard = event.target.closest("[data-lesson-index]");
  if (lessonCard) {
    const nextIndex = Number(lessonCard.dataset.lessonIndex);
    if (nextIndex === state.lessonIndex) return;
    window.location.href = videoLessons[nextIndex].path;
    return;
  }

  if (event.target.closest("#subtitle-toggle")) {
    startSubtitleSync();
  }

  if (event.target.closest("#subtitle-reset")) {
    resetSubtitles();
  }
});

document.addEventListener("keydown", (event) => {
  const vocabCard = event.target.closest?.(".vocab-card");
  if (vocabCard && ["Enter", " "].includes(event.key)) {
    event.preventDefault();
    vocabCard.click();
    return;
  }

  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.key === " ") {
    event.preventDefault();
    togglePlayPause();
    return;
  }
  if (event.key === "ArrowRight") {
    event.preventDefault();
    seekBy(5);
    return;
  }
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    seekBy(-5);
  }
});

async function initLesson() {
  await i18n?.ready;
  render();
}

window.addEventListener("i18n:languagechange", () => {
  i18n?.applyStaticText();
  renderLocalizedLesson();
  renderLessonList();
  renderVocab();
  renderVideoSummary();
  renderSubtitle();
});

initLesson();

window.onYouTubeIframeAPIReady = () => {
  initLesson();
};

window.addEventListener("resize", resizeYouTubeFrame);

window.videoLab = {
  seek(seconds) {
    state.player?.seekTo?.(seconds, true);
    syncVideoClock(seconds);
    renderSubtitle();
  },
  subtitleAt(seconds) {
    const cues = lessonCues();
    return cues.reduce((active, cue) => (cue.at <= seconds ? cue : active), cues[0]);
  },
};
