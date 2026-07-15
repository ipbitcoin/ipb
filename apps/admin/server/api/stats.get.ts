/** Dashboard counts + recents. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const config = useRuntimeConfig();
  const convex = convexClient();
  const serviceKey = config.SERVICE_KEY;

  const [articles, enrollments, members, newsletters, trainings] =
    await Promise.all([
      convex.query(tableApi("articles").adminList, { serviceKey }),
      convex.query(tableApi("enrollments").adminList, { serviceKey }),
      convex.query(tableApi("members").adminList, { serviceKey }),
      convex.query(tableApi("newsletters").adminList, { serviceKey }),
      convex.query(tableApi("trainings").adminList, { serviceKey }),
    ]);

  return {
    counts: {
      articles: articles.length,
      enrollments: enrollments.length,
      members: members.filter((m) => m.paymentStatus !== "pending").length,
      newsletters: newsletters.length,
      trainings: trainings.length,
    },
    recentEnrollments: enrollments.slice(0, 10),
    recentMembers: members.slice(0, 10),
  };
});
