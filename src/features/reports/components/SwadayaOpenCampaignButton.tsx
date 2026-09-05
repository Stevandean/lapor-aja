"use client";

import { useActionState, useEffect } from "react";
import { HeartHandshake } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import { Textarea } from "@/src/components/ui/Textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/Card";
import { openSwadayaCampaign } from "@/src/features/reports/swadayaActions";
import type { ActionState } from "@/src/types/action";

const initialState: ActionState = {
  status: "idle",
  message: "",
};

export function SwadayaOpenCampaignButton({ reportId }: { reportId: string }) {
  const [state, action, isPending] = useActionState(openSwadayaCampaign, initialState);

  useEffect(() => {
    if (!state.message) return;

    if (state.status === "success") {
      toast.success("Galang swadaya dibuka", { description: state.message });
    }

    if (state.status === "error") {
      toast.error("Gagal membuka galang swadaya", { description: state.message });
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HeartHandshake className="h-5 w-5 text-primary" />
          Galang Swadaya Masyarakat
        </CardTitle>
        <CardDescription>
          Buka galang swadaya supaya warga bisa membantu mempercepat
          penanganan laporan ini tanpa menunggu anggaran desa.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={action} className="space-y-3">
          <input type="hidden" name="report_id" value={reportId} />

          <Textarea
            name="target_note"
            label="Catatan target (opsional)"
            placeholder="Contoh: butuh sekitar 5 sak semen dan tenaga gotong royong."
            helperText="Kalau laporan ini punya pengajuan anggaran, perkiraan biayanya akan otomatis dipakai sebagai target."
          />

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Membuka..." : "Buka Galang Swadaya"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
