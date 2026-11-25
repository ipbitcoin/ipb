import {
  findCourse,
  FREE_LESSONS,
  ONLINE_COURSES,
} from "@ipb/backend/courseCatalog";

const LESSON_SLUG = /^\d+\.\d+-[a-z0-9-]+$/;

/**
 * Serves one lesson. The first `FREE_LESSONS` lessons of every course are open
 * to anybody, with no account. From the next one on, only a signed-in learner
 * who bought that course gets the lesson. The lesson is the HTML file from
 * `courses/`, with the shared style and script inlined and its links pointed at
 * the site. The page also carries the course's lesson list, which the script
 * uses for the side navigation and for unlocking each lesson after the quiz.
 */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "curso") ?? "";
  const lessonSlug = getRouterParam(event, "licao") ?? "";
  const course = findCourse(slug);
  if (!(course && LESSON_SLUG.test(lessonSlug))) {
    throw createError({ message: "Not found", statusCode: 404 });
  }

  const lessons = await loadLessons(slug);
  const index = lessons.findIndex((l) => l.slug === lessonSlug);
  if (index === -1) {
    throw createError({ message: "Not found", statusCode: 404 });
  }

  const account = await getAccount(event);
  const owned = account?.courses.find((c) => c.courseSlug === slug);
  if (index >= FREE_LESSONS && !owned) {
    // Not paid yet: the course page explains the price and how to sign in.
    return sendRedirect(event, `/curso-online/${slug}?status=locked`);
  }

  const storage = courseStorage();
  const base = `${course.folder}:html`;
  const [page, css, js] = await Promise.all([
    storage.getItem(`${base}:${lessonSlug}.html`),
    storage.getItem(`${base}:lesson.css`),
    storage.getItem(`${base}:lesson.js`),
  ]);
  if (!page) {
    throw createError({ message: "Not found", statusCode: 404 });
  }

  const lessonId = lessons[index]?.id ?? "";
  const state = JSON.stringify({
    completed: owned?.completedLessons ?? [],
    free: FREE_LESSONS,
    lesson: lessonId,
    lessons: lessons.map((l) => ({
      id: l.id,
      minutes: l.minutes,
      module: l.module,
      moduleName: l.moduleName,
      slug: l.slug,
      title: l.title,
    })),
    owned: Boolean(owned),
    slug,
  }).replaceAll("<", String.raw`\u003c`);

  const courseLink = (n: 1 | 2 | 3 | 4) =>
    `/curso-online/${ONLINE_COURSES.find((c) => c.number === n)?.slug}`;

  const html = String(page)
    .replace(
      '<link rel="stylesheet" href="lesson.css">',
      () => `<style>${String(css)}</style>`
    )
    .replace(
      '<script src="lesson.js"></script>',
      () =>
        `<script>window.__IPB_COURSE__=${state};</script><script>${String(js)}</script>`
    )
    .replace(
      "</head>",
      () => '  <meta name="robots" content="noindex, nofollow">\n</head>'
    )
    .replaceAll(
      /href="(\d+\.\d+-[a-z0-9-]+)\.html"/g,
      (_m, file: string) => `href="/aula/${slug}/${file}"`
    )
    .replaceAll('href="#curso"', `href="/curso-online/${slug}"`)
    .replaceAll('href="#curso-2"', `href="${courseLink(2)}"`)
    .replaceAll('href="#curso-3"', `href="${courseLink(3)}"`)
    .replaceAll('href="#curso-4"', `href="${courseLink(4)}"`)
    .replaceAll('href="#diploma"', `href="/curso-online/diploma/${slug}"`);

  setHeader(event, "Content-Type", "text/html; charset=utf-8");
  setHeader(event, "Cache-Control", "private, no-store");
  setHeader(event, "X-Robots-Tag", "noindex, nofollow");
  return html;
});
