import LegalDocument from "../components/legal/LegalDocument";
import { privacyDoc } from "../constants/legal";
import LegalLayout from "../layouts/LegalLayout";

export default function PrivacyPage() {
  return (
    <LegalLayout>
      <LegalDocument doc={privacyDoc} />
    </LegalLayout>
  );
}
