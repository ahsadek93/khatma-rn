import { Text as NativeText, type TextProps } from "react-native";

type AppTextProps = TextProps & { className?: string };

export function AppText({ className = "", ...props }: AppTextProps) {
  return <NativeText className={`font-cairo ${className}`} {...props} />;
}
