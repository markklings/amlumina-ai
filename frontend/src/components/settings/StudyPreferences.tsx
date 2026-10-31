import { useEffect, useState } from "react";
import { accountApi } from "../../api/account.api";
import FormError from "../auth/FormError";
import InlineStatus from "../common/InlineStatus";
import Button from "../ui/Button";
import ToggleTrack from "../ui/ToggleTrack";

const field =
  "h-10 w-full rounded-lg border border-zinc-200 bg-transparent px-3 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600";

export default function StudyPreferences() {
  const [loaded, setLoaded] = useState(false);
  const [level, setLevel] = useState("");
  const [subjects, setSubjects] = useState("");
  const [goals, setGoals] = useState("");
  const [digest, setDigest] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    accountApi
      .preferences()
      .then((p) => {
        if (!active) return;
        setLevel(p.study_profile.level ?? "");
        setSubjects((p.study_profile.subjects ?? []).join(", "));
        setGoals(p.study_profile.goals ?? "");
        setDigest(p.email_digest);
        setLoaded(true);
      })
      .catch(() => active && setError("Could not load your preferences."));
    return () => {
      active = false;
    };
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await accountApi.saveStudyProfile({
        level: level.trim(),
        subjects: subjects
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 10),
        goals: goals.trim(),
      });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleDigest = async () => {
    const next = !digest;
    setDigest(next);
    try {
      await accountApi.setDigest(next);
    } catch {
      setDigest(!next);
      setError("Could not update the email setting.");
    }
  };

  if (!loaded)
    return error ? (
      <FormError message={error} />
    ) : (
      <p className="text-sm text-zinc-500">Loading…</p>
    );

  return (
    <div className="space-y-3">
      {error && <FormError message={error} />}
      <input
        aria-label="Level"
        className={field}
        placeholder="Level (for example Grade 10, or College year 2)"
        maxLength={100}
        value={level}
        onChange={(e) => setLevel(e.target.value)}
      />
      <input
        aria-label="Subjects"
        className={field}
        placeholder="Subjects, separated by commas"
        value={subjects}
        onChange={(e) => setSubjects(e.target.value)}
      />
      <textarea
        aria-label="Goals"
        rows={2}
        maxLength={500}
        placeholder="Goals (for example pass the board exam)"
        value={goals}
        onChange={(e) => setGoals(e.target.value)}
        className="w-full resize-none rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600"
      />
      <div className="flex items-center gap-3">
        <Button size="sm" variant="primary" loading={saving} onClick={save}>
          Save profile
        </Button>
        {saved && <InlineStatus>Saved</InlineStatus>}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={digest}
        onClick={() => void toggleDigest()}
        className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 p-3 text-left dark:border-zinc-800"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">Daily study email</span>
          <span className="block text-xs text-zinc-500">
            Tasks due and flashcards to review. Needs a verified email.
          </span>
        </span>
        <ToggleTrack on={digest} />
      </button>
    </div>
  );
}

// import { useEffect, useState } from "react";
// import { accountApi } from "../../api/account.api";
// import FormError from "../auth/FormError";
// import InlineStatus from "../common/InlineStatus";
// import Button from "../ui/Button";
// import ToggleTrack from "../ui/ToggleTrack";
//
// const field =
//   "h-10 w-full rounded-lg border border-zinc-200 bg-transparent px-3 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600";
//
// export default function StudyPreferences() {
//   const [loaded, setLoaded] = useState(false);
//   const [level, setLevel] = useState("");
//   const [subjects, setSubjects] = useState("");
//   const [goals, setGoals] = useState("");
//   const [language, setLanguage] = useState("");
//   const [digest, setDigest] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [saved, setSaved] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//
//   useEffect(() => {
//     let active = true;
//     accountApi
//       .preferences()
//       .then((p) => {
//         if (!active) return;
//         setLevel(p.study_profile.level ?? "");
//         setSubjects((p.study_profile.subjects ?? []).join(", "));
//         setGoals(p.study_profile.goals ?? "");
//         setLanguage(p.study_profile.language ?? "");
//         setDigest(p.email_digest);
//         setLoaded(true);
//       })
//       .catch(() => active && setError("Could not load your preferences."));
//     return () => {
//       active = false;
//     };
//   }, []);
//
//   const save = async () => {
//     setSaving(true);
//     setSaved(false);
//     setError(null);
//     try {
//       await accountApi.saveStudyProfile({
//         level: level.trim(),
//         subjects: subjects
//           .split(",")
//           .map((s) => s.trim())
//           .filter(Boolean)
//           .slice(0, 10),
//         goals: goals.trim(),
//       });
//       setSaved(true);
//     } catch (e) {
//       setError(e instanceof Error ? e.message : "Could not save. Try again.");
//     } finally {
//       setSaving(false);
//     }
//   };
//
//   const toggleDigest = async () => {
//     const next = !digest;
//     setDigest(next);
//     try {
//       await accountApi.setDigest(next);
//     } catch {
//       setDigest(!next);
//       setError("Could not update the email setting.");
//     }
//   };
//
//   if (!loaded)
//     return error ? (
//       <FormError message={error} />
//     ) : (
//       <p className="text-sm text-zinc-500">Loading…</p>
//     );
//
//   return (
//     <div className="space-y-3">
//       {error && <FormError message={error} />}
//       <input
//         aria-label="Level"
//         className={field}
//         placeholder="Level (for example Grade 10, or College year 2)"
//         maxLength={100}
//         value={level}
//         onChange={(e) => setLevel(e.target.value)}
//       />
//       <input
//         aria-label="Subjects"
//         className={field}
//         placeholder="Subjects, separated by commas"
//         value={subjects}
//         onChange={(e) => setSubjects(e.target.value)}
//       />
//       <textarea
//         aria-label="Goals"
//         rows={2}
//         maxLength={500}
//         placeholder="Goals (for example pass the board exam)"
//         value={goals}
//         onChange={(e) => setGoals(e.target.value)}
//         className="w-full resize-none rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600"
//       />
//       {/*<input
//         aria-label="Preferred language"
//         className={field}
//         placeholder="Preferred language (optional)"
//         maxLength={40}
//         value={language}
//         onChange={(e) => setLanguage(e.target.value)}
//       />*/}
//       <div className="flex items-center gap-3">
//         <Button size="sm" variant="primary" loading={saving} onClick={save}>
//           Save profile
//         </Button>
//         {saved && <InlineStatus>Saved</InlineStatus>}
//       </div>
//
//       <button
//         type="button"
//         role="switch"
//         aria-checked={digest}
//         onClick={() => void toggleDigest()}
//         className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 p-3 text-left dark:border-zinc-800"
//       >
//         <span className="min-w-0 flex-1">
//           <span className="block text-sm font-medium">Daily study email</span>
//           <span className="block text-xs text-zinc-500">
//             Tasks due and flashcards to review. Needs a verified email.
//           </span>
//         </span>
//         <ToggleTrack on={digest} />
//       </button>
//     </div>
//   );
// }
