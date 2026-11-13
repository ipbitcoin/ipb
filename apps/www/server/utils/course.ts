import { api } from "@ipb/backend/api";
import { findCourse } from "@ipb/backend/courseCatalog";
import type { H3Event } from "h3";

export const COURSE_COOKIE = "ipb_curso";
const SESSION_MAX_AGE_S = 90 * 24 * 60 * 60;

export interface LessonInfo {
  /** "1.2": the lesson's number inside the course. */
  id: string;
  /** File name without extension, also the URL slug. */
  slug: string;
  title: string;
  minutes: number;
  module: number;
  moduleName: string;
}

const lessonCache = new Map<string, LessonInfo[]>();

const byNumber = (a: LessonInfo, b: LessonInfo) => {
  const [aMajor = 0, aMinor = 0] = a.id.split(".").map(Number);
  const [bMajor = 0, bMinor = 0] = b.id.split(".").map(Number);
  return aMajor - bMajor || aMinor - bMinor;
};

function parseLesson(file: string, html: string): LessonInfo | undefined {
  const slug = file.replace(/\.html$/, "");
  const id = /^(\d+\.\d+)-/.exec(slug)?.[1];
  const title = /<h1>(.*?)<\/h1>/s.exec(html)?.[1]?.trim();
  if (!(id && title)) {
    return undefined;
  }
  const minutes = Number(/(\d+) min/.exec(html)?.[1] ?? 10);
  const eyebrow = /<p class="eyebrow">(.*?)<\/p>/s.exec(html)?.[1] ?? "";
  const mod = /^Módulo (\d+) · (.*?) · Lição/.exec(eyebrow);
  return {
    id,
    minutes,
    module: mod ? Number(mod[1]) : 0,
    moduleName: mod?.[2] ?? "Início",
    slug,
    title,
  };
}

/** Courses' files live in the repo's `courses/` folder (bundled as server assets). */
export function courseStorage() {
  return useStorage("assets:courses");
}

/** The lessons of a course, read from its HTML files (one source of truth). */
export async function loadLessons(slug: string): Promise<LessonInfo[]> {
  const course = findCourse(slug);
  if (!course) {
    return [];
  }
  const cached = lessonCache.get(slug);
  if (cached && !import.meta.dev) {
    return cached;
  }
  const storage = courseStorage();
  const keys = await storage.getKeys(`${course.folder}:html`);
  const lessons: LessonInfo[] = [];
  for (const key of keys) {
    const file = key.split(":").pop() ?? "";
    if (!/^\d+\.\d+-.*\.html$/.test(file)) {
      continue;
    }
    const html = String((await storage.getItem(key)) ?? "");
    const lesson = parseLesson(file, html);
    if (lesson) {
      lessons.push(lesson);
    }
  }
  lessons.sort(byNumber);
  lessonCache.set(slug, lessons);
  return lessons;
}

export function sessionToken(event: H3Event): string | undefined {
  const token = getCookie(event, COURSE_COOKIE);
  return token && /^[a-f0-9]{64}$/.test(token) ? token : undefined;
}

export async function getAccount(event: H3Event) {
  const token = sessionToken(event);
  if (!token) {
    return null;
  }
  return await convexClient().query(api.courses.account, {
    serviceKey: useRuntimeConfig().SERVICE_KEY,
    tokenHash: hashToken(token),
  });
}

export async function requireAccount(event: H3Event) {
  const account = await getAccount(event);
  if (!account) {
    throw createError({ message: "Not signed in", statusCode: 401 });
  }
  return account;
}

export function setSessionCookie(event: H3Event, token: string) {
  setCookie(event, COURSE_COOKIE, token, {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_S,
    path: "/",
    sameSite: "lax",
    secure: !import.meta.dev,
  });
}

/** Absolute site URL used for payment redirects. */
export function siteOrigin(event: H3Event): string {
  const config = useRuntimeConfig();
  return String(
    config.APP_URL ||
      getRequestHeader(event, "origin") ||
      getRequestHeader(event, "referer")?.replace(
        /^(https?:\/\/[^/]+).*$/,
        "$1"
      ) ||
      ""
  ).replace(/\/$/, "");
}

/** Path of the learner-facing pages, per locale. */
export function coursePath(
  locale: "pt" | "en",
  page: "home" | "purchase" | "signin"
) {
  const base = locale === "en" ? "/en/online-course" : "/curso-online";
  if (page === "purchase") {
    return `${base}/${locale === "en" ? "purchase" : "compra"}`;
  }
  if (page === "signin") {
    return `${base}/${locale === "en" ? "sign-in" : "entrar"}`;
  }
  return base;
}
