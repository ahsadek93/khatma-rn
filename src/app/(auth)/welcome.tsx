import { AuthScreen } from "@/components/AuthScreen";
import { i18n } from "@/i18n";

export default function Welcome() {
  return <AuthScreen title={i18n.t("welcome")} />;
}
