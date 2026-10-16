"use client";

import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: "#151d2a",
            border: "1px solid #2b3a50",
            color: "#e9eef7",
            fontSize: "13px",
          },
        }}
      />
    </>
  );
}
