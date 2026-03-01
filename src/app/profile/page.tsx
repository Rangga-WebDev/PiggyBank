/** @format */
"use client";

import { useAppPreferences } from "@/lib/app-preferences";

export default function ProfilePage() {
  const { language } = useAppPreferences();

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold">
        {language === "id" ? "Profil" : "Profile"}
      </h1>
      <p className="text-sm text-muted-foreground">
        {language === "id"
          ? "Halaman demo (auth akan ditambahkan nanti)."
          : "Demo page (auth will be added later)."}
      </p>
    </div>
  );
}
