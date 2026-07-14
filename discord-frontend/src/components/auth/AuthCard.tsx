import React from "react";

type AuthCardProps = {
  children: React.ReactNode;
};

export default function AuthCard({ children }: AuthCardProps) {
  return (
    <div className="w-full max-w-[420px] rounded-2xl bg-mahogany-red border border-outline-variant/20 shadow-2xl p-10 inner-depth">
      {children}
    </div>
  );
}
