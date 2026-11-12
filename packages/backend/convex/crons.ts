import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("delete old emails", { hours: 1 }, internal.email.cleanup);
crons.interval(
  "drop expired OAuth requests and tokens",
  { hours: 1 },
  internal.oauth.cleanup
);

export default crons;
