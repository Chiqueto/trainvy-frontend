import { Loader2 } from "lucide-react";
import styles from "./_components/auth.module.css";

export default function AuthLoading() {
  return (
    <div role="status" className={styles.completionState}>
      <div className={styles.loadingOrbit} aria-hidden="true">
        <Loader2 size={25} className={styles.spin} />
      </div>
      <p className={styles.statusDescription}>Preparando seu acesso…</p>
    </div>
  );
}
