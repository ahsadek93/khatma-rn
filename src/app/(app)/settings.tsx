import { AppTabScreen } from "@/components/AppTabScreen";
import { i18n } from "@/i18n";

export default function Settings() {
  return <AppTabScreen active="settings" title={i18n.t("tabSettings")} />;
}
