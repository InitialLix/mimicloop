"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function HistoryBackButton({ fallbackHref = "/library/essays" }: { fallbackHref?: string }) {
  const router = useRouter();

  function goBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return <button className="back-link back-link-button" type="button" onClick={goBack}><ArrowLeft size={16} /> 回到上一页</button>;
}
