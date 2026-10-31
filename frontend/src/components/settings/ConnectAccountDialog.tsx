import { useEffect, useState } from "react";
import { LuGraduationCap } from "react-icons/lu";
import { CLASSROOM_APP_ID } from "../../constants/connectedApps";
import FormError from "../auth/FormError";
import Button from "../ui/Button";
import Dialog from "../ui/Dialog";

interface Props {
  open: boolean;
  onClose: () => void; // must be stable (useDisclosure's hide)
  onContinue: (apps: number[]) => Promise<void>;
}

export default function ConnectAccountDialog({
  open,
  onClose,
  onContinue,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setLoading(false);
      setError(null);
    }
  }, [open]);

  const go = async () => {
    setLoading(true);
    setError(null);
    try {
      await onContinue([CLASSROOM_APP_ID]); // navigates to Google
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not start Google. Try again.",
      );
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Connect Google Classroom"
      description="Sign in with your school Google account. Lumi only reads your courses, coursework, announcements and materials. Keep every box ticked on Google's screen."
      footer={
        <>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" loading={loading} onClick={go}>
            Continue with Google
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {error && <FormError message={error} />}
        <p className="flex items-center gap-3 rounded-xl border border-zinc-200 p-3 text-sm dark:border-zinc-800">
          <LuGraduationCap className="size-5 shrink-0" />
          Google Classroom (read only)
        </p>
      </div>
    </Dialog>
  );
}

// import { useEffect, useState } from "react";
// import { connectableApps } from "../../constants/connectedApps";
// import AppToggleRow from "../auth/AppToggleRow";
// import FormError from "../auth/FormError";
// import Button from "../ui/Button";
// import Dialog from "../ui/Dialog";
//
// interface Props {
//   open: boolean;
//   onClose: () => void; // must be stable (useDisclosure's hide)
//   onContinue: (apps: number[]) => Promise<void>;
// }
//
// export default function ConnectAccountDialog({
//   open,
//   onClose,
//   onContinue,
// }: Props) {
//   const [selected, setSelected] = useState<number[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//
//   useEffect(() => {
//     if (!open) {
//       setSelected([]);
//       setError(null);
//       setLoading(false);
//     }
//   }, [open]);
//
//   const toggle = (id: number) =>
//     setSelected((s) =>
//       s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
//     );
//
//   const go = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       await onContinue(selected); // navigates to Google, so the loading state is left on
//     } catch (e) {
//       setError(
//         e instanceof Error ? e.message : "Could not start Google. Try again.",
//       );
//       setLoading(false);
//     }
//   };
//
//   return (
//     <Dialog
//       open={open}
//       onClose={onClose}
//       title="Connect a Google account"
//       description="Choose what Lumi can use. You can sign in with a personal or a school account."
//       footer={
//         <>
//           <Button onClick={onClose} disabled={loading}>
//             Cancel
//           </Button>
//           <Button
//             variant="primary"
//             loading={loading}
//             disabled={!selected.length}
//             onClick={go}
//           >
//             Continue with Google
//           </Button>
//         </>
//       }
//     >
//       <div className="max-h-[50vh] space-y-2 overflow-y-auto">
//         {error && <FormError message={error} />}
//         {connectableApps.map((app, i) => (
//           <AppToggleRow
//             key={app.id}
//             app={app}
//             index={i}
//             on={selected.includes(app.id)}
//             onToggle={() => toggle(app.id)}
//           />
//         ))}
//       </div>
//     </Dialog>
//   );
// }
