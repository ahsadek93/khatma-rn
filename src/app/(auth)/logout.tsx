import { AuthScreen } from "@/components/AuthScreen";
import { i18n } from "@/i18n";

export default function Logout() {
  return <AuthScreen title={i18n.t("logout")} />;
}
