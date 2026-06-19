# 课程制作要求

这个文件记录新增课程时必须遵守的规则。以后新增或修改课程时，先读本文件；如果规则和临时想法冲突，以这里为准。

## 给接手 Agent 的硬性约定

- 这个仓库是一个已经上线的网站，不是一次性 Demo。任何改动都要考虑未来 1000 节课的维护成本。
- 不要把课程内容、语言包、字幕或词汇集中塞进一个大文件；课程必须按文件拆分。
- 不要凭空“帮用户优化”词汇。用户对词汇难度非常敏感，尤其 5.5 分以上课程，必须先确认词汇再制作。
- 不要把开发讨论写进面向读者的摘要、页面文案、SEO description 或课程介绍。
- 不要只在本地 HTML 上看效果就结束；需要提交、推送，让 Cloudflare Pages 自动部署。
- 如果改了 `app.js`、`app-home.js`、`styles.css`、`data/*.js` 或课程数据，必须提升所有 HTML 引用里的缓存版本号。
- 如果改了课程列表或新增课程，必须更新 sitemap。
- 如果用户反馈一个 UI bug，不要只修当前课程；优先在共享代码里修，让所有课程和未来课程都受益。

## 当前仓库结构速查

- `index.html`：首页，展示课程库、难度筛选、分页。
- `app-home.js`：首页渲染逻辑，包括课程排序、筛选、分页、缩略图和首页课程卡。
- `lessons/<lesson-id>.html`：每节课单独 HTML。通常只换 SEO、`DEFAULT_COURSE`、课程数据脚本路径和缓存版本。
- `app.js`：所有课程页共享逻辑，包括 YouTube 播放器、大字幕、词汇卡、点击跳转、键盘控制、自动滚动、抽屉课程列表。
- `styles.css`：全站样式，包括首页卡片、课程页布局、字幕、词汇栏、响应式行为。
- `data/lesson-index.js`：轻量课程索引，首页和课程抽屉使用。不要放完整字幕和词汇。
- `data/lessons/<lesson-id>.js`：单课完整数据，包括 `vocab` 和 `cues`。
- `data/i18n.js`：公共 UI 多语言，只放通用界面文案和语言切换逻辑。
- `data/locales/lesson-index.<lang>.js`：首页/课程索引的多语言标题、摘要、主题。
- `data/locales/lessons/<lesson-id>.<lang>.js`：单课词汇释义、摘要等本地化内容。
- `scripts/generate-sitemap.mjs`：根据课程索引生成 `sitemap.xml`。
- `_headers`：Cloudflare Pages 缓存头配置。

## 单课数据 Schema

`data/lessons/<lesson-id>.js` 必须写入 `window.currentLessonData`。核心字段如下：

```js
window.currentLessonData = {
  id: "lesson-id",
  path: "lesson-id.html",
  title: "Video title",
  source: "YouTube · Channel",
  duration: "5:07",
  level: "4.5",
  theme: "topic one, topic two, topic three",
  youtubeId: "YouTubeVideoId",
  summary: "Reader-facing English fallback summary.",
  vocab: [
    {
      term: "produce",
      aliases: ["produce section"],
      phonetic: "/ˈproʊduːs/",
      pos: "noun",
      zh: "农产品",
      definition: "fresh fruit and vegetables",
      group: "core"
    }
  ],
  cues: [
    {
      at: 31.79,
      text: "Why don't we start with the items in the produce section?",
      terms: ["produce"]
    }
  ]
};
```

- `id` 必须和文件名、HTML `DEFAULT_COURSE`、`lesson-index.js` 中的 id 一致。
- `path` 必须是 `lessons/` 下的 HTML 文件名，不带目录。
- `level` 必须是字符串，使用 `4`, `4.5`, `5`, `5.5`, `6`, `6.5`, `7`, `7.5`, `8`, `8.5`, `9`。
- `theme` 用英文逗号分隔，首页会渲染为标签。
- `youtubeId` 只写 ID，不写完整 URL。
- `vocab[].term` 是词卡主词，也是 `cues[].terms` 引用的 key。
- `vocab[].aliases` 用于字幕匹配变体，例如复数、视频中实际出现的 phrase。不要把不相关表达塞进 aliases。
- `vocab[].group` 可选；常用词放核心区，专业/背景词放扩展区。已有课程中 group 可能为空，新增长词表课程应主动分组。
- `cues[].at` 是秒数，必须尽量和 YouTube CC 对齐。
- `cues[].text` 必须是当前视频真实字幕，不要用和视频不一致的 paraphrase。
- `cues[].terms` 只写本句应该高亮的词汇主词，不要写 aliases。

## 新增课程标准流程

1. 先找视频，只给用户视频标题和 YouTube 地址，让用户确认。
2. 用户确认视频后，用户给出词汇表；如果用户没给词汇，不要直接制作完整课程。
3. 根据视频和词汇判断雅思分数是否合理；如不合理，先解释，再按用户最终决定执行。
4. 新建 `lessons/<lesson-id>.html`，复制现有课程 HTML 模板并替换 SEO、`DEFAULT_COURSE` 和数据脚本。
5. 新建 `data/lessons/<lesson-id>.js`，填入课程完整数据。
6. 更新 `data/lesson-index.js`，保持课程按分数从低到高排序。
7. 更新 `data/locales/lesson-index.zh-CN.js`、`zh-TW`、`ja`、`ko`。
8. 更新 `data/locales/lessons/<lesson-id>.<lang>.js`，四种语言都要有。
9. 运行 `node scripts/generate-sitemap.mjs`。
10. 提升所有 HTML 里的缓存版本号。
11. 本地测试，提交并推送。

## 修改共享行为时的交付要求

- 改 `app.js` 时，要至少验证一个普通课程和一个词汇很多/有扩展词汇的课程。
- 改词汇滚动时，要验证宽屏、窄屏、浏览器缩放后只露出一部分词表的情况。
- 改首页样式时，要验证分页、筛选、课程卡等高、长标题、缩略图比例。
- 改语言切换时，要验证首页和课程页都不会残留上一种语言。
- 改缓存版本时，要确认 `index.html` 和所有 `lessons/*.html` 都同步更新，不要漏单课。
- 任何修复都不要只针对某一个 lesson 写特殊逻辑，除非用户明确要求。

## 总体方向

- 网站是 `IELTS Video Lab / 雅思视频实验室`，核心是围绕一个真实英文视频完成听力、词汇、阅读和表达输入。
- 课程页面只围绕当前视频展开，不要做传统、机械、分散的练习页。
- 不要恢复或新增无关模块，例如“Listening 听力任务”“Speaking 口语观点”“Writing 写作框架”“主旨”“问题”“影响”“IELTS 迁移”等。
- 用户不希望大量输入文字，学习交互优先使用选择、点击、播放、跳转和自动联动。

## 新课程工作流

- 新课程必须先选 YouTube 视频，并把视频地址给用户确认。
- 用户确认视频并给出词汇后，再制作课程。
- 不要在用户给出词汇后私自增加额外词汇；只允许修正明显拼写错误，并在回复里说明。
- 如果认为用户给出的课程分数和词汇难度不匹配，先说明判断，再按用户最终决定执行。
- 做完课程后必须测试，提交并推送；Cloudflare Pages 会从 GitHub 自动部署。

## 视频选择

- 视频优先从 YouTube 选择，不限 BBC Learning English；TED-Ed、British Council、新闻、科普、生活类频道都可以。
- 视频长度优先几分钟，通常 2-7 分钟，不要太长。
- 音频必须是真人自然发音，不使用机械电脑音。
- 字幕必须能和视频内容对应，优先使用 YouTube 原始 CC 或可靠字幕；不要使用和视频无关的自制字幕。
- 视频难度不能只看主题，要看语速、句法、信息密度、抽象程度和可学习词汇密度。
- 低分课程可以轻松活泼，但不能把明显没有学习价值的裸基础词当成核心词汇。

## 难度评级

- 课程按雅思分数标注：`4`, `4.5`, `5`, `5.5`, `6`, `6.5`, `7`, `7.5`, `8`, `8.5`, `9`。
- 页面文案使用“雅思 {level} 分”，不要写“难度 {level}”。
- 课程列表按分数从低到高排序，并支持按分数筛选。
- 如果词汇明显达不到目标分数，要降低课程评级，不能为了凑级别强行标高。
- 高分课程需要有对应水平的词汇、搭配、抽象表达或信息密度支撑。

## 文件结构

- 每节课必须是单独 HTML 文件：`lessons/<lesson-id>.html`。
- 每节课必须有单独课程数据文件：`data/lessons/<lesson-id>.js`。
- 每节课每种语言必须拆成单独文件：`data/locales/lessons/<lesson-id>.<lang>.js`。
- 公共多语言只放通用 UI 文案到 `data/i18n.js`，不要把所有课程内容塞进公共 i18n 文件。
- 首页课程索引更新 `data/lesson-index.js`。
- 首页摘要和主题多语言更新 `data/locales/lesson-index.<lang>.js`。
- 每次新增课程必须更新 `sitemap.xml`，运行 `node scripts/generate-sitemap.mjs`。
- 修改 JS、CSS、课程数据或公共行为后，要提升 HTML 里的缓存版本号，例如 `video-lab-ui-75`。

## 课程页面 UI

- 课程页面布局以当前视频为中心：左侧视频、大字幕、中文摘要；右侧词汇。
- 课程列表只通过抽屉/按钮打开，不要常驻占据页面主体。
- 首页课程卡片需要缩略图、雅思分数、来源、时长、主题标签和摘要。
- 首页需要分页；当前每页展示 6 个课程。
- 标签和卡片文案尽量紧凑，不要让页面无意义拉长。
- 主题如 `school day`, `children`, `daily routine` 等应以标签/色块形式呈现。

## 字幕与视频同步

- 字幕必须来自当前视频内容，不能和视频 CC 脱节。
- 大字幕必须足够醒目，是课程页面的主要学习区域。
- 播放到关键词时，大字幕中的英文词必须亮黄色、高于普通字幕文字，并紧跟中文释义。
- 黄色词前后尽量不要强制换行；中文释义紧跟在英文词后面。
- 点击右侧词汇卡片必须跳转到该词在视频中的原始时间点。
- 全页面支持空格暂停/继续 YouTube 视频，方向键前进/后退。
- 视频结束后支持自动播放下一节课。

## 词汇与字幕联动

- 所有课程必须使用共享的 `app.js` 渲染字幕和词汇表，不要在单个课程 HTML 里单独实现词汇交互。
- 视频播放到某个词汇时，右侧词汇卡片必须自动高亮。
- 如果当前高亮词汇不在右侧可见区域内，右侧词汇栏必须自动滚动到该词。
- 第一次命中不可见词汇时就必须滚动，不能等到第二个词才滚动。
- 只露出词卡边框或一小部分内容不算可见；词卡必须完整进入学习者当前可见区域。
- 窄屏/缩放后词表也必须作为独立滚动区域；自动跟随词汇时只滚动词表，不滚动整个页面。
- 如果词表区域本身只有一部分露在屏幕里，自动滚动必须按实际露出的可见窗口定位，不能把当前词滚到屏幕外的容器部分。
- 如果当前高亮词汇在折叠的扩展词汇里，扩展词汇区必须先自动展开，再滚动到该词。
- 新课程只需要在 `data/lessons/<lesson-id>.js` 中提供 `vocab` 和 `cues[].terms`；不要为单课复制自动滚动逻辑。

### 词表自动滚动的实现和验收

这一块已经反复踩坑，后续 agent 不要随意简化。

- 宽屏时 `.study-column` 是 sticky 的右侧独立滚动栏，自动滚动只能改变 `.study-column.scrollTop`，不能滚动整个页面。
- 窄屏/缩放后 `.study-column` 仍然必须是独立滚动区域，自动滚动仍然只改变词表区域，不要让整个页面跳动。
- 判断词卡可见时，不能只看词卡是否在 `.study-column` 这个大容器内部；必须看词卡是否完整进入学习者当前能看到的区域。
- 如果词表容器底部在屏幕外，实际可见区是 `containerRect` 和 `window.innerHeight` 的交集；滚动定位必须使用这个交集。
- 只看到词卡边框、上边缘、下边缘、或一点点高亮背景，都算失败。
- 当前词卡应尽量位于词表实际可见区域的中间；如果可见区域太矮，则至少保证词卡顶部进入可见区域。
- 当前词在扩展词汇里时，先打开扩展区，再计算可见区域并滚动。
- 切换到下一句无关键词时，可以不滚动，但下一次出现关键词必须重新判断，不要被上一次状态阻止。

验收时至少检查以下场景：

- 宽屏正常课程页：播放到列表下方词汇，例如 `self-checkout`，右侧词表应滚到该词。
- 窄屏/浏览器缩放后：词表区域只露出一部分时，播放到 `produce`, `vegetarian`, `self-checkout` 等词，当前词必须完整可读。
- 只露出下一张卡边框时，下一张卡不能被视为可见；播放到该词时必须继续滚动。
- 有扩展词汇的课程：播放到扩展词时，扩展区必须自动打开并滚到该词。
- 快速连续播放/方向键跳转时，不应出现只有第二个词才滚动的延迟。

## 词汇选择

- 词汇必须匹配课程雅思分数，不要为 5.5、6、7 分课程收集明显过低级的词。
- 用户给出词汇后，不要私自增加简单词、短句或凑数表达。
- “常用词组”指有学习价值的搭配或固定表达，不是整句碎片。
- 不要把 `talk about the weather`, `don't like`, `have you got that`, `that's right`, `let us know`, `in the comments`, `every day`, `wake up`, `get the bus` 这类普通句片当作高价值词组。
- 低分课程也应选择相对值得学的词或搭配，不要收 `bus`, `breakfast`, `go to sleep`, `like`, `fish` 这种裸基础词作为核心词汇。
- 词汇数量过多时，使用常用词汇 + 扩展词汇分组，避免右侧一屏爆掉。
- 常用、可迁移、考试中更容易复用的词放在上方常用词汇区。
- 偏专业、偏背景知识、主题专有名词放在扩展词汇区。
- 扩展词汇可以折叠，但仍然必须参与字幕高亮、点击跳转和自动滚动。

## 词汇卡片格式

- 单词卡片包含：英文词、发音按钮、音标、词性、中文释义、英文释义。
- 词性使用缩写：`n`, `v`, `adj`, `adv`, `pl n`, `phr v` 等，不写完整词性。
- phrase/collocation 不显示音标，也不显示词性；这是固定规则。
- 词汇卡片不展示时间点，但点击卡片必须能定位到时间点。
- 发音按钮使用小喇叭图标。
- 英文释义必须是真正定义，不要写成例句片段。

## 摘要

- 字幕下方放中文视频摘要。
- 摘要面向读者，不要写“这次按你的要求”“词表不再收”等开发讨论过程。
- 摘要中重要词汇在中文后标注英语，格式类似：`日常通勤（daily commute）`。
- 摘要应围绕当前课程词汇表组织，不要罗列和词表不一致的大量词。
- 首页卡片摘要也要面向学习者，说明主题、适合分数和课程重点。

## 多语言

- 系统支持简体中文、繁体中文、日语和韩语。
- 页面可根据读者区域自动切换，也可手动切换。
- 公共 UI 文案放在 `data/i18n.js`。
- 课程内容按“一门课的一门语言一个 JS 文件”拆分，不能把 1000 节课的多语言都集中到一个文件。
- 切换语言时，课程标题、摘要、主题、词汇释义和 UI 文案都必须一致切换，不能混用上一次语言。

## SEO 与发布

- 首页标题必须有“雅思视频实验室”，不能只有“视频课程库”。
- 每个课程页面必须有 title、description、canonical、Open Graph title/description/image。
- 课程页初始 HTML 里的 `#lesson-title` 必须写入真实标题，不能只依赖 JS 运行后填充。
- 线上 Cloudflare Pages 会把 `/lessons/<lesson-id>.html` 308 到 `/lessons/<lesson-id>`；公开 SEO URL 必须统一使用无 `.html` 版本。
- 课程 HTML 文件仍然保留 `.html` 文件名，但 canonical、Open Graph URL、首页链接、课程抽屉跳转和 sitemap 都必须指向无 `.html` 的公开 URL。
- 每次新增课程必须更新 `sitemap.xml`，线上地址是 `https://ielts.wisely.top/sitemap.xml`。
- 站点使用 Cloudflare Pages + GitHub 部署。
- 网站统计使用 Cloudflare Web Analytics，不使用 Google Analytics，除非用户明确要求。
- 缓存策略下，HTML 和 sitemap 要能及时更新；带版本号的 JS/CSS/data 可以长期缓存。

## 测试要求

- 新增或修改课程后至少运行：
  - `find data -name '*.js' -print0 | xargs -0 -n1 node --check`
  - `node --check app.js`
  - `node --check app-home.js`
  - `git diff --check`
- 新课程要检查词汇数量、分组数量、每个词是否至少有一个字幕 cue。
- 用浏览器检查课程页：视频加载、标题、雅思分数、词汇卡片、点击跳转、字幕高亮、语言切换、控制台错误。
- 新增课程后检查首页筛选、分页和 sitemap。

## 提交与部署

- 默认提交到 `main`，远程仓库是 `https://github.com/wiselyman/ielts.git`。
- 每次完成用户要求后，除非用户明确说不要提交，否则要 commit 并 push。
- 推送后 Cloudflare Pages 会自动部署到 `https://ielts.wisely.top/`。
- 如果 GitHub push 偶发 SSL/network 失败，直接重试一次；不要因为一次网络失败就停止。
- 提交前确认 `git status --short` 只包含本次任务相关文件。
- 提交后再次确认工作区干净。

## 常见错误，禁止再犯

- 不要把用户和 agent 的讨论过程写进课程摘要。
- 不要把低价值短句当词组，例如 `that's right`, `every day`, `let us know`。
- 不要为高分课程挑明显过低级的词。
- 不要在用户给定词表后私自加简单词。
- 不要让 phrase/collocation 显示音标和词性。
- 不要把所有课程的多语言内容放进 `data/i18n.js`。
- 不要新增课程后忘记 `sitemap.xml`。
- 不要改了 JS/CSS/data 后忘记提升缓存版本。
- 不要只在单个 HTML 里修共享交互。
- 不要让窄屏词表跟随滚动时带着整个页面跳。
- 不要把只露出边框的词卡判断为已经可见。

## 快速交接清单

接手前先回答这几个问题，答不上来就继续读本文件和现有代码：

- 当前任务是新增课程、修共享行为、修样式、还是改 SEO/部署？
- 是否需要用户先确认视频或词汇？
- 会影响 `app.js`、`styles.css`、`app-home.js` 或课程数据吗？如果会，缓存版本号是否要升？
- 是否需要更新 `data/lesson-index.js`、多语言索引、单课多语言文件和 sitemap？
- 是否已经测试宽屏、窄屏、语言切换、词表滚动和控制台错误？
- 是否已经 commit 并 push？
