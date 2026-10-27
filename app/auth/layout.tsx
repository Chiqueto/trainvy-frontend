import type { Metadata, Viewport } from "next";
import { AuthShell } from "./_components/auth-shell";

export const metadata: Metadata = {
  title: "Sua conta | Trainvy",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthShell>{children}</AuthShell>;
}
