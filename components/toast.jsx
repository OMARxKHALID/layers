import React from "react";
import { CheckCircle, AlertCircle, Info } from "lucide-react";

export const ToastContainer = ({ toasts }) => {
  if (toasts.length === 0) return null;

  const uniqueToasts = toasts.filter(
    (toast, index, self) =>
      index === self.findIndex((t) => t.message === toast.message),
  );

  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[1000] flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4 items-center">
      {uniqueToasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto
            flex items-center gap-3 px-6 py-3 rounded-full border backdrop-blur-3xl shadow-[0_12px_48px_rgba(0,0,0,0.12)] noise
            animate-fade-in transition-all duration-500
            ${
              toast.type === "success"
                ? "bg-white/95 border-green-200/40 text-gray-900"
                : ""
            }
            ${
              toast.type === "error"
                ? "bg-white/95 border-red-200/40 text-red-600"
                : ""
            }
            ${
              toast.type === "info"
                ? "bg-white/95 border-white/40 text-gray-900"
                : ""
            }
          `}
        >
          {toast.type === "success" && (
            <CheckCircle
              size={16}
              strokeWidth={3}
              className="text-green-500 flex-shrink-0"
            />
          )}
          {toast.type === "error" && (
            <AlertCircle
              size={16}
              strokeWidth={3}
              className="text-red-500 flex-shrink-0"
            />
          )}
          {toast.type === "info" && (
            <Info
              size={16}
              strokeWidth={3}
              className="text-blue-500 flex-shrink-0"
            />
          )}
          <span className="text-[12px] font-bold tracking-tight whitespace-nowrap">
            {toast.message}
          </span>
        </div>
      ))}
    </div>
  );
};
