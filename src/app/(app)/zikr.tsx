import { AppTabScreen } from "@/components/AppTabScreen";
import { i18n } from "@/i18n";

export default function Zikr() {
  return <AppTabScreen active="zikr" title={i18n.t("tabZikr")} />;
}
