import { google } from "googleapis";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getGoogleAuth } from "../services/google-auth.service.js";
import { accountField, runTool, type ToolDef } from "./_shared.js";

const APP_ID = 1;

async function api(userId: string, account?: string) {
  const { auth, accountEmail } = await getGoogleAuth(userId, APP_ID, account);
  return {
    classroom: google.classroom({ version: "v1", auth: auth }),
    accountEmail,
  };
}

const pad = (n?: number | null) => String(n ?? 0).padStart(2, "0");
const due = (d?: any, t?: any) =>
  d?.year
    ? `${d.year}-${pad(d.day)}${t ? ` ${pad(t.hours)}:${pad(t.minutes)}` : ""} UTC`
    : null;
const clip = (s?: string | null, n = 300) =>
  s && s.length > n ? s.slice(0, n) + "..." : (s ?? "");
const clamp = (n: number | undefined, def: number, max: number) =>
  Math.min(Math.max(n ?? def, 1), max);

function attachments(list?: any[] | null) {
  return (list ?? [])
    .map((m) => {
      if (m.driveFile?.driveFile)
        return {
          type: "drive",
          title: m.driveFile.driveFile.title,
          url: m.driveFile.driveFile.alternateLink,
        };
      if (m.link) return { type: "link", title: m.link.title, url: m.link.url };
      if (m.youtubeVideo)
        return {
          type: "link",
          title: m.youtubeVideo.title,
          url: m.youtubeVideo.alternateLink,
        };
      if (m.form)
        return { type: "form", title: m.form.title, url: m.form.formUrl };
      return null;
    })
    .filter(Boolean);
}

export const classroomTools: ToolDef[] = [
  {
    appId: APP_ID,
    build: (ctx) =>
      tool(
        async ({ account }) =>
          runTool(async () => {
            const { classroom, accountEmail } = await api(ctx.userId, account);
            const r = await classroom.courses.list({
              courseStates: ["ACTIVE"],
              pageSize: 30,
            });
            return {
              account: accountEmail,
              courses: (r.data.courses ?? []).map((c) => ({
                id: c.id,
                name: c.name,
                section: c.section,
                link: c.alternateLink,
              })),
            };
          }),
        {
          name: "google_classroom_list_courses",
          description:
            "List the student's active Google Classroom courses (id, name, section, link).",
          schema: z.object({ accountId: accountField }),
        },
      ),
  },
  {
    appId: APP_ID,
    build: (ctx) =>
      tool(
        async ({ course_id, limit, account }) =>
          runTool(async () => {
            const { classroom, accountEmail } = await api(ctx.userId, account);
            const [work, subs] = await Promise.all([
              classroom.courses.courseWork.list({
                courseId: course_id,
                courseWorkStates: ["PUBLISHED"],
                orderBy: "dueDate desc",
                pageSize: clamp(limit, 15, 30),
              }),
              classroom.courses.courseWork.studentSubmissions
                .list({
                  courseId: course_id,
                  courseWorkId: "-",
                  userId: "me",
                  pageSize: 100,
                })
                .then((r) => r.data.studentSubmissions ?? [])
                .catch(() => []),
            ]);
            const state = new Map(
              subs.map((s) => [
                s.courseWorkId,
                s.late ? `${s.state} (late)` : s.state,
              ]),
            );
            return {
              account: accountEmail,
              courseWork: (work.data.courseWork ?? []).map((w) => ({
                id: w.id,
                title: w.title,
                type: w.workType,
                due: due(w.dueDate, w.dueTime),
                points: w.maxPoints,
                my_submission: state.get(w.id!) ?? null,
                description: clip(w.description),
                materials: attachments(w.materials),
                link: w.alternateLink,
              })),
            };
          }),
        {
          name: "google_classroom_list_coursework",
          description:
            "List assignments/coursework of one course with due dates and the student's submission state (NEW, CREATED, TURNED_IN, RETURNED). Use google_classroom_list_courses first to get course_id.",
          schema: z.object({
            course_id: z.string(),
            limit: z.number().int().optional(),
            account: accountField,
          }),
        },
      ),
  },
  {
    appId: APP_ID,
    build: (ctx) =>
      tool(
        async ({ course_id, limit, account }) =>
          runTool(async () => {
            const { classroom, accountEmail } = await api(ctx.userId, account);
            const r = await classroom.courses.announcements.list({
              courseId: course_id,
              announcementStates: ["PUBLISHED"],
              orderBy: "updateTime desc",
              pageSize: clamp(limit, 10, 20),
            });
            return {
              account: accountEmail,
              announcements: (r.data.announcements ?? []).map((a) => ({
                id: a.id,
                text: clip(a.text, 500),
                updated: a.updateTime,
                materials: attachments(a.materials),
                link: a.alternateLink,
              })),
            };
          }),
        {
          name: "google_classroom_list_announcements",
          description:
            "List the latest announcements of one Google Classroom course.",
          schema: z.object({
            course_id: z.string(),
            limit: z.number().int().optional(),
            account: accountField,
          }),
        },
      ),
  },
  {
    appId: APP_ID,
    build: (ctx) =>
      tool(
        async ({ course_id, limit, account }) =>
          runTool(async () => {
            const { classroom, accountEmail } = await api(ctx.userId, account);
            const r = await classroom.courses.courseWorkMaterials.list({
              courseId: course_id,
              courseWorkMaterialStates: ["PUBLISHED"],
              pageSize: clamp(limit, 15, 30),
            });
            return {
              account: accountEmail,
              materials: (r.data.courseWorkMaterial ?? []).map((m) => ({
                id: m.id,
                title: m.title,
                description: clip(m.description),
                files: attachments(m.materials),
                link: m.alternateLink,
              })),
            };
          }),
        {
          name: "google_classroom_list_materials",
          description:
            "List posted course materials (slides, readings, links, videos) of one Google Classroom course.",
          schema: z.object({
            course_id: z.string(),
            limit: z.number().int().optional(),
            account: accountField,
          }),
        },
      ),
  },
];
