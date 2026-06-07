const homeLessons = window.videoLessons || [];
const homeSummaries = window.lessonSummaries || {};
const pageSize = 8;

let activeLevel = "all";
let currentPage = 1;

function orderedHomeLessons() {
  return [...homeLessons]
    .map((lesson, index) => ({ lesson, index }))
    .sort((a, b) => Number(a.lesson.level) - Number(b.lesson.level) || a.index - b.index);
}

function filteredHomeLessons() {
  return orderedHomeLessons().filter(({ lesson }) => activeLevel === "all" || lesson.level === activeLevel);
}

function thumbnailUrl(lesson) {
  return `https://i.ytimg.com/vi/${lesson.youtubeId}/hqdefault.jpg`;
}

function courseDescription(lesson) {
  return homeSummaries[lesson.id] || lesson.summary || "";
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function renderThemeTags(theme) {
  return String(theme)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => `<span class="theme-tag">${escapeHtml(tag)}</span>`)
    .join("");
}

function renderHomeCourses() {
  const grid = document.querySelector("#home-course-grid");
  if (!grid) return;
  const lessons = filteredHomeLessons();
  const pageCount = Math.max(1, Math.ceil(lessons.length / pageSize));
  currentPage = Math.min(currentPage, pageCount);
  const start = (currentPage - 1) * pageSize;
  const visibleLessons = lessons.slice(start, start + pageSize);

  grid.innerHTML = visibleLessons
    .map(({ lesson }) => {
      return `
        <a class="home-course-card" data-level="${lesson.level}" href="./lessons/${lesson.path}">
          <span class="course-thumb">
            <img src="${thumbnailUrl(lesson)}" alt="${lesson.title} 视频缩略图" loading="lazy" />
            <span class="course-level">雅思 ${lesson.level} 分</span>
          </span>
          <span class="lesson-card-title">${escapeHtml(lesson.title)}</span>
          <span class="lesson-card-meta">${escapeHtml(lesson.source)} · ${escapeHtml(lesson.duration)}</span>
          <span class="theme-tags">${renderThemeTags(lesson.theme)}</span>
          <span class="course-description">${escapeHtml(courseDescription(lesson))}</span>
        </a>
      `;
    })
    .join("");
  document.querySelector("#home-empty").hidden = lessons.length > 0;
  renderPagination(pageCount, lessons.length);
}

function renderPagination(pageCount, totalCount) {
  const pagination = document.querySelector("#home-pagination");
  if (!pagination) return;
  if (pageCount <= 1) {
    pagination.innerHTML = totalCount ? `<span class="pagination-count">共 ${totalCount} 节课</span>` : "";
    return;
  }
  const buttons = Array.from({ length: pageCount }, (_, index) => {
    const page = index + 1;
    return `<button class="page-button ${page === currentPage ? "active" : ""}" data-page="${page}" type="button">${page}</button>`;
  }).join("");
  pagination.innerHTML = `
    <button class="page-button" data-page="${Math.max(1, currentPage - 1)}" ${currentPage === 1 ? "disabled" : ""} type="button">上一页</button>
    ${buttons}
    <button class="page-button" data-page="${Math.min(pageCount, currentPage + 1)}" ${currentPage === pageCount ? "disabled" : ""} type="button">下一页</button>
    <span class="pagination-count">共 ${totalCount} 节课</span>
  `;
}

document.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-filter-level]");
  if (chip) {
    activeLevel = chip.dataset.filterLevel;
    currentPage = 1;
    document.querySelectorAll(".difficulty-chip").forEach((item) => item.classList.toggle("active", item === chip));
    renderHomeCourses();
    return;
  }

  const pageButton = event.target.closest("[data-page]");
  if (pageButton) {
    currentPage = Number(pageButton.dataset.page);
    renderHomeCourses();
    document.querySelector("#home-course-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

renderHomeCourses();
