import { useState, type ChangeEvent, type FormEvent } from "react";
import { validators } from "../../../lib/validators";
import { paths } from "../../../router/paths";
import CheckboxField from "../CheckboxField";
import Divider from "../Divider";
import GoogleButton from "../GoogleButton";
import LegalLink from "../LegalLink";
import PasswordField from "../PasswordField";
import StepActions from "../StepActions";
import StepShell from "../StepShell";
import TextField from "../TextField";

export interface AccountValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreed: boolean; // Terms of Use + Privacy & Data
}

type Errors = Partial<Record<keyof AccountValues, string>>;

const CONSENT_ERROR =
  "Agree to the Terms of Use and Privacy & Data to continue";

interface Props {
  values: AccountValues;
  emailError?: string | null;
  onChange: (patch: Partial<AccountValues>) => void;
  onNext: () => void;
  onGoogle: () => void | Promise<void>;
}

export default function AccountStep({
  values,
  emailError,
  onChange,
  onNext,
  onGoogle,
}: Props) {
  const [errors, setErrors] = useState<Errors>({});

  const change =
    (field: "fullName" | "email" | "password" | "confirmPassword") =>
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange({ [field]: e.target.value } as Partial<AccountValues>);
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const handleGoogle = async () => {
    if (!values.agreed) {
      setErrors((prev) => ({ ...prev, agreed: CONSENT_ERROR }));
      return;
    }
    await onGoogle();
  };

  // const handleGoogle = () => {
  //   if (!values.agreed) {
  //     setErrors((prev) => ({ ...prev, agreed: CONSENT_ERROR }));
  //     return;
  //   }
  //   onGoogle();
  // };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found: Errors = {
      fullName: validators.fullName(values.fullName) ?? undefined,
      email: validators.email(values.email) ?? undefined,
      password: validators.password(values.password) ?? undefined,
      confirmPassword:
        validators.confirmPassword(values.confirmPassword, values.password) ??
        undefined,
      agreed: values.agreed ? undefined : CONSENT_ERROR,
    };
    setErrors(found);
    if (!Object.values(found).some(Boolean)) onNext();
  };

  return (
    <form onSubmit={submit} noValidate>
      <StepShell
        title="Create your account"
        description="Start studying with Lumi in a minute."
        footer={<StepActions nextLabel="Continue" />}
      >
        <div className="space-y-3">
          <GoogleButton onClick={handleGoogle} label="Sign up with Google" />
          <Divider label="or use your email" />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Full name"
              autoComplete="name"
              value={values.fullName}
              onChange={change("fullName")}
              error={errors.fullName}
            />
            <TextField
              label="Email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={values.email}
              onChange={change("email")}
              error={errors.email ?? emailError}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <PasswordField
              label="Password"
              autoComplete="new-password"
              placeholder="8+ characters"
              value={values.password}
              onChange={change("password")}
              error={errors.password}
            />
            <PasswordField
              label="Confirm password"
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={change("confirmPassword")}
              error={errors.confirmPassword}
            />
          </div>
          <CheckboxField
            checked={values.agreed}
            onChange={(agreed) => {
              onChange({ agreed });
              setErrors((prev) => ({ ...prev, agreed: undefined }));
            }}
            error={errors.agreed}
          >
            I agree to the <LegalLink to={paths.terms}>Terms of Use</LegalLink>{" "}
            and <LegalLink to={paths.privacy}>Privacy &amp; Data</LegalLink>.
          </CheckboxField>
        </div>
      </StepShell>
    </form>
  );
}
