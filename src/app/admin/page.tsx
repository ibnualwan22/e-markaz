import { PrismaClient } from "@prisma/client";
import { FaUserGraduate, FaUsers, FaBookOpen } from "react-icons/fa";

const prisma = new PrismaClient();

export default async function DashboardOverview() {
  const santriCount = await prisma.santri.count();
  const pendaftarCount = await prisma.pendaftaran.count({ where: { status: "MENUNGGU" } });
  const programCount = await prisma.program.count({ where: { statusAktif: true } });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-white">Dashboard Overview</h1>
      
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
