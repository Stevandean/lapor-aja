import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileDown } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { PrintLetterButton } from "@/src/features/admin/components/PrintLetterButton";
import { OfficialLetterPrimaryActionButton } from "@/src/features/admin/components/OfficialLetterPrimaryActionButton";
import { getOfficialLetterDetail } from "@/src/features/admin/queries";

type AdminLetterDetailPageProps = {
  params: Promise<{
    letterId: string;
  }>;
};

export default async function AdminLetterDetailPage({
  params,
}: AdminLetterDetailPageProps) {
  const { letterId } = await params;

  const letter = await getOfficialLetterDetail(letterId);

  if (!letter) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 print:hidden lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">Surat Resmi</p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Pratinjau Surat
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Tinjau draf surat yang dibuat sebelum dicetak atau disimpan sebagai
            PDF.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/admin/letters">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Surat
            </Button>
          </Link>

          <OfficialLetterPrimaryActionButton
            letterId={letter.id}
            status={letter.status}
          />

          {letter.pdf_url ? (
            <a href={letter.pdf_url} download>
              <Button variant="outline">
                <FileDown className="mr-2 h-4 w-4" />
                Unduh PDF
              </Button>
            </a>
          ) : null}

          <PrintLetterButton />

        </div>
      </section>

      <article className="mx-auto max-w-4xl rounded-2xl border border-border bg-white p-8 text-slate-950 shadow-sm print:border-0 print:shadow-none">
        <header className="border-b-2 border-slate-900 pb-5 text-center">
          <p className="text-lg font-bold uppercase tracking-wide">
            Pemerintah Desa
          </p>

          <p className="mt-1 text-sm">
            Sistem Lapor Aja - Sistem Pelaporan Desa
          </p>

          <p className="mt-1 text-xs text-slate-600">
            Surat Permohonan Tindak Lanjut Laporan Masyarakat
          </p>
        </header>

        <section className="mt-8 space-y-2 text-sm">
          <div className="grid grid-cols-[120px_1fr] gap-2">
            <p>Nomor</p>
            <p>: {letter.letter_number}</p>
          </div>

          <div className="grid grid-cols-[120px_1fr] gap-2">
            <p>Perihal</p>
            <p>: {letter.subject}</p>
          </div>

          <div className="grid grid-cols-[120px_1fr] gap-2">
            <p>Status</p>
            <p>: {formatEnum(letter.status)}</p>
          </div>
        </section>

        <section className="mt-8 whitespace-pre-wrap text-sm leading-8">
          {letter.body || "Isi surat tidak tersedia."}
        </section>

        <section className="mt-12 flex justify-end">
          <div className="w-64 text-center text-sm">
            <p>{formatDate(new Date().toISOString())}</p>
            <p className="mt-1">Pemerintah Desa</p>

            <div className="h-24" />

            <p className="font-semibold underline">Kepala Desa</p>
          </div>
        </section>
      </article>
    </div>
  );
}

function formatEnum(value: string) {
  const labels: Record<string, string> = {
    draft: "Draf",
    final: "Final",
    sent: "Terkirim",
  };

  return labels[value] ?? value.replaceAll("_", " ");
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}
