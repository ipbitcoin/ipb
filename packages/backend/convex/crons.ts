import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("delete old emails", { hours: 1 }, internal.email.cleanup);
crons.daily(
  "drop expired OAuth requests and tokens",
  { hourUTC: 4, minuteUTC: 0 },
  internal.oauth.cleanup
);

export default crons;
