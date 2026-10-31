import { google, type classroom_v1 } from "googleapis";
import { getGoogleAuth } from "./google-auth.service.js";

const APP_ID = 1;
const MAX_COURSES = 10;

const toIso = (
  d?: {
    year?: number | null;
    month?: number | null;
    day?: number | null;
  } | null,
  t?: { hours?: number | null; minutes?: number | null } | null,
) => {
  if (!d?.year || !d.month || !d.day) return null;
  return new Date(
    Date.UTC(
      d.year,
      d.month - 1,
      d.day,
      t ? (t.hours ?? 0) : 23,
      t ? (t.minutes ?? 0) : 59,
    ),
  ).toISOString();
};

function files(list?: classroom_v1.Schema$Material[] | null) {
  const out: {
    type: "drive" | "link" | "video" | "form";
    title: string;
    url: string;
  }[] = [];
  for (const m of list ?? []) {
    if (m.driveFile?.driveFile?.alternateLink)
      out.push({
        type: "drive",
        title: m.driveFile.driveFile.title ?? "File",
        url: m.driveFile.driveFile.alternateLink,
      });
    else if (m.link?.url)
      out.push({
        type: "link",
        title: m.link.title ?? m.link.url,
        url: m.link.url,
      });
    else if (m.youtubeVideo?.alternateLink)
      out.push({
        type: "video",
        title: m.youtubeVideo.title ?? "Video",
        url: m.youtubeVideo.alternateLink,
      });
    else if (m.form?.formUrl)
      out.push({
        type: "form",
        title: m.form.title ?? "Form",
        url: m.form.formUrl,
      });
  }
  return out;
}

export async function fetchClassroomOverview(userId: string, account?: string) {
  const { auth, accountEmail } = await getGoogleAuth(userId, APP_ID, account);
  const classroom = google.classroom({ version: "v1", auth });

  const list = await classroom.courses.list({
    courseStates: ["ACTIVE"],
    pageSize: 30,
  });
  const courses = (list.data.courses ?? [])
    .filter((c) => c.id)
    .slice(0, MAX_COURSES);

  const perCourse = await Promise.all(
    courses.map(async (c) => {
      const courseId = c.id!;
      const [work, subs, ann, mat] = await Promise.all([
        classroom.courses.courseWork.list({
          courseId,
          courseWorkStates: ["PUBLISHED"],
          orderBy: "dueDate desc",
          pageSize: 30,
        }),
        // teachers cannot list their own submissions, so a failure here just means "no state"
        classroom.courses.courseWork.studentSubmissions
          .list({ courseId, courseWorkId: "-", userId: "me", pageSize: 100 })
          .then((r) => r.data.studentSubmissions ?? [])
          .catch(() => []),
        classroom.courses.announcements.list({
          courseId,
          announcementStates: ["PUBLISHED"],
          orderBy: "updateTime desc",
          pageSize: 10,
        }),
        classroom.courses.courseWorkMaterials.list({
          courseId,
          courseWorkMaterialStates: ["PUBLISHED"],
          pageSize: 20,
        }),
      ]);

      const state = new Map(subs.map((s) => [s.courseWorkId, s]));
      return {
        coursework: (work.data.courseWork ?? []).map((w) => {
          const sub = state.get(w.id);
          return {
            id: w.id!,
            courseId,
            title: w.title ?? "Untitled",
            due: toIso(w.dueDate, w.dueTime),
            points: w.maxPoints ?? null,
            submission: (sub?.state as string | undefined) ?? null,
            late: !!sub?.late,
            link: w.alternateLink ?? "",
          };
        }),
        announcements: (ann.data.announcements ?? []).map((a) => ({
          id: a.id!,
          courseId,
          text: a.text ?? "",
          updatedAt: a.updateTime ?? "",
          link: a.alternateLink ?? "",
        })),
        materials: (mat.data.courseWorkMaterial ?? []).map((m) => ({
          id: m.id!,
          courseId,
          title: m.title ?? "Untitled",
          description: m.description ?? "",
          files: files(m.materials),
          link: m.alternateLink ?? "",
        })),
      };
    }),
  );

  return {
    accountEmail,
    courses: courses.map((c) => ({
      id: c.id!,
      name: c.name ?? "Untitled course",
      section: c.section ?? null,
      link: c.alternateLink ?? "",
    })),
    coursework: perCourse.flatMap((p) => p.coursework),
    announcements: perCourse.flatMap((p) => p.announcements),
    materials: perCourse.flatMap((p) => p.materials),
  };
}
