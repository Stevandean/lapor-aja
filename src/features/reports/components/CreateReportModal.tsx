"use client";

import dynamic from "next/dynamic";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  Loader2,
  LocateFixed,
  MapPin,
  MapPinned,
  PlusCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Modal } from "@/src/components/ui/Modal";
import { Textarea } from "@/src/components/ui/Textarea";
import { createReport } from "@/src/features/reports/actions";
import type { ActionState } from "@/src/types/action";

type CreateReportModalProps = {
  buttonLabel?: string;
  buttonVariant?: "primary" | "secondary" | "outline" | "ghost";
  buttonSize?: "sm" | "md" | "lg";
  buttonClassName?: string;
  /** Buka modal saat pertama dirender, dipakai halaman /reports/create. */
  defaultOpen?: boolean;
  /** Sembunyikan tombol pemicu saat modal dikendalikan oleh halaman. */
  hideTrigger?: boolean;
  /** Dipanggil ketika pengguna menutup modal tanpa mengirim laporan. */
  onClose?: () => void;
  /** Dipanggil setelah laporan berhasil dikirim dan modal tertutup. */
  onSuccess?: () => void;
};

const REPORT_RADIUS_KM = 5;

const initialState: ActionState = {
  status: "idle",
  message: "",
};

const ReportLocationMap = dynamic(
  () =>
    import("@/src/features/reports/components/ReportLocationMap").then(
      (module) => module.ReportLocationMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-80 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40">
        <p className="text-sm text-muted-foreground">
          Memuat pemilih lokasi...
        </p>
      </div>
    ),
  }
);

export function CreateReportModal({
  buttonLabel = "Buat Laporan",
  buttonVariant = "primary",
  buttonSize = "md",
  buttonClassName,
  defaultOpen = false,
  hideTrigger = false,
  onClose,
  onSuccess,
}: CreateReportModalProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [open, setOpen] = useState(defaultOpen);
  const [gpsLatitude, setGpsLatitude] = useState("");
  const [gpsLongitude, setGpsLongitude] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [addressLoading, setAddressLoading] = useState(false);

  const [state, action, isPending] = useActionState(
    createReport,
    initialState
  );

  useEffect(() => {
    if (!state.message) return;

    if (state.status === "success") {
      toast.success(state.message);
      formRef.current?.reset();
      setTimeout(() => {
        setGpsLatitude("");
        setGpsLongitude("");
        setLatitude("");
        setLongitude("");
        setSelectedAddress("");
      }, 0);
      setOpen(false);
      router.refresh();
      onSuccess?.();
    }

    if (state.status === "error") {
      toast.error(state.message);
    }
    // onSuccess sengaja tidak masuk dependensi: efek ini hanya boleh jalan
    // saat hasil action berubah, bukan saat identitas callback berubah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, router]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      onClose?.();
    }
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error("Geolokasi tidak didukung oleh browser Anda.");
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLatitude = String(position.coords.latitude);
        const nextLongitude = String(position.coords.longitude);

        setGpsLatitude(nextLatitude);
        setGpsLongitude(nextLongitude);

        setLatitude(nextLatitude);
        setLongitude(nextLongitude);

        setLocationLoading(false);

        toast.success("Lokasi GPS terdeteksi", {
          description:
            "Anda bisa menggeser marker atau klik peta dalam radius yang diizinkan.",
        });

        getAddressFromCoordinates(nextLatitude, nextLongitude);
      },
      () => {
        setLocationLoading(false);

        toast.error("Gagal mengambil lokasi GPS", {
          description: "Izinkan akses lokasi lalu coba lagi.",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  function handleLocationChange(nextLatitude: string, nextLongitude: string) {
    setLatitude(nextLatitude);
    setLongitude(nextLongitude);
    getAddressFromCoordinates(nextLatitude, nextLongitude);
  }

  async function getAddressFromCoordinates(
    nextLatitude: string,
    nextLongitude: string
  ) {
    setAddressLoading(true);

    try {
      const params = new URLSearchParams({
        format: "jsonv2",
        lat: nextLatitude,
        lon: nextLongitude,
        zoom: "18",
        addressdetails: "1",
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Gagal mengambil alamat.");
      }

      const data = await response.json();

      setSelectedAddress(
        data.display_name || "Alamat lokasi terpilih tidak tersedia."
      );
    } catch {
      setSelectedAddress("Alamat tidak tersedia. Koordinat tetap disimpan.");

      toast.error("Gagal membaca alamat", {
        description:
          "Lokasi tetap disimpan, tetapi alamat tidak bisa dibuat otomatis.",
      });
    } finally {
      setAddressLoading(false);
    }
  }

  return (
    <>
      {hideTrigger ? null : (
        <Button
          type="button"
          variant={buttonVariant}
          size={buttonSize}
          className={buttonClassName}
          onClick={() => setOpen(true)}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          {buttonLabel}
        </Button>
      )}

      <Modal
        open={open}
        onOpenChange={handleOpenChange}
        title="Buat Laporan"
        description="Kirim laporan masyarakat dengan deskripsi, lokasi, dan foto bukti."
        className="max-w-3xl"
      >
        <form ref={formRef} action={action} className="space-y-5">
          <input type="hidden" name="latitude" value={latitude} />
          <input type="hidden" name="longitude" value={longitude} />
          <input type="hidden" name="gps_latitude" value={gpsLatitude} />
          <input type="hidden" name="gps_longitude" value={gpsLongitude} />
          <input
            type="hidden"
            name="location_radius_km"
            value={REPORT_RADIUS_KM}
          />
          <input type="hidden" name="auto_address" value={selectedAddress} />

          <div>
            <label className="form-label" htmlFor="title">
              Judul Laporan
            </label>

            <Input
              id="title"
              name="title"
              placeholder="Contoh: Jalan rusak di dekat balai desa"
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
              placeholder="Jelaskan masalah dengan jelas agar petugas desa memahami laporan."
              rows={5}
              required
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border bg-muted/30 p-5">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div className="flex gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                    <MapPinned className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Lokasi Laporan
                    </p>

                    <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
                      Mulai dengan mendeteksi lokasi GPS Anda. Setelah itu,
                      Anda bisa menyesuaikan titik laporan dengan menggeser
                      marker atau klik peta dalam radius {REPORT_RADIUS_KM} km
                      dari posisi GPS.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={locationLoading}
                  className="w-full gap-2 sm:w-auto"
                >
                  {locationLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LocateFixed className="h-4 w-4" />
                  )}
                  {locationLoading ? "Mendeteksi GPS..." : "Gunakan Lokasi GPS"}
                </Button>
              </div>
            </div>

            <div className="p-5">
              {gpsLatitude && gpsLongitude ? (
                <div className="space-y-4">
                  <ReportLocationMap
                    gpsLatitude={gpsLatitude}
                    gpsLongitude={gpsLongitude}
                    selectedLatitude={latitude}
                    selectedLongitude={longitude}
                    radiusKm={REPORT_RADIUS_KM}
                    onLocationChange={handleLocationChange}
                  />

                  <div className="rounded-2xl border border-border bg-muted/30 p-4">
                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                        <MapPin className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          Alamat Terpilih
                        </p>

                        {addressLoading ? (
                          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Membaca alamat...
                          </div>
                        ) : (
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {selectedAddress ||
                              "Alamat akan muncul setelah lokasi dipilih."}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-warning-50 text-warning-700">
                    <LocateFixed className="h-6 w-6" />
                  </div>

                  <p className="mt-4 text-sm font-semibold text-foreground">
                    Lokasi GPS wajib digunakan
                  </p>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                    Klik tombol GPS terlebih dahulu. Pemilih peta akan muncul
                    setelah lokasi Anda terdeteksi.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="form-label" htmlFor="photos">
              Foto Bukti
            </label>

            <Input
              id="photos"
              name="photos"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              required
            />

            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Unggah 1-5 foto. Format yang diizinkan: JPG, PNG, atau WEBP.
              Ukuran maksimal 10MB per foto.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Batal
            </Button>

            <Button
              type="submit"
              disabled={
                isPending ||
                !gpsLatitude ||
                !gpsLongitude ||
                !latitude ||
                !longitude
              }
            >
              {isPending ? "Mengirim..." : "Kirim Laporan"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
