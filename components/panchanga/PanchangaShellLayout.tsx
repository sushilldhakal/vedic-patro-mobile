import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

/** @deprecated Use `(tabs)/_layout` → `PanchangaTabsShell` for shell routes. */
export function PanchangaShellLayout({ children }: Props) {
  return <>{children}</>;
}
