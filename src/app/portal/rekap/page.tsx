import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Fragment } from "react";

export default async function RekapKehadiranSantri() {
  const session = await getServerSession(authOptions);
  
  const santriData = await prisma.santri.findUnique({
    where: { userId: session?.user?.id },
    include: { pendaftaran: true, absensiSantri: true }
  });

  if (!santriData) return <div>Data santri tidak ditemukan</div>;

  const programId = santriData.pendaftaran.programId;
  const program = await prisma.program.findUnique({
    where: { id: programId },
    include: {
      sesiAbsensis: { orderBy: { tanggal: 'asc' } }
    }
  });

  if (!program) return <div>Program tidak ditemukan</div>;

  let groupedSesi: { date: string, sessions: any[] }[] = [];
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

  const attendanceMap: Record<string, any> = {};
  let hadir = 0; let izin = 0; let sakit = 0; let alpa = 0;
  santriData.absensiSantri.forEach(a => {
    attendanceMap[a.sesiId] = a;
  });
  
  const totalSesi = program.sesiAbsensis.length;
  program.sesiAbsensis.forEach(sesi => {
    const abs = attendanceMap[sesi.id];
    const st = abs ? abs.status : "ALPA";
    if (st === "HADIR") hadir++;
    else if (st === "IZIN") izin++;
    else if (st === "SAKIT") sakit++;
    else alpa++;
  });

  const percentage = totalSesi === 0 ? 0 : Math.round((hadir / totalSesi) * 100);

  const rowData: Record<string, any> = {
    "Nama Santri": santriData.pendaftaran.namaLengkap,
  };
  groupedSesi.forEach(group => {
    group.sessions.forEach(sesi => {
      const abs = attendanceMap[sesi.id];
      const status = abs ? abs.status : "ALPA";
      const time = abs ? new Date(abs.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : "";
      rowData[`${group.date} (Sesi ${sesi.nomorSesi})`] = `${status} ${time ? `(${time})` : ''}`.trim();
    });
  });
  rowData["Hadir"] = hadir;
  rowData["Izin"] = izin;
  rowData["Sakit"] = sakit;
  rowData["Alpa"] = alpa;
  rowData["Total Kehadiran %"] = `${percentage}%`;

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Rekap Absensi Saya</h1>
          <p className="text-gray-400">Tampilan matriks kehadiran di program {program.nama}.</p>
        </div>
      </div>

      <div className="card w-full overflow-x-auto p-0">
        <table className="w-full min-w-max text-sm text-left">
          <thead className="bg-surface sticky top-0 z-10 shadow">
            <tr>
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
            <tr className="hover:bg-surface-hover/30 transition-colors">
              <td className="px-4 py-3 border-b border-r border-border/50 font-semibold text-white">{santriData.pendaftaran.namaLengkap}</td>
              
              {groupedSesi.map((group, groupIdx) => (
                <Fragment key={groupIdx}>
                  {group.sessions.map((sesi) => {
                    const abs = attendanceMap[sesi.id];
                    const st = abs ? abs.status : "ALPA";
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
                    <div className="flex justify-between w-full px-2 max-w-[120px] mx-auto text-green-500 bg-green-500/10 rounded-sm">Hadir: <span>{hadir}</span></div>
                    <div className="flex justify-between w-full px-2 max-w-[120px] mx-auto text-purple-400 bg-purple-400/10 rounded-sm">Izin: <span>{izin}</span></div>
                    <div className="flex justify-between w-full px-2 max-w-[120px] mx-auto text-yellow-500 bg-yellow-500/10 rounded-sm">Sakit: <span>{sakit}</span></div>
                    <div className="flex justify-between w-full px-2 max-w-[120px] mx-auto text-red-500 bg-red-500/10 rounded-sm">Alpa: <span>{alpa}</span></div>
                  </div>
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
