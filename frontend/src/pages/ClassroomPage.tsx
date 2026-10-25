import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuGraduationCap, LuRefreshCw } from "react-icons/lu";
import AnnouncementList from "../components/classroom/AnnouncementList";
import CourseFilter from "../components/classroom/CourseFilter";
import CourseworkList from "../components/classroom/CourseworkList";
import MaterialList from "../components/classroom/MaterialList";
import PageHeader from "../components/common/PageHeader";
import ResourceView from "../components/common/ResourceView";
import Skeleton from "../components/common/Skeleton";
import StateView from "../components/common/StateView";
import Button from "../components/ui/Button";
import Tabs from "../components/ui/Tabs";
import { formatDateTime } from "../lib/dates";
// import { mockClassroom } from "../mocks/classroom";
// import { useMockResource } from "../mocks/useMockResource";
import { useClassroom } from "../hooks/useClassroom";
import { paths } from "../router/paths";
import type { Coursework } from "../types/classroom";

type Tab = "coursework" | "announcements" | "materials";

export default function ClassroomPage() {
  const navigate = useNavigate();
  const { status, data, refetch } = useClassroom();
  const [courseId, setCourseId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("coursework");

  const askLumi = (prompt: string) =>
    navigate(paths.chat, { state: { prompt } });
  const courseName = (id: string) =>
    data.courses.find((c) => c.id === id)?.name ?? "Course";
  const inCourse = <T extends { courseId: string }>(items: T[]) =>
    courseId ? items.filter((i) => i.courseId === courseId) : items;

  const coursework = inCourse(data.coursework);
  const announcements = inCourse(data.announcements);
  const materials = inCourse(data.materials);

  const plan = (w: Coursework) => {
    if (!w.due) return;
    askLumi(
      `Add "${w.title}" for ${courseName(w.courseId)} (due ${formatDateTime(w.due)}) to my Google Calendar and make a short study plan for it.`,
    );
  };

  return (
    <>
      <PageHeader
        title="Classroom"
        description={
          status === "ready"
            ? `Showing ${data.accountEmail}`
            : "Courses, deadlines and announcements"
        }
        actions={
          <>
            <Button size="sm" onClick={refetch} disabled={status === "loading"}>
              <LuRefreshCw className="size-3.5" />
              Refresh
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() =>
                askLumi(
                  "Make a weekly study schedule for me based on my Google Classroom deadlines and my calendar.",
                )
              }
            >
              Make study plan
            </Button>
          </>
        }
      />

      <ResourceView
        status={status}
        onRetry={refetch}
        skeleton={
          <div className="space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28 rounded-full" />
              <Skeleton className="h-9 w-32 rounded-full" />
              <Skeleton className="h-9 w-32 rounded-full" />
            </div>
            <Skeleton className="h-10 w-full" />
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        }
        empty={
          <StateView
            icon={LuGraduationCap}
            title="No active courses"
            description="Your Google Classroom account has no active courses right now."
          />
        }
        disconnected={
          <StateView
            icon={LuGraduationCap}
            title="Google Classroom is not connected"
            description="Connect your school account to see courses, deadlines and announcements here."
            action={
              <Button
                variant="primary"
                onClick={() =>
                  navigate(paths.chat, { state: { openSettings: true } })
                }
              >
                Connect in Settings
              </Button>
            }
          />
        }
      >
        <div className="space-y-5">
          <CourseFilter
            courses={data.courses}
            selectedId={courseId}
            onSelect={setCourseId}
          />
          <Tabs<Tab>
            label="Classroom sections"
            value={tab}
            onChange={setTab}
            tabs={[
              {
                value: "coursework",
                label: "Coursework",
                count: coursework.length,
              },
              {
                value: "announcements",
                label: "Announcements",
                count: announcements.length,
              },
              {
                value: "materials",
                label: "Materials",
                count: materials.length,
              },
            ]}
          />
          <div role="tabpanel">
            {tab === "coursework" && (
              <CourseworkList
                items={coursework}
                courseName={courseName}
                onPlan={plan}
              />
            )}
            {tab === "announcements" && (
              <AnnouncementList items={announcements} courseName={courseName} />
            )}
            {tab === "materials" && (
              <MaterialList items={materials} courseName={courseName} />
            )}
          </div>
        </div>
      </ResourceView>
    </>
  );
}
