"use client";

import { useActionState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Award } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import { generatePerformancePredicate } from "@/src/features/village/performanceActions";
import type { ActionState } from "@/src/types/action";

const initialState: ActionState = {
  status: "idle",
  message: "",
};

export function VillagePerformancePredicateButton() {
  const searchParams = useSearchParams();
  const [state, action, isPending] = useActionState(
    generatePerformancePredicate,
    initialState
  );

  useEffect(() => {
    if (!state.message) return;

    if (state.status === "success") {
      toast.success("Predikat ditentukan", { description: state.message });
    }

    if (state.status === "error") {
      toast.error("Gagal menentukan predikat", { description: state.message });
    }
  }, [state]);

  const periodType = searchParams.get("tipe") ?? "bulanan";
  const periodOffset = searchParams.get("periode") ?? "1";

  return (
    <form action={action}>
      <input type="hidden" name="periodType" value={periodType} />
      <input type="hidden" name="periodOffset" value={periodOffset} />

      <Button type="submit" variant="outline" disabled={isPending}>
        <Award className="mr-2 h-4 w-4" />
        {isPending ? "Menentukan predikat..." : "Tentukan Predikat Periode Ini"}
      </Button>
    </form>
  );
}
