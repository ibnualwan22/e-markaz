import { prisma } from "@/lib/prisma";
import ExportExcelButton from "@/components/ExportExcelButton";
import EditKehadiran from "./EditKehadiran";

export default async function RekapAbsensiPengajar({ searchParams }: { searchParams: Promise<{ programId?: string }> }) {
  const resolvedParams = await searchParams;
  const programs = await prisma.program.findMany({
    where: { statusAktif: true },
    orderBy: { nama: 'asc' }
  });

  const selectedProgramId = resolvedParams.programId || (programs.length > 0 ? programs[0].id : null);

  let sesiList: any[] = [];
  let pengajarList: { id: string; username: string }[] = [];
  let ringkasan: { username: string; jumlah: number }[] = [];

  if (selectedProgramId) {
    sesiList = await prisma.sesiAbsensi.findMany({
      where: { programId: selectedProgramId },
      include: {
        absensiPengajars: { include: { pengajar: true } }
      },
      orderBy: { tanggal: 'desc' }
    });

    pengajarList = await prisma.user.findMany({
      where: { role: { name: "Pengajar" } },
      select: { id: true, username: true },
      orderBy: { username: 'asc' }
    });

    const grouped = await prisma.absensiPengajar.groupBy({
      by: ['pengajarId'],
      where: { sesi: { programId: selectedProgramId } },
      _count: { _all: true },
    });
    const namaById = new Map(pengajarList.map(p => [p.id, p.username]));
    ringkasan = grouped
      .map(g => ({ username: namaById.get(g.pengajarId) ?? g.pengajarId, jumlah: g._count._all }))
      .sort((a, b) => b.jumlah - a.jumlah);
  }

  const exportData = sesiList.flatMap((sesi) =>
    sesi.absensiPengajars.map((item: any) => ({
      "Nama Pengajar": item.pengajar.username,
      "Nomor Sesi": sesi.nomorSesi,
      "Judul Sesi": sesi.judul,
      "Tanggal": new Date(sesi.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    }))
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Rekap Absensi Pengajar</h1>
          <p className="text-gray-400">Kehadiran pengajar tercatat otomatis saat menyimpan absensi santri. Admin dapat menandai hadir / menghapus di sini.</p>
        </div>

        <div className="mt-4 md:mt-0 flex flex-wrap gap-2 items-center">
          <form className="flex gap-2">
             <select name="programId" defaultValue={selectedProgramId || ""} className="form-control max-w-sm w-full">
               {programs.map(p => (
                 <option key={p.id} value={p.id}>{p.nama}</option>
               ))}
             </select>
             <button type="submit" className="btn btn-primary">Filter</button>
          </form>
          <ExportExcelButton
            data={exportData}
            filename="Rekap_Absensi_Pengajar"
            sheetName="Pengajar_Absensi"
          />
        </div>
      </div>

      {selectedProgramId && ringkasan.length > 0 && (
        <div className="card mb-6">
          <h2 className="font-bold text-white mb-3">Jumlah Kehadiran per Pengajar (program ini)</h2>
          <div className="flex flex-wrap gap-2">
            {ringkasan.map(r => (
              <span key={r.username} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/20">
                {r.username} <span className="font-black">{r.jumlah} sesi</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {sesiList.length === 0 ? (
          <div className="card text-center text-gray-500">Belum ada sesi di program ini.</div>
        ) : (
          sesiList.map((sesi) => (
            <div key={sesi.id} className="card bg-surface/50">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 pb-3 border-b border-border">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="bg-primary/20 text-primary px-2 py-1 rounded text-sm">Sesi {sesi.nomorSesi}</span>
                    {sesi.judul}
                  </h2>
                  <p className="text-gray-400 mt-1 text-sm">{new Date(sesi.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
              <EditKehadiran
                sesiId={sesi.id}
                pengajars={pengajarList}
                hadir={sesi.absensiPengajars.map((a: any) => ({ id: a.id, pengajarId: a.pengajarId, username: a.pengajar.username }))}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
