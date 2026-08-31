"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyPageLink({ label = "复制链接" }: { label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  return <button className="button quiet" type="button" onClick={copy}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "已复制" : label}</button>;
}
