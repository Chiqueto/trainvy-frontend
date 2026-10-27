"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  ChartNoAxesCombined,
  Dumbbell,
  Rotate3D,
} from "lucide-react";
import { Logo } from "@/app/_components/logo";
import styles from "./auth.module.css";

export function AuthShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const signup = pathname === "/auth/signup";
  const completing = pathname === "/auth/complete";
  const welcome = pathname === "/auth/welcome";

  return (
    <div className={styles.authRoot}>
      <a href="#auth-content" className={styles.skipLink}>
        Pular para o acesso
      </a>
      <header className={styles.header}>
        <Link href="/" aria-label="Trainvy — página inicial">
          <Logo light size="lg" />
        </Link>
        <Link href="/" className={styles.backToSite}>
          Voltar ao site <ArrowUpRight size={15} />
        </Link>
      </header>
      <div className={styles.layout}>
        <aside className={styles.visual} aria-label="Seu treino. Sua evolução.">
          <Image
            src="/home-banner.jpg"
            alt=""
            fill
            priority
            sizes="(max-width: 850px) 0px, 48vw"
            className={styles.visualImage}
          />
          <div className={styles.visualShade} />
          <div className={styles.visualGrid} aria-hidden="true" />
          <div className={styles.visualOrbit} aria-hidden="true">
            <i />
            <i />
            <span />
          </div>
          <div className={styles.visualTop}>
            <span className={styles.liveDot} /> O PRÓXIMO NÍVEL É SEU.
          </div>
          <div className={styles.visualCopy} key={signup ? "signup" : "signin"}>
            <span className={styles.overline}>SEU TREINO. SUA EVOLUÇÃO.</span>
            <p>
              {signup ? (
                <>
                  Todo começo.
                  <br />
                  Uma nova
                  <br />
                  <span>versão de você.</span>
                </>
              ) : (
                <>
                  Mais forte
                  <br />
                  que o seu
                  <br />
                  <span>ontem.</span>
                </>
              )}
            </p>
            <span className={styles.visualDescription}>
              {signup
                ? "Você traz a vontade. A gente ajuda a dar direção."
                : "Seu próximo treino é mais um passo à frente."}
            </span>
          </div>
          <div className={styles.visualBottom}>
            <span>
              <Dumbbell size={15} /> Treine
            </span>
            <span>
              <ChartNoAxesCombined size={15} /> Evolua
            </span>
            <span>
              <Rotate3D size={15} /> Entenda
            </span>
            <ArrowUpRight size={22} />
          </div>
        </aside>
        <div className={styles.workspace}>
          <div className={styles.formContainer} id="auth-content">
            <div className={styles.sectionMarker}>
              <span>
                {signup
                  ? "01 / SEU PRIMEIRO PASSO"
                  : completing
                    ? "02 / QUASE LÁ"
                    : welcome
                      ? "03 / TUDO PRONTO"
                      : "BEM-VINDO AO SEU PRÓXIMO NÍVEL"}
              </span>
              <span className={styles.markerLine} />
            </div>
            {children}
          </div>
          <footer className={styles.footer}>
            <span>© {new Date().getFullYear()} Trainvy</span>
            <nav aria-label="Informações legais">
              <Link href="/termos">Termos de uso</Link>
              <Link href="/privacidade">Privacidade</Link>
            </nav>
          </footer>
        </div>
      </div>
    </div>
  );
}
