"use server";

import { loginWithCredentials } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginAction(formData) {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  try {
    const user = await loginWithCredentials({ email, password });

    if (user.role === "admin") {
      redirect("/admin/dashboard");
    }
    if (user.role === "staff") {
      redirect("/staff/dashboard");
    }
    if (user.role === "patient") {
      redirect("/patient/dashboard");
    }

    redirect("/");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed.";
    redirect(`/login?error=${encodeURIComponent(message)}`);
  }
}

