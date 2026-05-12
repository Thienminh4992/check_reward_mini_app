"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const login = async () => {
      const tg = window.Telegram?.WebApp;
      const initData = tg?.initData || null;

      const res = await fetch("/api/auth", {
        method: "POST",
        body: JSON.stringify({ initData }),
      });

      const data = await res.json();

      if (data.needs_register) {
        router.replace(`/register?telegram_id=${data.telegram.id}`);
      } else {
        router.replace("/home");
      }
    };

    login();
  }, [router]);

  // return <div>Loading...</div>;
}