import { AppTabScreen } from "@/components/AppTabScreen";
import { i18n } from "@/i18n";

export default function Quran() {
  return <AppTabScreen active="quran" title={i18n.t("tabQuran")} />;
}
