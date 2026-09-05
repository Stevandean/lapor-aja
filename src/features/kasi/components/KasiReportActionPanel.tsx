"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  ClipboardEdit,
  PlayCircle,
  RotateCcw,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { Textarea } from "@/src/components/ui/Textarea";
import {
  resolveKasiReport,
  returnKasiReportAssignment,
  startKasiReportProgress,
  submitKasiProgressUpdate,
} from "@/src/features/kasi/actions";
import type { ActionState } from "@/src/types/action";

type KasiReportActionPanelProps = {
  reportId: string;
  currentStatus: string;
  hasProgressStarted: boolean;
  hasBudgetRequests: boolean;
  hasPendingBudgetRequest: boolean;
};

const initialState: ActionState = {
  status: "idle",
  message: "",
};

export function KasiReportActionPanel({
  reportId,
  currentStatus,
  hasProgressStarted,
  hasBudgetRequests,
  hasPendingBudgetRequest,
}: KasiReportActionPanelProps) {
  const router = useRouter();
  const [startState, startAction, isStarting] = useActionState(
    startKasiReportProgress,
    initialState
  );
  const [progressState, progressAction, isSavingProgress] = useActionState(
    submitKasiProgressUpdate,
    initialState
  );
  const [resolveState, resolveAction, isResolving] = useActionState(
    resolveKasiReport,
    initialState
  );
  const [returnState, returnAction, isReturning] = useActionState(
    returnKasiReportAssignment,
    initialState
  );

  useActionToast(startState, router);
  useActionToast(progressState, router);
  useActionToast(resolveState, router);
  useActionToast(returnState, router);

  const localStatus =
    (startState.status === "success" || hasProgressStarted) &&
    currentStatus === "handled_by_village"
      ? "in_progress"
      : currentStatus;
  const canStart = localStatus === "handled_by_village";
  const canUpdateProgress = localStatus === "in_progress";
  const canRequestBudget =
    localStatus === "handled_by_village" && !hasPendingBudgetRequest;
  const canResolve = localStatus === "in_progress";
  const canReturnAssignment =
    ["handled_by_village", "waiting_budget"].includes(localStatus) &&
    !hasProgressStarted &&
    !hasBudgetRequests;
  const isSubmitting =
    isStarting || isSavingProgress || isResolving || isReturning;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aksi Kasi</CardTitle>
        <CardDescription>
          Perbarui progres penanganan, ajukan anggaran, atau selesaikan
          laporan yang ditugaskan.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {canStart ? (
          <form action={startAction} className="space-y-3">
            <input type="hidden" name="report_id" value={reportId} />
            <Textarea
              id="start-note"
              name="note"
              label="Catatan mulai"
              placeholder="Jelaskan singkat langkah awal penanganan."
              required
              disabled={isSubmitting}
            />
            <Button type="submit" disabled={isSubmitting} className="w-full">
              <PlayCircle className="mr-2 h-4 w-4" />
              {isStarting ? "Memulai..." : "Tandai sedang diproses"}
            </Button>
          </form>
        ) : null}

        {localStatus === "waiting_budget" ? (
          <div className="rounded-2xl border border-warning-100 bg-warning-50 p-4 text-sm leading-6 text-warning-700">
            Laporan ini sedang menunggu peninjauan anggaran. Aksi progres akan
            tersedia setelah pengajuan anggaran ditinjau.
          </div>
        ) : null}

        {hasPendingBudgetRequest && localStatus !== "waiting_budget" ? (
          <div className="rounded-2xl border border-warning-100 bg-warning-50 p-4 text-sm leading-6 text-warning-700">
            Laporan ini sudah memiliki pengajuan anggaran yang menunggu peninjauan.
            Anda dapat mengirim revisi setelah pengajuan saat ini disetujui atau ditolak.
          </div>
        ) : null}

        {canUpdateProgress ? (
          <form action={progressAction} className="space-y-3">
            <input type="hidden" name="report_id" value={reportId} />
            <Textarea
              id="progress-note"
              name="note"
              label="Update progres"
              placeholder="Tulis progres penanganan lapangan terbaru."
              required
              disabled={isSubmitting}
            />
            <Input
              name="progress_photos"
              label="Foto progres"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={isSubmitting}
              helperText="Opsional, maksimal 5 foto. Hanya JPG, PNG, atau WEBP."
            />
            <Button type="submit" disabled={isSubmitting} className="w-full">
              <ClipboardEdit className="mr-2 h-4 w-4" />
              {isSavingProgress ? "Menyimpan..." : "Simpan update progres"}
            </Button>
          </form>
        ) : null}

        {canRequestBudget ? (
          <Link href={`/dashboard/kasi/budget?reportId=${reportId}`}>
            <Button type="button" variant="outline" className="w-full">
              <Wallet className="mr-2 h-4 w-4" />
              Siapkan anggaran per item
            </Button>
          </Link>
        ) : null}

        {canReturnAssignment ? (
          <form action={returnAction} className="space-y-3 border-t border-border pt-5">
            <input type="hidden" name="report_id" value={reportId} />
            <Textarea
              id="return-note"
              name="note"
              label="Catatan pengembalian tugas"
              placeholder="Jelaskan mengapa laporan ini tidak sesuai dengan seksi Anda."
              required
              disabled={isSubmitting}
            />
            <Button
              type="submit"
              variant="outline"
              disabled={isSubmitting}
              className="w-full border-warning-200 text-warning-700 hover:bg-warning-50"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {isReturning ? "Mengembalikan..." : "Kembalikan ke admin"}
            </Button>
          </form>
        ) : null}

        {canResolve ? (
          <form action={resolveAction} className="space-y-3">
            <input type="hidden" name="report_id" value={reportId} />
            <Textarea
              id="resolve-note"
              name="note"
              label="Catatan penyelesaian"
              placeholder="Ringkas hasil penanganan yang sudah selesai."
              required
              disabled={isSubmitting}
            />
            <Input
              name="progress_photos"
              label="Foto penyelesaian"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={isSubmitting}
              helperText="Bukti akhir opsional sebelum laporan diselesaikan."
            />
            <Button type="submit" disabled={isSubmitting} className="w-full">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {isResolving ? "Menyelesaikan..." : "Tandai selesai"}
            </Button>
          </form>
        ) : null}

        {!canStart &&
        !canUpdateProgress &&
        !canRequestBudget &&
        !canReturnAssignment &&
        !canResolve ? (
          <div className="rounded-2xl border border-muted bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
            Aksi hanya tersedia untuk laporan aktif yang ditugaskan ke seksi
            Anda.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function useActionToast(state: ActionState, router: ReturnType<typeof useRouter>) {
  useEffect(() => {
    if (state.status === "success") {
      toast.success("Berhasil", {
        description: state.message,
      });

      router.refresh();
    }

    if (state.status === "error") {
      toast.error("Gagal", {
        description: state.message,
      });
    }
  }, [state, router]);
}
