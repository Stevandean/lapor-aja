"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Modal } from "@/src/components/ui/Modal";
import { Textarea } from "@/src/components/ui/Textarea";
import { createCategory } from "@/src/features/master-data/actions";
import type { ActionState } from "@/src/types/action";

const initialState: ActionState = {
  status: "idle",
  message: "",
};

export function CategoryCreateModal() {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);

  const [state, action, isPending] = useActionState(
    createCategory,
    initialState
  );

  useEffect(() => {
    if (!state.message) return;

    if (state.status === "success") {
      toast.success(state.message);
      formRef.current?.reset();
      setTimeout(() => setOpen(false), 0);
    }

    if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Tambah Kategori
      </Button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Tambah Kategori"
        description="Buat kategori laporan yang digunakan untuk mengklasifikasi laporan masyarakat."
      >
        <form ref={formRef} action={action} className="space-y-5">
          <div>
            <label className="form-label" htmlFor="name">
              Nama Kategori
            </label>

            <Input
              id="name"
              name="name"
              placeholder="Contoh: Kerusakan Jalan"
              required
            />
          </div>

          <div>
            <label className="form-label" htmlFor="description">
              Deskripsi
            </label>

            <Textarea
              id="description"
              name="description"
              placeholder="Jelaskan secara singkat penggunaan kategori ini."
              rows={4}
            />
          </div>

          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <p className="text-sm font-semibold text-foreground">
              Durasi SLA khusus (opsional)
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Kosongkan untuk memakai aturan berdasarkan prioritas seperti
              biasa. Diisi keduanya = durasi ini menggantikan aturan
              prioritas sepenuhnya untuk kategori ini.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  className="form-label"
                  htmlFor="sla_verification_hours"
                >
                  Durasi verifikasi khusus (jam)
                </label>

                <Input
                  id="sla_verification_hours"
                  name="sla_verification_hours"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Contoh: 24"
                />
              </div>

              <div>
                <label className="form-label" htmlFor="sla_resolution_hours">
                  Durasi penyelesaian khusus (jam)
                </label>

                <Input
                  id="sla_resolution_hours"
                  name="sla_resolution_hours"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Contoh: 72"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Batal
            </Button>

            <Button type="submit" disabled={isPending}>
              {isPending ? "Membuat..." : "Buat Kategori"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
