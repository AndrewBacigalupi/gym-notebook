"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createWorkout(input: {
  name: string;
  exerciseIdsInOrder: string[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const name = input.name.trim();
  if (!name) throw new Error("Name is required");
  if (input.exerciseIdsInOrder.length === 0) {
    throw new Error("Add at least one exercise");
  }

  const { data: workout, error: wErr } = await supabase
    .from("workouts")
    .insert({ user_id: user.id, name })
    .select("id")
    .single();

  if (wErr || !workout) throw new Error(wErr?.message ?? "Failed to create workout");

  const rows = input.exerciseIdsInOrder.map((exercise_id, idx) => ({
    workout_id: workout.id,
    exercise_id,
    order_index: idx,
  }));

  const { error: weErr } = await supabase.from("workout_exercises").insert(rows);
  if (weErr) throw new Error(weErr.message);

  revalidatePath("/dashboard");
  revalidatePath("/workouts/new");
  redirect("/dashboard");
}

export async function updateWorkout(input: {
  id: string;
  name: string;
  exerciseIdsInOrder: string[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const name = input.name.trim();
  if (!name) throw new Error("Name is required");
  if (input.exerciseIdsInOrder.length === 0) {
    throw new Error("Add at least one exercise");
  }

  const { error: wErr } = await supabase
    .from("workouts")
    .update({ name })
    .eq("id", input.id)
    .eq("user_id", user.id);

  if (wErr) throw new Error(wErr.message);

  // Simple approach: delete existing exercises and re-insert
  const { error: delErr } = await supabase
    .from("workout_exercises")
    .delete()
    .eq("workout_id", input.id);

  if (delErr) throw new Error(delErr.message);

  const rows = input.exerciseIdsInOrder.map((exercise_id, idx) => ({
    workout_id: input.id,
    exercise_id,
    order_index: idx,
  }));

  const { error: weErr } = await supabase.from("workout_exercises").insert(rows);
  if (weErr) throw new Error(weErr.message);

  revalidatePath("/dashboard");
  revalidatePath(`/workouts/${input.id}/edit`);
  redirect("/dashboard");
}
