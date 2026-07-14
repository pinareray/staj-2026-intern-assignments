import React from "react";

type AuthCardProps = {
  children: React.ReactNode;
};

export default function AuthCard({ children }: AuthCardProps) {
  return (
    <div className="w-full max-w-[420px] rounded-2xl bg-white border border-stone-200 shadow-[0_20px_50px_rgba(37,9,2,0.08)] p-10">
      {children}
    </div>
  );
}
