import { PrismaClient } from "@prisma/client";
import VerifyButton from "./VerifyButton";
import { FaExternalLinkAlt } from "react-icons/fa";

const prisma = new PrismaClient();

export default async function RekapAbsensiPengajar({ searchParams }: { searchParams: { programId?: string } }) {
  const programs = await prisma.program.findMany({
    where: { statusAktif: true },
    orderBy: { nama: 'asc' }
  });

  const selectedProgramId = searchParams.programId || (programs.length > 0 ? programs[0].id : null);

  let absensiData: any[] = [];

  if (selectedProgramId) {
    absensiData = await prisma.absensiPengajar.findMany({
      where: {
        sesi: {
          programId: selectedProgramId
        }
      },
      include: {
        sesi: true,
        pengajar: true
      },
      orderBy: {
        sesi: { tanggal: 'desc' }
      }
    });
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Verifikasi Absensi Pengajar</h1>
          <p className="text-gray-400">Pastikan screenshot kehadiran valid.</p>
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

      <div className="card table-wrapper">
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Pengajar</th>
              <th>Sesi & Tanggal</th>
              <th>Bukti SS</th>
              <th>Status Verifikasi</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
             {absensiData.length === 0 ? (
               <tr><td colSpan={6} className="text-center">Belum ada pengajar yang upload SS di program ini</td></tr>
             ) : (
               absensiData.map((item, index) => (
                 <tr key={item.id}>
                   <td>{index + 1}</td>
                   <td className="font-semibold text-white">{item.pengajar.username}</td>
                   <td>
                     <div className="text-blue-400 inline-block">Sesi {item.sesi.nomorSesi}: {item.sesi.judul}</div>
                     <div className="text-xs text-gray-400">{new Date(item.sesi.tanggal).toLocaleDateString('id-ID')}</div>
                   </td>
                   <td>
                     <a href={item.screenshotUrl} target="_blank" className="flex items-center gap-2 text-sm text-primary hover:underline">
                       <FaExternalLinkAlt /> Lihat Gambar
                     </a>
                   </td>
                   <td>
                     <span className={`badge ${
                       item.statusValidasi === 'VALID' ? 'badge-success' : 
                       item.statusValidasi === 'REJECTED' ? 'badge-danger' : 'badge-warning'
                     }`}>
                       {item.statusValidasi}
                     </span>
                   </td>
                   <td>
                     <VerifyButton id={item.id} statusValidasi={item.statusValidasi} pengajarName={item.pengajar.username} />
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
