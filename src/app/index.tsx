import { View } from "react-native";
import { AppText } from "../components/AppText";
import { i18n } from "../i18n";

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <AppText className="text-4xl text-foreground">
        {i18n.t("welcome")}
      </AppText>
    </View>
  );
}
