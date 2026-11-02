import LegalPageView from "../../legal/LegalPageView";
import { PRIVACY_POLICY } from "../../legal/legalContent";

// Text lives in src/legal/legalContent.js.
export default function PrivacyPolicy() {
    return <LegalPageView page={PRIVACY_POLICY} />;
}
