import { Redirect } from "expo-router";

/** Legacy path `/history` → learn history. */
export default function HistoryAlias() {
  return <Redirect href="/learn/history" />;
}
