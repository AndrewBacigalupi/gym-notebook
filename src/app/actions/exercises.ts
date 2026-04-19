"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createExercise(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const name = String(formData.get("name") ?? "").trim();
  const notesRaw = formData.get("notes");
  const notes =
    typeof notesRaw === "string" && notesRaw.trim() ? notesRaw.trim() : null;

  if (!name) throw new Error("Name is required");

  const { error } = await supabase.from("exercises").insert({
    user_id: user.id,
    name,
    notes,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/exercises/new");
  revalidatePath("/workouts/new");
  revalidatePath("/progress");
  redirect("/dashboard");
}
