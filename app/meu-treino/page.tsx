import type { Metadata, Viewport } from "next";
import { TrainingHome } from "@/app/_components/training-home";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Meu treino | Trainvy" };
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default async function MyWorkoutPage() {
  return TrainingHome({ preferCoachWorkspace: false });
}
