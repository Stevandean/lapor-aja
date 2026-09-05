"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import { Textarea } from "@/src/components/ui/Textarea";
import { submitSwadayaContribution } from "@/src/features/reports/swadayaActions";
import type { ActionState } from "@/src/types/action";

const initialState: ActionState = {
  status: "idle",
  message: "",
};

type ContributionType = "uang" | "material" | "logistik" | "tenaga";

export function SwadayaContributionForm({
  campaignId,
  contributorName,
  contributorPhone,
}: {
  campaignId: string;
  contributorName: string;
  contributorPhone: string | null;
}) {
  const [type, setType] = useState<ContributionType>("uang");
  const [state, action, isPending] = useActionState(
    submitSwadayaContribution,
    initialState
  );

  useEffect(() => {
    if (!state.message) return;

    if (state.status === "success") {
      toast.success("Kontribusi tercatat", { description: state.message });
    }

    if (state.status === "error") {
      toast.error("Gagal mencatat kontribusi", { description: state.message });
    }
  }, [state]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="campaign_id" value={campaignId} />
      <input type="hidden" name="type" value={type} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nama kontributor" value={contributorName} disabled readOnly />
        <Input
          label="Nomor HP"
          value={contributorPhone ?? "-"}
          disabled
          readOnly
        />
      </div>

      <Select
        label="Jenis kontribusi"
        value={type}
        onChange={(event) => setType(event.target.value as ContributionType)}
      >
        <option value="uang">Uang</option>
        <option value="material">Material</option>
        <option value="logistik">Logistik</option>
        <option value="tenaga">Tenaga</option>
      </Select>

      {type === "uang" ? (
        <Input
          label="Jumlah donasi (Rp)"
          name="amount"
          type="number"
          min="1"
          step="1"
          placeholder="Contoh: 100000"
          required
        />
      ) : null}

      {type === "material" || type === "logistik" ? (
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
          <Input
            label="Deskripsi barang"
            name="item_description"
            placeholder="Contoh: Semen"
            required
          />
          <Input
            label="Jumlah"
            name="item_quantity"
            type="number"
            min="1"
            step="1"
            placeholder="5"
            required
          />
          <Input label="Satuan" name="item_unit" placeholder="sak" required />
        </div>
      ) : null}

      {type === "tenaga" ? (
        <Textarea
          label="Ketersediaan waktu/tenaga"
          name="availability_note"
          placeholder="Contoh: bisa ikut gotong royong Sabtu pagi minggu ini."
          required
        />
      ) : null}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Mengirim..." : "Kirim Kontribusi"}
      </Button>
    </form>
  );
}
