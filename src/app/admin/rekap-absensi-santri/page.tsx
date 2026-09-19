import { prisma } from "@/lib/prisma";
import { FaBookOpen } from "react-icons/fa";
import { Fragment } from "react";


// This is a Server Component, meaning data fetching is super fast and zero client JS for the rekap logic
export default async function RekapAbsensiSantri({ searchParams }: { searchParams: Promise<{ programId?: string }> }) {
  const resolvedParams = await searchParams;
  const programs = await prisma.program.findMany({
    where: { statusAktif: true },
    orderBy: { nama: 'asc' }
  });

  const selectedProgramId = resolvedParams.programId || (programs.length > 0 ? programs[0].id : null);

  let rekapData: any[] = [];
  let programName = "";
  let groupedSesi: { date: string, sessions: any[] }[] = [];
  let totalSesi = 0;

  if (selectedProgramId) {
    const program = await prisma.program.findUnique({
      where: { id: selectedProgramId },
      include: {
        sesiAbsensis: {
          orderBy: { tanggal: 'asc' }
        },
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

      // Group sessions by date
      const sesiByDate: Record<string, any[]> = {};
      program.sesiAbsensis.forEach(sesi => {
        const dStr = new Date(sesi.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
        if (!sesiByDate[dStr]) sesiByDate[dStr] = [];
        sesiByDate[dStr].push(sesi);
      });

      groupedSesi = Object.keys(sesiByDate).map(date => ({
        date,
        sessions: sesiByDate[date].sort((a: any, b: any) => a.nomorSesi - b.nomorSesi)
      }));

      // Map santri data
      rekapData = program.pendaftarans.map(pendaftaran => {
        const santri = pendaftaran.santri;
        if (!santri) return null;

        const attendanceMap: Record<string, any> = {};
        
        let hadir = 0; let izin = 0; let sakit = 0; let alpa = 0;
        
        santri.absensiSantri.forEach(a => {
          attendanceMap[a.sesiId] = a;
        });
        
        program.sesiAbsensis.forEach(sesi => {
          const abs = attendanceMap[sesi.id];
          const st = abs ? abs.status : "ALPA";
          if (st === "HADIR") hadir++;
          else if (st === "IZIN") izin++;
          else if (st === "SAKIT") sakit++;
          else alpa++;
        });

        const percentage = totalSesi === 0 ? 0 : Math.round((hadir / totalSesi) * 100);

        return {
          nama: pendaftaran.namaLengkap,
          attendanceMap,
          id: pendaftaran.id,
          hadir, izin, sakit, alpa, percentage
        };
      }).filter(Boolean);
    }
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Rekap Absensi Santri</h1>
          <p className="text-gray-400">Tampilan harian terperinci sesi program.</p>
        </div>
        
        <form className="mt-4 md:mt-0 flex gap-2">
           <select name="programId" defaultValue={selectedProgramId || ""} className="form-control max-w-sm w-full">
             {programs.map(p => (
               <option key={p.id} value={p.id}>{p.nama}</option>
             ))}
           </select>
           <button type="submit" className="btn btn-primary">Filter</button>
        </form>
      </div>

      <div className="card w-full overflow-x-auto p-0">
        <table className="w-full min-w-max text-sm text-left">
          <thead className="bg-surface sticky top-0 z-10 shadow">
            <tr>
              <th rowSpan={2} className="px-4 py-3 border-b border-r border-border min-w-[50px] font-bold text-center">No</th>
              <th rowSpan={2} className="px-4 py-3 border-b border-r border-border min-w-[250px] font-bold">NAMA SANTRI</th>
              {groupedSesi.length === 0 && (
                 <th className="px-4 py-3 border-b border-border">Data Sesi</th>
              )}
              {groupedSesi.map((group, i) => (
                <th key={i} colSpan={group.sessions.length} className="px-4 py-2 border-b border-r border-border text-center font-bold">
                  {group.date}
                </th>
              ))}
              {groupedSesi.length > 0 && (
                <th rowSpan={2} className="px-4 py-3 border-b border-l-4 border-l-blue-500 border-r border-border min-w-[120px] font-bold text-center bg-blue-500/10">AKUMULASI</th>
              )}
            </tr>
            <tr>
              {groupedSesi.map((group, groupIdx) => (
                <Fragment key={groupIdx}>
                  {group.sessions.map((sesi, i) => (
                    <th key={sesi.id} className="px-2 py-2 border-b border-r border-border text-center font-semibold text-gray-400 w-12">
                      {i + 1}
                    </th>
                  ))}
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
             {rekapData.length === 0 ? (
               <tr><td colSpan={10} className="text-center p-4">Belum ada data pendaftar/sesi di program ini</td></tr>
             ) : (
               rekapData.map((item, index) => (
                 <tr key={item.id} className="hover:bg-surface-hover/30 transition-colors">
                   <td className="px-4 py-3 border-b border-r border-border/50 text-center">{index + 1}</td>
                   <td className="px-4 py-3 border-b border-r border-border/50 font-semibold text-white">{item.nama}</td>
                   
                   {groupedSesi.map((group, groupIdx) => (
                     <Fragment key={groupIdx}>
                       {group.sessions.map((sesi) => {
                         const abs = item.attendanceMap[sesi.id];
                         const st = abs ? abs.status : "ALPA"; // Default implicit Alpa if missed
                         const timeStr = abs ? new Date(abs.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : "-";
                         
                         return (
                           <td key={sesi.id} className="px-1 py-2 border-b border-r border-border/50 text-center hover:bg-white/5 transition-colors">
                             <div className="flex flex-col items-center justify-center gap-1">
                               {st === "HADIR" && <span className="text-green-500 font-bold text-base">✔</span>}
                               {st === "ALPA" && <span className="text-red-500 font-bold text-base">✘</span>}
                               {st === "IZIN" && <span className="text-purple-400 font-bold text-base">I</span>}
                               {st === "SAKIT" && <span className="text-yellow-500 font-bold text-base">S</span>}
                               <span className="text-[9px] text-gray-500">{timeStr !== "-" ? timeStr : ""}</span>
                             </div>
                           </td>
                         )
                       })}
                     </Fragment>
                   ))}
                   {groupedSesi.length > 0 && (
                     <td className="px-2 py-2 border-b border-l-4 border-l-blue-500 border-r border-border/50 text-center bg-blue-500/5 p-1 align-top relative">
                        <div className="flex flex-col gap-1 text-xs font-semibold w-full mt-1">
                          <div className="flex justify-between w-full px-2 max-w-[120px] mx-auto text-green-500 bg-green-500/10 rounded-sm">Hadir: <span>{item.hadir}</span></div>
                          <div className="flex justify-between w-full px-2 max-w-[120px] mx-auto text-purple-400 bg-purple-400/10 rounded-sm">Izin: <span>{item.izin}</span></div>
                          <div className="flex justify-between w-full px-2 max-w-[120px] mx-auto text-yellow-500 bg-yellow-500/10 rounded-sm">Sakit: <span>{item.sakit}</span></div>
                          <div className="flex justify-between w-full px-2 max-w-[120px] mx-auto text-red-500 bg-red-500/10 rounded-sm">Alpa: <span>{item.alpa}</span></div>
                        </div>
                     </td>
                   )}
                 </tr>
               ))
             )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
