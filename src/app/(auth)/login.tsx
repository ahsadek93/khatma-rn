import { AuthScreen } from "@/components/AuthScreen";
import { i18n } from "@/i18n";

export default function Login() {
  return <AuthScreen title={i18n.t("login")} />;
}
