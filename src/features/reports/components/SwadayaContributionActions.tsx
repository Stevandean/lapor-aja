"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import { Textarea } from "@/src/components/ui/Textarea";
import {
  verifySwadayaContribution,
  receiveSwadayaContribution,
} from "@/src/features/reports/swadayaActions";
import type { ActionState } from "@/src/types/action";

const initialState: ActionState = {
  status: "idle",
  message: "",
};

export function SwadayaVerifyButton({ contributionId }: { contributionId: string }) {
  const [state, action, isPending] = useActionState(
    verifySwadayaContribution,
    initialState
  );

  useEffect(() => {
    if (!state.message) return;

    if (state.status === "success") {
      toast.success("Kontribusi diverifikasi", { description: state.message });
    }

    if (state.status === "error") {
      toast.error("Gagal verifikasi", { description: state.message });
    }
  }, [state]);

  return (
    <form action={action}>
      <input type="hidden" name="contribution_id" value={contributionId} />
      <Button type="submit" variant="outline" size="sm" disabled={isPending}>
        {isPending ? "Memverifikasi..." : "Verifikasi"}
      </Button>
    </form>
  );
}

export function SwadayaReceiveForm({ contributionId }: { contributionId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [state, action, isPending] = useActionState(
    receiveSwadayaContribution,
    initialState
  );

  useEffect(() => {
    if (!state.message) return;

    if (state.status === "success") {
      toast.success("Kontribusi dikonfirmasi diterima", { description: state.message });
    }

    if (state.status === "error") {
      toast.error("Gagal konfirmasi", { description: state.message });
    }
  }, [state]);

  if (!expanded) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setExpanded(true)}
      >
        Konfirmasi Diterima
      </Button>
    );
  }

  return (
    <form action={action} className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
      <input type="hidden" name="contribution_id" value={contributionId} />

      <Textarea
        name="received_note"
        label="Catatan penerimaan (opsional)"
        placeholder="Contoh: diterima langsung di balai desa."
      />

      <div className="space-y-1.5">
        <label className="form-label" htmlFor={`proof_photo_${contributionId}`}>
          Foto bukti serah terima (opsional)
        </label>
        <input
          id={`proof_photo_${contributionId}`}
          type="file"
          name="proof_photo"
          accept="image/jpeg,image/png,image/webp"
          className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary-700"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Menyimpan..." : "Simpan Konfirmasi"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setExpanded(false)}
          disabled={isPending}
        >
          Batal
        </Button>
      </div>
    </form>
  );
}
