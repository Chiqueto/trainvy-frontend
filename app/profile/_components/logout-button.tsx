"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { authClient } from "@/app/_lib/auth-client";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      const { error } = await authClient.signOut();

      if (error) {
        console.error(error.message);
        setIsLoggingOut(false);
        return;
      }

      router.push("/auth");
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="gap-2 text-destructive hover:text-destructive"
    >
      <span className="font-heading text-base font-semibold">
        {isLoggingOut ? "Saindo da conta..." : "Sair da conta"}
      </span>
      {isLoggingOut ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <LogOut className="size-4" />
      )}
    </Button>
  );
}
