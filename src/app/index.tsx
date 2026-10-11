import { Text, View } from "react-native";
import { defaultLanguage, i18n } from "../i18n";

export default function Index() {
  return (
    <View
      style={{ direction: defaultLanguage === "ar" ? "rtl" : "ltr" }}
      className="flex-1 items-center justify-center bg-background"
    >
      <Text className="text-4xl text-foreground">{i18n.t("welcome")}</Text>
    </View>
  );
}
