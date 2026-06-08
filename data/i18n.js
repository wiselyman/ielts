const i18nData = {
  "zh-CN": {
    label: "简体中文",
    htmlLang: "zh-CN",
    ui: {
      siteTitle: "雅思视频实验室",
      homeSummary:
        "围绕真实英文视频建立 IELTS 输入系统：先听懂内容，再在同一语境里反复遇见关键词、短语和表达。每节课标注雅思分数、主题和核心词汇，适合每天学习几分钟。",
      filterLabel: "按雅思分数筛选",
      all: "全部",
      ieltsBand: "雅思 {level} 分",
      courseCount: "共 {count} 节课",
      previous: "上一页",
      next: "下一页",
      empty: "这个分数暂时没有课程。",
      courseLibrary: "Course Library",
      chooseCourse: "选择一个视频课程",
      closeCourseList: "关闭课程列表",
      courseList: "课程列表",
      pronunciationNotSupported: "当前浏览器不支持发音",
      playPronunciation: "播放 {term} 的发音",
      jumpTo: "跳到 {time}",
      youtubeLoading: "YouTube player is loading...",
    },
  },
  "zh-Hant": {
    label: "繁體中文",
    htmlLang: "zh-Hant",
    ui: {
      siteTitle: "雅思影片實驗室",
      homeSummary:
        "圍繞真實英文影片建立 IELTS 輸入系統：先聽懂內容，再在同一語境裡反覆遇見關鍵詞、短語和表達。每節課標註雅思分數、主題和核心詞彙，適合每天學習幾分鐘。",
      filterLabel: "按雅思分數篩選",
      all: "全部",
      ieltsBand: "雅思 {level} 分",
      courseCount: "共 {count} 節課",
      previous: "上一頁",
      next: "下一頁",
      empty: "這個分數暫時沒有課程。",
      courseLibrary: "Course Library",
      chooseCourse: "選擇一個影片課程",
      closeCourseList: "關閉課程列表",
      courseList: "課程列表",
      pronunciationNotSupported: "目前瀏覽器不支援發音",
      playPronunciation: "播放 {term} 的發音",
      jumpTo: "跳到 {time}",
      youtubeLoading: "YouTube player is loading...",
    },
  },
  ja: {
    label: "日本語",
    htmlLang: "ja",
    ui: {
      siteTitle: "IELTS 動画ラボ",
      homeSummary:
        "本物の英語動画を軸に IELTS のインプットを作ります。内容を聞き取り、同じ文脈で重要語句や表現に何度も出会えます。各レッスンには IELTS 目安スコア、テーマ、重要語彙があります。",
      filterLabel: "IELTS スコアで絞り込み",
      all: "すべて",
      ieltsBand: "IELTS {level}",
      courseCount: "全 {count} レッスン",
      previous: "前へ",
      next: "次へ",
      empty: "このスコアのレッスンはまだありません。",
      courseLibrary: "Course Library",
      chooseCourse: "動画レッスンを選ぶ",
      closeCourseList: "レッスン一覧を閉じる",
      courseList: "レッスン一覧",
      pronunciationNotSupported: "このブラウザは音声再生に対応していません",
      playPronunciation: "{term} の発音を再生",
      jumpTo: "{time} へ移動",
      youtubeLoading: "YouTube player is loading...",
    },
  },
  ko: {
    label: "한국어",
    htmlLang: "ko",
    ui: {
      siteTitle: "IELTS 비디오 랩",
      homeSummary:
        "실제 영어 영상을 중심으로 IELTS 입력 시스템을 만듭니다. 먼저 내용을 듣고, 같은 맥락에서 핵심 단어와 구문, 표현을 반복해서 만납니다. 각 수업에는 IELTS 예상 점수, 주제, 핵심 어휘가 표시됩니다.",
      filterLabel: "IELTS 점수로 필터링",
      all: "전체",
      ieltsBand: "IELTS {level}",
      courseCount: "총 {count}개 수업",
      previous: "이전",
      next: "다음",
      empty: "이 점수대의 수업은 아직 없습니다.",
      courseLibrary: "Course Library",
      chooseCourse: "비디오 수업 선택",
      closeCourseList: "수업 목록 닫기",
      courseList: "수업 목록",
      pronunciationNotSupported: "현재 브라우저는 발음을 지원하지 않습니다",
      playPronunciation: "{term} 발음 재생",
      jumpTo: "{time}로 이동",
      youtubeLoading: "YouTube player is loading...",
    },
  },
};

const i18nScriptUrl = document.currentScript.src;
const loadedLocaleScripts = new Set();

function detectLanguage() {
  const saved = localStorage.getItem("ieltsVideoLabLanguage");
  if (saved && i18nData[saved]) return saved;
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language || ""];
  for (const raw of languages) {
    const lang = raw.toLowerCase();
    if (lang.startsWith("zh-tw") || lang.startsWith("zh-hk") || lang.startsWith("zh-mo") || lang === "zh-hant") return "zh-Hant";
    if (lang.startsWith("zh")) return "zh-CN";
    if (lang.startsWith("ja")) return "ja";
    if (lang.startsWith("ko")) return "ko";
  }
  return "zh-CN";
}

let activeLanguage = detectLanguage();

function dictionary() {
  return i18nData[activeLanguage] || i18nData["zh-CN"];
}

function format(template, values = {}) {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");
}

function t(key, values) {
  return format(dictionary().ui[key] || i18nData["zh-CN"].ui[key] || key, values);
}

function localizeTheme(tag) {
  return window.lessonIndexLocale?.themes?.[tag] || tag;
}

function localizeVocab(term, fallback) {
  return window.lessonLocale?.vocab?.[term] || fallback || term;
}

function localizeSummary(lesson) {
  return window.lessonLocale?.summary || window.lessonIndexLocale?.summaries?.[lesson.id] || lesson.summary || "";
}

function localeScriptUrl(relativePath) {
  const url = new URL(relativePath, i18nScriptUrl);
  url.search = new URL(i18nScriptUrl).search;
  return url.href;
}

function loadScript(src) {
  if (loadedLocaleScripts.has(src)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => {
      loadedLocaleScripts.add(src);
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

function localeScripts(language) {
  const scripts = [localeScriptUrl(`locales/lesson-index.${language}.js`)];
  const lessonId = window.currentLessonData?.id || window.DEFAULT_COURSE;
  if (lessonId) scripts.push(localeScriptUrl(`locales/lessons/${lessonId}.${language}.js`));
  return scripts;
}

async function loadLocale(language) {
  if (!i18nData[language]) return;
  await Promise.all(localeScripts(language).map(loadScript));
}

async function setLanguage(language) {
  if (!i18nData[language]) return;
  activeLanguage = language;
  localStorage.setItem("ieltsVideoLabLanguage", language);
  await loadLocale(language);
  applyStaticText();
  window.dispatchEvent(new CustomEvent("i18n:languagechange", { detail: { language } }));
}

function renderLanguageSwitcher() {
  if (document.querySelector(".language-switcher")) return;
  const topbar = document.querySelector(".topbar");
  if (!topbar) return;
  const wrap = document.createElement("label");
  wrap.className = "language-switcher";
  wrap.innerHTML = `
    <span>${activeLanguage === "ja" ? "言語" : activeLanguage === "ko" ? "언어" : "语言"}</span>
    <select aria-label="Language">
      ${Object.entries(i18nData)
        .map(([code, data]) => `<option value="${code}" ${code === activeLanguage ? "selected" : ""}>${data.label}</option>`)
        .join("")}
    </select>
  `;
  wrap.querySelector("select").addEventListener("change", (event) => setLanguage(event.target.value));
  topbar.appendChild(wrap);
}

function applyStaticText() {
  document.documentElement.lang = dictionary().htmlLang;
  const h1 = document.querySelector(".library-home h1");
  if (h1) h1.textContent = t("siteTitle");
  const summary = document.querySelector(".home-summary");
  if (summary) summary.textContent = t("homeSummary");
  const filter = document.querySelector(".difficulty-filter");
  if (filter) filter.setAttribute("aria-label", t("filterLabel"));
  document.querySelectorAll('[data-filter-level="all"]').forEach((item) => (item.textContent = t("all")));
  document.querySelectorAll(".empty-state").forEach((item) => (item.textContent = t("empty")));
  document.querySelectorAll("#open-course-list").forEach((item) => (item.textContent = t("courseList")));
  document.querySelectorAll("#close-course-list").forEach((item) => item.setAttribute("aria-label", t("closeCourseList")));
  const drawerEyebrow = document.querySelector("#course-drawer .eyebrow");
  if (drawerEyebrow) drawerEyebrow.textContent = t("courseLibrary");
  const drawerTitle = document.querySelector("#course-drawer h2");
  if (drawerTitle) drawerTitle.textContent = t("chooseCourse");
  if (document.querySelector(".library-home")) document.title = `${t("siteTitle")} | IELTS Video Lab`;
}

window.i18n = {
  data: i18nData,
  language: () => activeLanguage,
  ready: loadLocale(activeLanguage),
  t,
  localizeTheme,
  localizeVocab,
  localizeSummary,
  renderLanguageSwitcher,
  applyStaticText,
  setLanguage,
};
