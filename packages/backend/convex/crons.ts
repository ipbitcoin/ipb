import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("delete old emails", { hours: 1 }, internal.email.cleanup);

export default crons;
