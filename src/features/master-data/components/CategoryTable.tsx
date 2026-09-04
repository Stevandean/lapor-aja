"use client";

import { useActionState, useEffect, useState } from "react";
import { CircleCheck, CircleX, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Modal } from "@/src/components/ui/Modal";
import { Textarea } from "@/src/components/ui/Textarea";
import {
  toggleCategoryStatus,
  updateCategory,
} from "@/src/features/master-data/actions";
import type { ActionState } from "@/src/types/action";

type Category = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  sla_verification_hours: number | null;
  sla_resolution_hours: number | null;
};

type CategoryTableProps = {
  categories: Category[];
};

const initialState: ActionState = {
  status: "idle",
  message: "",
};

export function CategoryTable({ categories }: CategoryTableProps) {
  if (categories.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center">
        <p className="text-sm font-semibold text-foreground">
          Belum ada kategori
        </p>

        <p className="mt-2 text-sm text-muted-foreground">
          Tambahkan kategori pertama untuk mengklasifikasi laporan masyarakat.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="border-b border-border bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-4 font-semibold">Kategori</th>
              <th className="px-5 py-4 font-semibold">Deskripsi</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 font-semibold">Diperbarui</th>
              <th className="px-5 py-4 text-right font-semibold">Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {categories.map((category) => (
              <tr
                key={category.id}
                className="transition-colors hover:bg-muted/40"
              >
                <td className="px-5 py-4">
                  <p className="font-semibold text-foreground">
                    {category.name}
                  </p>
                </td>

                <td className="px-5 py-4 text-muted-foreground">
                  {category.description || "-"}
                </td>

                <td className="px-5 py-4">
                  <StatusBadge isActive={category.is_active} />
                </td>

                <td className="px-5 py-4 text-muted-foreground">
                  {formatDate(category.updated_at)}
                </td>

                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <CategoryEditModal category={category} />
                    <CategoryStatusButton category={category} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-border lg:hidden">
        {categories.map((category) => (
          <div key={category.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-foreground">
                  {category.name}
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {category.description || "-"}
                </p>
              </div>

              <StatusBadge isActive={category.is_active} />
            </div>

            <div className="mt-4 flex gap-2">
              <CategoryEditModal category={category} />
              <CategoryStatusButton category={category} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryEditModal({ category }: { category: Category }) {
  const [open, setOpen] = useState(false);

  const [state, action, isPending] = useActionState(
    updateCategory,
    initialState
  );

  useEffect(() => {
    if (!state.message) return;

    if (state.status === "success") {
      toast.success(state.message);
      setTimeout(() => setOpen(false), 0);
    }

    if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="mr-2 h-4 w-4" />
        Ubah
      </Button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Ubah Kategori"
        description="Perbarui informasi kategori."
      >
        <form action={action} className="space-y-5">
          <input type="hidden" name="category_id" value={category.id} />

          <div>
            <label className="form-label" htmlFor={`name-${category.id}`}>
              Nama Kategori
            </label>

            <Input
              id={`name-${category.id}`}
              name="name"
              defaultValue={category.name}
              required
            />
          </div>

          <div>
            <label
              className="form-label"
              htmlFor={`description-${category.id}`}
            >
              Deskripsi
            </label>

            <Textarea
              id={`description-${category.id}`}
              name="description"
              defaultValue={category.description ?? ""}
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
                  htmlFor={`sla-verification-${category.id}`}
                >
                  Durasi verifikasi khusus (jam)
                </label>

                <Input
                  id={`sla-verification-${category.id}`}
                  name="sla_verification_hours"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Contoh: 24"
                  defaultValue={category.sla_verification_hours ?? ""}
                />
              </div>

              <div>
                <label
                  className="form-label"
                  htmlFor={`sla-resolution-${category.id}`}
                >
                  Durasi penyelesaian khusus (jam)
                </label>

                <Input
                  id={`sla-resolution-${category.id}`}
                  name="sla_resolution_hours"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Contoh: 72"
                  defaultValue={category.sla_resolution_hours ?? ""}
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
              {isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function CategoryStatusButton({ category }: { category: Category }) {
  const [state, action, isPending] = useActionState(
    toggleCategoryStatus,
    initialState
  );

  useEffect(() => {
    if (!state.message) return;

    if (state.status === "success") {
      toast.success(state.message);
    }

    if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form action={action}>
      <input type="hidden" name="category_id" value={category.id} />
      <input
        type="hidden"
        name="action"
        value={category.is_active ? "deactivate" : "activate"}
      />

      <Button type="submit" variant="outline" size="sm" disabled={isPending}>
        {category.is_active ? "Nonaktifkan" : "Aktifkan"}
      </Button>
    </form>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <Badge className="bg-success-50 text-success-700">
        <CircleCheck className="mr-1 h-3.5 w-3.5" />
        Aktif
      </Badge>
    );
  }

  return (
    <Badge className="bg-danger-50 text-danger-700">
      <CircleX className="mr-1 h-3.5 w-3.5" />
      Nonaktif
    </Badge>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}
