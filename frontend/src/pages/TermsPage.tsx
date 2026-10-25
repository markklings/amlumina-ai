import LegalDocument from "../components/legal/LegalDocument";
import { termsDoc } from "../constants/legal";
import LegalLayout from "../layouts/LegalLayout";

export default function TermsPage() {
  return (
    <LegalLayout>
      <LegalDocument doc={termsDoc} />
    </LegalLayout>
  );
}
