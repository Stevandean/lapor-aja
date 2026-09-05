"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import { Textarea } from "@/src/components/ui/Textarea";
import { closeSwadayaCampaign } from "@/src/features/reports/swadayaActions";
import type { ActionState } from "@/src/types/action";

const initialState: ActionState = {
  status: "idle",
  message: "",
};

export function SwadayaCloseCampaignButton({ campaignId }: { campaignId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [state, action, isPending] = useActionState(
    closeSwadayaCampaign,
    initialState
  );

  useEffect(() => {
    if (!state.message) return;

    if (state.status === "success") {
      toast.success("Galang swadaya ditutup", { description: state.message });
    }

    if (state.status === "error") {
      toast.error("Gagal menutup galang swadaya", { description: state.message });
    }
  }, [state]);

  if (!expanded) {
    return (
      <Button type="button" variant="outline" onClick={() => setExpanded(true)}>
        Tutup Galang Swadaya
      </Button>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="campaign_id" value={campaignId} />

      <Textarea
        name="closed_reason"
        label="Alasan penutupan (opsional)"
        placeholder="Contoh: dana sudah mencukupi kebutuhan."
      />

      <p className="text-xs text-muted-foreground">
        Menutup galang swadaya akan melanjutkan hitungan mundur SLA laporan
        ini seperti biasa.
      </p>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Menutup..." : "Konfirmasi Tutup"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setExpanded(false)}
          disabled={isPending}
        >
          Batal
        </Button>
      </div>
    </form>
  );
}
