const homeLessons = window.videoLessons || [];

function orderedHomeLessons() {
  return [...homeLessons]
    .map((lesson, index) => ({ lesson, index }))
    .sort((a, b) => Number(a.lesson.level) - Number(b.lesson.level) || a.index - b.index);
}

function renderHomeCourses() {
  const grid = document.querySelector("#home-course-grid");
  if (!grid) return;
  grid.innerHTML = orderedHomeLessons()
    .map(({ lesson }) => {
      return `
        <a class="home-course-card" data-level="${lesson.level}" href="./lessons/${lesson.path}">
          <span class="lesson-card-title">${lesson.title}</span>
          <span class="lesson-card-meta">${lesson.source} · ${lesson.duration} · 难度 ${lesson.level}</span>
          <span class="lesson-card-meta">${lesson.theme}</span>
        </a>
      `;
    })
    .join("");
}

function applyHomeDifficultyFilter(level) {
  document.querySelectorAll(".home-course-card").forEach((card) => {
    card.hidden = level !== "all" && card.dataset.level !== level;
  });
  const visibleCount = [...document.querySelectorAll(".home-course-card")].filter((card) => !card.hidden).length;
  document.querySelector("#home-empty").hidden = visibleCount > 0;
}

document.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-filter-level]");
  if (!chip) return;
  const level = chip.dataset.filterLevel;
  document.querySelectorAll(".difficulty-chip").forEach((item) => item.classList.toggle("active", item === chip));
  applyHomeDifficultyFilter(level);
});

renderHomeCourses();
