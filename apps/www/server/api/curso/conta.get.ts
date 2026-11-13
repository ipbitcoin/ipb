/** Who is signed in, which courses they own and how far they are. */
export default defineEventHandler(async (event) => {
  setHeader(event, "Cache-Control", "private, no-store");
  const account = await getAccount(event);
  if (!account) {
    return { courses: [], email: null };
  }
  const courses = await Promise.all(
    account.courses.map(async (c) => {
      const lessons = await loadLessons(c.courseSlug);
      const ids = new Set(lessons.map((l) => l.id));
      const completed = c.completedLessons.filter((id) => ids.has(id));
      return {
        completed,
        diploma: c.diplomaCode
          ? {
              code: c.diplomaCode,
              issuedAt: c.diplomaIssuedAt,
              name: c.diplomaName,
            }
          : null,
        slug: c.courseSlug,
        total: lessons.length,
      };
    })
  );
  return { courses, email: account.email };
});
