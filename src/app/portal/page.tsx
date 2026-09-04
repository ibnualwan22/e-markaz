import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { FaGraduationCap, FaCalendarCheck, FaBook } from "react-icons/fa";
import Link from "next/link";

const prisma = new PrismaClient();

export default async function PortalDashboard() {
  const session = await getServerSession(authOptions);
  
  const santriData = await prisma.santri.findUnique({
    where: { userId: session?.user?.id },
    include: {
      pendaftaran: {
        include: {
          program: true,
          periode: true
        }
      },
      absensiSantri: {
        include: { sesi: true }
      }
    }
  });

  if (!santriData) return <div>Data santri tidak ditemukan</div>;

  const totalSesi = await prisma.sesiAbsensi.count({
    where: { programId: santriData.pendaftaran.programId }
  });
  
  const totalHadir = santriData.absensiSantri.filter(a => a.status === "HADIR").length;
  const totalMateri = await prisma.materi.count({
    where: { programId: santriData.pendaftaran.programId, isPublished: true }
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2 text-white">Dashboard Santri</h1>
      <p className="text-gray-400 mb-8">Selamat datang kembali, {santriData.pendaftaran.namaLengkap}!</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        <div className="card border-blue-500/20 bg-gradient-to-br from-surface to-blue-900/10 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4 text-blue-400">
              <FaGraduationCap className="text-2xl" />
              <h3 className="font-semibold text-lg uppercase tracking-wider">Program Aktif</h3>
            </div>
            <p className="text-3xl font-bold text-white mb-2">{santriData.pendaftaran.program.nama}</p>
            <p className="text-gray-400">{santriData.pendaftaran.periode.nama}</p>
          </div>
          <div className="mt-6 pt-4 border-t border-blue-500/20">
             <Link href="/portal/materi" className="text-sm font-semibold text-blue-400 hover:text-white transition-colors">Lihat modul & materi PDF &rarr;</Link>
          </div>
        </div>
        
        <div className="grid grid-rows-2 gap-6">
           <div className="card bg-surface-hover/50 p-5 flex items-center justify-between border-green-500/20">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 text-green-500 rounded-lg text-xl"><FaCalendarCheck /></div>
                <div>
                   <h4 className="text-gray-400 text-sm font-medium">Kehadiran Anda</h4>
                   <p className="text-xl font-bold text-white">{totalHadir} <span className="text-sm text-gray-500 font-normal">dari {totalSesi} sesi</span></p>
                </div>
             </div>
           </div>
           
           <div className="card bg-surface-hover/50 p-5 flex items-center justify-between border-purple-500/20">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 text-purple-500 rounded-lg text-xl"><FaBook /></div>
                <div>
                   <h4 className="text-gray-400 text-sm font-medium">Materi Tersedia</h4>
                   <p className="text-xl font-bold text-white">{totalMateri} <span className="text-sm text-gray-500 font-normal">dokumen PDF</span></p>
                </div>
             </div>
           </div>
        </div>

      </div>

      <div className="card">
        <h3 className="text-lg font-bold mb-4 text-white border-b border-border pb-2">Informasi Penting</h3>
        <ul className="text-sm text-gray-400 space-y-3 list-disc pl-5">
          <li>Setiap sesi pembelajaran dilakukan melalui Zoom. Link Zoom akan dibagikan via grup WhatsApp.</li>
          <li>Apabila Anda berhalangan hadir, segera informasikan kepada pengajar atau admin.</li>
          <li>Materi PDF dapat diunggah pengajar sebelum atau sesudah sesi berlangsung.</li>
        </ul>
      </div>
    </div>
  );
}
