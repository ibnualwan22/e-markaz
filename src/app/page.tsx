import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  FaGraduationCap,
  FaClipboardList,
  FaMoneyBillWave,
  FaPlayCircle,
  FaWhatsapp,
  FaCalendarAlt,
  FaVideo,
  FaFilePdf,
  FaClipboardCheck,
  FaChalkboardTeacher,
} from "react-icons/fa";

export const dynamic = "force-dynamic";

const formatTanggal = (d: Date) =>
  d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

export default async function Home() {
  const [programs, periodeAktif, totalSantri] = await Promise.all([
    prisma.program.findMany({
      where: { statusAktif: true },
      orderBy: { nama: "asc" },
      select: { id: true, nama: true, harga: true, deskripsi: true, durasiBulan: true },
    }),
    prisma.periode.findFirst({
      where: { statusAktif: true },
      orderBy: { tanggalBuka: "desc" },
    }),
    prisma.santri.count(),
  ]);

  const hargaMulai = programs.length ? Math.min(...programs.map((p) => p.harga)) : 0;

  return (
    <main className="min-h-screen bg-background">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        {/* Background hero: gambar dummy — ganti file public/images/hero-bg.jpg untuk menggantinya */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}
        />
        <div className="pointer-events-none absolute inset-0 bg-black/50" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,transparent_0%,rgba(5,5,5,0.55)_78%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[#050505]" />
        <div className="relative mx-auto max-w-4xl px-6 pb-20 pt-24 text-center md:pt-32">
          {periodeAktif && (
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-gray-300">
              <FaCalendarAlt className="text-primary" />
              Pendaftaran {periodeAktif.nama} dibuka s.d. {formatTanggal(periodeAktif.tanggalTutup)}
            </p>
          )}
          <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl">
            Belajar <span className="text-primary">Bahasa Arab</span> Online, Terstruktur dari Dasar
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-gray-400">
            Program online Markaz Arabiyah: kelas live via Zoom bersama pengajar, modul PDF untuk
            belajar mandiri, dan portal santri untuk memantau materi serta kehadiran Anda.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/pendaftaran" className="btn btn-primary w-full px-8 py-3 text-lg sm:w-auto">
              Daftar Sekarang
            </Link>
            <Link href="/santri/login" className="btn btn-secondary w-full px-8 py-3 text-lg sm:w-auto">
              Login Portal Santri
            </Link>
          </div>
          {programs.length > 0 && (
            <p className="mt-8 text-sm text-gray-500">
              {programs.length} program pilihan &middot; Harga mulai Rp{" "}
              {hargaMulai.toLocaleString("id-ID")} &middot; Durasi 1 bulan
            </p>
          )}
        </div>
      </section>

      {/* ===== STATISTIK ===== */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-10 text-center sm:grid-cols-3">
          <div>
            <p className="text-3xl font-bold tabular-nums text-white">{programs.length}</p>
            <p className="mt-1 text-sm text-gray-500">Program aktif</p>
          </div>
          <div>
            <p className="text-3xl font-bold tabular-nums text-white">{totalSantri}</p>
            <p className="mt-1 text-sm text-gray-500">Santri terdaftar</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">{periodeAktif ? periodeAktif.nama : "—"}</p>
            <p className="mt-1 text-sm text-gray-500">Periode yang sedang berjalan</p>
          </div>
        </div>
      </section>

      {/* ===== PROGRAM ===== */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-3xl font-bold text-white">Pilih Program Anda</h2>
          <p className="mx-auto max-w-xl text-gray-400">
            Setiap program berjalan satu bulan penuh dengan pertemuan live dan modul pendamping.
            Pilih yang sesuai dengan level Anda saat ini.
          </p>
        </div>

        {programs.length === 0 ? (
          <p className="text-center text-gray-400">
            Program belum tersedia saat ini. Silakan hubungi admin untuk informasi pendaftaran
            berikutnya.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((program) => (
              <div key={program.id} className="card flex flex-col">
                <div className="mb-4 flex items-center gap-3">
                  <span className="rounded-lg bg-primary/10 p-2.5 text-xl text-primary">
                    <FaGraduationCap />
                  </span>
                  <h3 className="text-lg font-semibold text-white">{program.nama}</h3>
                </div>
                {program.deskripsi ? (
                  <p className="mb-6 flex-1 text-sm leading-relaxed text-gray-400">
                    {program.deskripsi}
                  </p>
                ) : (
                  <p className="mb-6 flex-1 text-sm leading-relaxed text-gray-400">
                    Kelas live via Zoom dan modul PDF, dibimbing pengajar Markaz Arabiyah.
                  </p>
                )}
                <div className="mt-auto border-t border-border pt-4">
                  <p className="mb-1 text-2xl font-bold text-white">
                    Rp {program.harga.toLocaleString("id-ID")}
                  </p>
                  <p className="mb-4 text-sm text-gray-500">Durasi {program.durasiBulan} bulan</p>
                  <Link href="/pendaftaran" className="btn btn-secondary w-full">
                    Daftar Program Ini
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== KEUNGGULAN ===== */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-3xl font-bold text-white">Kenapa Belajar di E-Markaz?</h2>
          <p className="mx-auto max-w-xl text-gray-400">
            Belajar dari rumah tanpa kehilangan suasana kelas: bertemu pengajar secara langsung,
            dibekali modul, dan progres Anda tercatat rapi.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card">
            <span className="mb-4 inline-block rounded-lg bg-primary/10 p-3 text-2xl text-primary">
              <FaVideo />
            </span>
            <h3 className="mb-2 text-lg font-semibold text-white">Kelas Live via Zoom</h3>
            <p className="text-sm leading-relaxed text-gray-400">
              Setiap sesi berlangsung live bersama pengajar, bukan rekaman. Anda bisa bertanya
              dan berlatih langsung di kelas.
            </p>
          </div>
          <div className="card">
            <span className="mb-4 inline-block rounded-lg bg-primary/10 p-3 text-2xl text-primary">
              <FaChalkboardTeacher />
            </span>
            <h3 className="mb-2 text-lg font-semibold text-white">Terstruktur dari Dasar</h3>
            <p className="text-sm leading-relaxed text-gray-400">
              Materi disusun bertahap oleh pengajar Markaz Arabiyah, dari level pemula sampai
              lanjutan, sesuai program yang Anda pilih.
            </p>
          </div>
          <div className="card">
            <span className="mb-4 inline-block rounded-lg bg-primary/10 p-3 text-2xl text-primary">
              <FaFilePdf />
            </span>
            <h3 className="mb-2 text-lg font-semibold text-white">Modul PDF Pendamping</h3>
            <p className="text-sm leading-relaxed text-gray-400">
              Setiap program dilengkapi modul PDF yang bisa dibaca ulang kapan saja melalui
              portal santri.
            </p>
          </div>
          <div className="card">
            <span className="mb-4 inline-block rounded-lg bg-primary/10 p-3 text-2xl text-primary">
              <FaClipboardCheck />
            </span>
            <h3 className="mb-2 text-lg font-semibold text-white">Progres Terpantau</h3>
            <p className="text-sm leading-relaxed text-gray-400">
              Kehadiran dan materi tercatat di portal santri, sehingga Anda tahu persis
              perkembangan belajar Anda selama program berjalan.
            </p>
          </div>
        </div>
      </section>

      {/* ===== CARA DAFTAR ===== */}
      <section className="border-y border-border bg-surface/50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="mb-10 text-center text-3xl font-bold text-white">Cara Mendaftar</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="card">
              <span className="mb-4 inline-block rounded-lg bg-primary/10 p-3 text-2xl text-primary">
                <FaClipboardList />
              </span>
              <h3 className="mb-2 text-lg font-semibold text-white">1. Isi formulir pendaftaran</h3>
              <p className="text-sm leading-relaxed text-gray-400">
                Pilih program, lalu buat username dan password Anda sendiri untuk masuk ke portal
                santri.
              </p>
            </div>
            <div className="card">
              <span className="mb-4 inline-block rounded-lg bg-primary/10 p-3 text-2xl text-primary">
                <FaMoneyBillWave />
              </span>
              <h3 className="mb-2 text-lg font-semibold text-white">2. Transfer dan konfirmasi</h3>
              <p className="text-sm leading-relaxed text-gray-400">
                Transfer ke Bank BRI 0555-0100-1126-567 a.n. Markaz Arabiyah sesuai total tagihan,
                lalu konfirmasi ke WhatsApp admin agar pembayaran segera divalidasi.
              </p>
            </div>
            <div className="card">
              <span className="mb-4 inline-block rounded-lg bg-primary/10 p-3 text-2xl text-primary">
                <FaPlayCircle />
              </span>
              <h3 className="mb-2 text-lg font-semibold text-white">3. Mulai belajar</h3>
              <p className="text-sm leading-relaxed text-gray-400">
                Setelah divalidasi, akun Anda aktif. Materi PDF, jadwal, dan absensi tersedia di
                portal santri.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link href="/pendaftaran" className="btn btn-primary px-8 py-3 text-lg">
              Daftar Sekarang
            </Link>
            <p className="mt-4 text-sm text-gray-500">
              Ada pertanyaan?{" "}
              <a
                href="https://wa.me/628980837788?text=Assalamu'alaikum, saya ingin bertanya tentang pendaftaran E-Markaz."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-primary hover:text-white"
              >
                <FaWhatsapp /> Chat admin via WhatsApp
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="mb-10 text-center text-3xl font-bold text-white">Sering Ditanyakan</h2>
        <div className="space-y-4">
          <details className="card group">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-white [&::-webkit-details-marker]:hidden">
              Bagaimana cara mendaftar?
              <span className="ml-4 text-xl text-primary transition-transform duration-200 group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              Klik tombol Daftar Sekarang, pilih program dan periode, lalu lengkapi formulir.
              Setelah itu transfer biaya program dan konfirmasi ke WhatsApp admin. Akun portal
              santri Anda aktif setelah pembayaran divalidasi admin.
            </p>
          </details>
          <details className="card group">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-white [&::-webkit-details-marker]:hidden">
              Bagaimana cara membayar?
              <span className="ml-4 text-xl text-primary transition-transform duration-200 group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              Transfer ke Bank BRI 0555-0100-1126-567 a.n. Markaz Arabiyah. Transferlah persis
              sampai 3 digit terakhir sesuai total tagihan Anda (ada kode unik di dalamnya) agar
              validasi berjalan cepat, lalu konfirmasi ke WhatsApp admin di 0898-0837-788.
            </p>
          </details>
          <details className="card group">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-white [&::-webkit-details-marker]:hidden">
              Kapan dan di mana kelas berlangsung?
              <span className="ml-4 text-xl text-primary transition-transform duration-200 group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              Kelas berjalan selama periode program yang Anda pilih (satu bulan). Setiap sesi
              dilakukan melalui Zoom; link Zoom dibagikan melalui grup WhatsApp. Modul dan
              materi PDF tersedia di portal santri.
            </p>
          </details>
          <details className="card group">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-white [&::-webkit-details-marker]:hidden">
              Saya benar-benar pemula, program mana yang cocok?
              <span className="ml-4 text-xl text-primary transition-transform duration-200 group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              Tersedia program khusus pemula yang mulai dari dasar, misalnya E-Mubtadi. Baca
              deskripsi tiap program di atas, dan bila masih ragu, tanyakan ke admin via
              WhatsApp agar diarahkan ke level yang tepat.
            </p>
          </details>
          <details className="card group">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-white [&::-webkit-details-marker]:hidden">
              Bagaimana jika saya berhalangan hadir?
              <span className="ml-4 text-xl text-primary transition-transform duration-200 group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              Informasikan secepatnya kepada pengajar atau admin melalui WhatsApp. Materi PDF
              sesi tersebut tetap bisa Anda pelajari dari portal santri.
            </p>
          </details>
          <details className="card group">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-white [&::-webkit-details-marker]:hidden">
              Saya lupa username atau password portal, bagaimana?
              <span className="ml-4 text-xl text-primary transition-transform duration-200 group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              Hubungi admin via WhatsApp di 0898-0837-788, admin akan membantu memulihkan akun
              Anda.
            </p>
          </details>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="mx-auto max-w-6xl px-6 py-10 text-center">
        <p className="font-semibold text-white">E-Markaz &middot; Program Online Markaz Arabiyah</p>
        <p className="mt-2 text-sm text-gray-500">
          Pembayaran: Bank BRI 0555-0100-1126-567 a.n. Markaz Arabiyah &middot; Konfirmasi: WA
          0898-0837-788
        </p>
      </footer>
    </main>
  );
}
