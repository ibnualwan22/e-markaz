import { prisma } from "@/lib/prisma";
import { FaUserGraduate, FaUsers, FaBookOpen, FaCalendarAlt } from "react-icons/fa";


export default async function DashboardOverview() {
  // Ambil periode aktif
  const activePeriode = await prisma.periode.findFirst({
    where: { statusAktif: true },
    orderBy: { createdAt: 'desc' }
  });

  const periodeFilter = activePeriode ? { periodeId: activePeriode.id } : {};

  const santriCount = await prisma.santri.count({
    where: {
      pendaftaran: periodeFilter
    }
  });
  const pendaftarCount = await prisma.pendaftaran.count({
    where: { status: "MENUNGGU", ...periodeFilter }
  });
  const programCount = await prisma.program.count({ where: { statusAktif: true } });

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
        {activePeriode ? (
          <div className="mt-2 md:mt-0 flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <FaCalendarAlt className="text-blue-400" />
            <span className="text-sm text-gray-300">Periode aktif:</span>
            <span className="text-sm font-bold text-blue-400">{activePeriode.nama}</span>
          </div>
        ) : (
          <div className="mt-2 md:mt-0 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <span className="text-sm text-yellow-400">⚠️ Tidak ada periode aktif</span>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card border-blue-500/20 bg-gradient-to-br from-surface to-blue-900/10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-500/20 rounded-lg text-blue-500 text-2xl">
              <FaUsers />
            </div>
            <div>
              <h3 className="text-gray-400 font-medium">Total Santri Aktif</h3>
              <p className="text-3xl font-bold mt-1 text-white">{santriCount}</p>
            </div>
          </div>
        </div>
        
        <div className="card border-yellow-500/20 bg-gradient-to-br from-surface to-yellow-900/10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-yellow-500/20 rounded-lg text-yellow-500 text-2xl">
              <FaUserGraduate />
            </div>
            <div>
              <h3 className="text-gray-400 font-medium">Pendaftar Menunggu</h3>
              <p className="text-3xl font-bold mt-1 text-yellow-500">{pendaftarCount}</p>
            </div>
          </div>
        </div>
        
        <div className="card border-green-500/20 bg-gradient-to-br from-surface to-green-900/10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-green-500/20 rounded-lg text-green-500 text-2xl">
              <FaBookOpen />
            </div>
            <div>
              <h3 className="text-gray-400 font-medium">Program Aktif</h3>
              <p className="text-3xl font-bold mt-1 text-green-500">{programCount}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
