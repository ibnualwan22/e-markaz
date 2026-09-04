import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { FaCheck, FaTimes, FaExclamationCircle } from "react-icons/fa";

const prisma = new PrismaClient();

export default async function PortalAbsensi() {
  const session = await getServerSession(authOptions);
  
  const santriData = await prisma.santri.findUnique({
    where: { userId: session?.user?.id },
    include: { pendaftaran: true }
  });

  if (!santriData) return <div>Data santri tidak ditemukan</div>;

  const sesiList = await prisma.sesiAbsensi.findMany({
    where: { programId: santriData.pendaftaran.programId },
    include: {
      absensiSantris: {
        where: { santriId: santriData.id }
      }
    },
    orderBy: { tanggal: 'desc' }
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2 text-white">Riwayat Absensi</h1>
      <p className="text-gray-400 mb-8">Data kehadiran Anda setiap sesi pertemuan.</p>

      <div className="card table-wrapper bg-surface/80">
        <table>
          <thead>
            <tr>
              <th>No Sesi</th>
              <th>Nama Pertemuan & Tanggal</th>
              <th>Status Kehadiran</th>
            </tr>
          </thead>
          <tbody>
            {sesiList.length === 0 ? (
              <tr><td colSpan={3} className="text-center text-gray-500">Belum ada sesi pertemuan.</td></tr>
            ) : sesiList.map((sesi) => {
              const abs = sesi.absensiSantris[0];
              const status = abs ? abs.status : "ALPA";

              return (
                <tr key={sesi.id}>
                  <td className="w-24">
                     <span className="font-bold text-gray-400 border border-border px-3 py-1 rounded">
                       #{sesi.nomorSesi}
                     </span>
                  </td>
                  <td>
                    <div className="font-semibold text-white">{sesi.judul}</div>
                    <div className="text-xs text-gray-500">{new Date(sesi.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                  </td>
                  <td>
                    {status === "HADIR" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-500 border border-green-500/20">
                        <FaCheck /> HADIR
                      </span>
                    )}
                    {status === "ALPA" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-500 border border-red-500/20">
                        <FaTimes /> TIDAK MASUK (ALPA)
                      </span>
                    )}
                    {status === "IZIN" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-500 border border-yellow-500/20">
                        <FaExclamationCircle /> IZIN
                      </span>
                    )}
                    {status === "SAKIT" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-500 border border-orange-500/20">
                        <FaExclamationCircle /> SAKIT
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 text-sm text-gray-500 bg-black/20 p-4 border border-border rounded-lg">
         * Jika Anda merasa status kehadiran tidak sesuai, silakan hubungi admin atau pengajar kelas Anda.
      </div>
    </div>
  );
}
