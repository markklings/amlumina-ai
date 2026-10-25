import { useNavigate } from "react-router-dom";
import { LuInfo, LuCircleCheck } from "react-icons/lu";
import PageHeader from "../components/common/PageHeader";
import DeleteAccountDialog from "../components/profile/DeleteAccountDialog";
import PasswordForm from "../components/profile/PasswordForm";
import ProfileNameForm from "../components/profile/ProfileNameForm";
import ProfileSection from "../components/profile/ProfileSection";
import Button from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import { useDisclosure } from "../hooks/useDisclosure";
import { paths } from "../router/paths";

export default function ProfilePage() {
  const { user, updateProfile, changePassword, deleteAccount } = useAuth();
  const deleteDialog = useDisclosure();

  const navigate = useNavigate();

  if (!user) return null; // only while logging out; the guard is redirecting

  return (
    <>
      <PageHeader
        title="Profile and security"
        description="Manage your details, password and account."
      />

      <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
        <ProfileSection
          title="Profile"
          description="Your name is shown in the sidebar and in greetings."
        >
          <ProfileNameForm
            fullName={user.fullName}
            email={user.email}
            onSave={updateProfile}
          />
        </ProfileSection>

        <ProfileSection
          title="Email"
          description="Verify your address to secure your account and receive alerts."
        >
          {user.emailVerified ? (
            <p className="flex items-center gap-2 text-sm">
              <LuCircleCheck className="size-4" />
              {user.email} is verified
            </p>
          ) : (
            <Button onClick={() => navigate(paths.verifyEmail)}>
              Verify email
            </Button>
          )}
        </ProfileSection>

        <ProfileSection
          title="Password"
          description="Use a strong password you do not use anywhere else."
        >
          {user.authProvider === "google" ? (
            <p className="flex items-start gap-2 rounded-xl border border-zinc-200 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
              <LuInfo className="mt-0.5 size-4 shrink-0" />
              You sign in with Google, so there is no password to change.
            </p>
          ) : (
            <PasswordForm onSave={changePassword} />
          )}
        </ProfileSection>

        <ProfileSection
          title="Delete account"
          description="Permanently remove your account and all of its data."
        >
          <Button onClick={deleteDialog.show}>Delete account</Button>
        </ProfileSection>
      </div>

      <DeleteAccountDialog
        open={deleteDialog.open}
        onClose={deleteDialog.hide}
        onConfirm={deleteAccount}
      />
    </>
  );
}
