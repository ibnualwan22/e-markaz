import { PrismaClient } from "@prisma/client";
import { FaBookOpen } from "react-icons/fa";

const prisma = new PrismaClient();

// This is a Server Component, meaning data fetching is super fast and zero client JS for the rekap logic
export default async function RekapAbsensiSantri({ searchParams }: { searchParams: { programId?: string } }) {
  const programs = await prisma.program.findMany({
    where: { statusAktif: true },
    orderBy: { nama: 'asc' }
  });

  const selectedProgramId = searchParams.programId || (programs.length > 0 ? programs[0].id : null);

  let rekapData: any[] = [];
  let programName = "";
  let totalSesi = 0;

  if (selectedProgramId) {
    const program = await prisma.program.findUnique({
      where: { id: selectedProgramId },
      include: {
        sesiAbsensis: true,
        pendaftarans: {
          where: { status: "DITERIMA" },
          include: { 
            santri: { 
              include: { absensiSantri: true } 
            } 
          }
        }
      }
    });

    if (program) {
      programName = program.nama;
      totalSesi = program.sesiAbsensis.length;

      // Calculate rekap for each santri based on active sessions
      rekapData = program.pendaftarans.map(pendaftaran => {
        const santri = pendaftaran.santri;
        if (!santri) return null;

        let hadir = 0;
        let izin = 0;
        let sakit = 0;
        let countedAlpa = 0; // only count ALPA for active sessions

        program.sesiAbsensis.forEach(sesi => {
          const abs = santri.absensiSantri.find(a => a.sesiId === sesi.id);
          if (abs) {
            if (abs.status === "HADIR") hadir++;
            else if (abs.status === "IZIN") izin++;
            else if (abs.status === "SAKIT") sakit++;
            else if (abs.status === "ALPA") countedAlpa++; // Explicit marked ALPA
          } else {
            // If session exists but no attendance record is made for santri, treat as ALPA implicitly
            // "santri terhitung alpa/tidak masuk hanya saat ada sesi yg aktif"
            countedAlpa++;
          }
        });

        // Persentase Kehadiran
        const percentage = totalSesi === 0 ? 0 : Math.round((hadir / totalSesi) * 100);

        return {
          nama: pendaftaran.namaLengkap,
          gender: pendaftaran.jenisKelamin,
          hadir,
          izin,
          sakit,
          alpa: countedAlpa,
          percentage
        };
      }).filter(Boolean);
    }
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Rekap Absensi Santri</h1>
          <p className="text-gray-400">Total Sesi Aktif: <b className="text-blue-400">{totalSesi} Pertemuan</b></p>
        </div>
        
        {/* Simple navigation form since it's Server Component */}
        <form className="mt-4 md:mt-0 flex gap-2">
           <select name="programId" defaultValue={selectedProgramId || ""} className="form-control max-w-sm w-full">
             {programs.map(p => (
               <option key={p.id} value={p.id}>{p.nama}</option>
             ))}
           </select>
           <button type="submit" className="btn btn-primary">Filter</button>
        </form>
      </div>

      <div className="card table-wrapper">
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Santri</th>
              <th className="text-center">Hadir</th>
              <th className="text-center">Izin</th>
              <th className="text-center">Sakit</th>
              <th className="text-center">Alpa</th>
              <th className="text-center">% Kehadiran</th>
            </tr>
          </thead>
          <tbody>
             {rekapData.length === 0 ? (
               <tr><td colSpan={7} className="text-center">Belum ada data pendaftar/santri di program ini (atau belum pilih program)</td></tr>
             ) : (
               rekapData.sort((a,b) => b.percentage - a.percentage).map((item, index) => (
                 <tr key={index}>
                   <td>{index + 1}</td>
                   <td className="font-semibold text-white">{item.nama}</td>
                   <td className="text-center font-bold text-green-500">{item.hadir}</td>
                   <td className="text-center text-yellow-500">{item.izin}</td>
                   <td className="text-center text-orange-500">{item.sakit}</td>
                   <td className="text-center text-red-500">{item.alpa}</td>
                   <td className="text-center">
                     <span className={`badge ${
                       item.percentage >= 80 ? 'badge-success' : 
                       item.percentage >= 50 ? 'badge-warning' : 'badge-danger'
                     }`}>
                       {item.percentage}%
                     </span>
                   </td>
                 </tr>
               ))
             )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
