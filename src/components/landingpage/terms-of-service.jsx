import LegalPageView from "../../legal/LegalPageView";
import { TERMS_OF_SERVICE } from "../../legal/legalContent";

// Text lives in src/legal/legalContent.js.
export default function TermsOfService() {
    return <LegalPageView page={TERMS_OF_SERVICE} />;
}
