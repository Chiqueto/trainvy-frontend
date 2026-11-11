import type { Metadata, Viewport } from "next";
import { TrainingHome } from "./_components/training-home";

export const metadata: Metadata = {
  title: "Trainvy — Seu treino. Sua evolução.",
  description:
    "Transforme esforço em evolução. Organize seus treinos, registre cada série e explore movimentos em 3D com o Trainvy. Comece com uma conta de atleta gratuita.",
  openGraph: {
    title: "Trainvy — Seu próximo nível começa aqui",
    description:
      "Treinos, evolução e anatomia em movimento. Descubra o Trainvy.",
    locale: "pt_BR",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default async function Home() {
  return TrainingHome();
}
