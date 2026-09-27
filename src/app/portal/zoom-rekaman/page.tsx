import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FaVideo, FaPlayCircle, FaExternalLinkAlt } from "react-icons/fa";

export default async function PortalZoomRekaman() {
  const session = await getServerSession(authOptions);
  
  const santriData = await prisma.santri.findUnique({
    where: { userId: session?.user?.id },
    include: { pendaftaran: true }
  });

  if (!santriData) return <div>Data santri tidak ditemukan</div>;

  const program = await prisma.program.findUnique({
    where: { id: santriData.pendaftaran.programId },
    include: {
      sesiAbsensis: {
        orderBy: { nomorSesi: 'desc' }, // show latest session first
        include: {
          rekamanSesis: {
            orderBy: { createdAt: 'asc' }
          }
        }
      }
    }
  });

  if (!program) return <div>Program tidak ditemukan</div>;

  return (
    <div>
      <div className="mb-6 border-b border-border pb-4">
        <h1 className="text-3xl font-bold mb-2 text-white flex items-center gap-2">
          <FaVideo className="text-blue-500" /> Zoom & Rekaman Kelas
        </h1>
        <p className="text-gray-400">Akses cepat ke ruang Zoom utama program dan video siaran ulang.</p>
      </div>

      <div className="mb-10 text-center">
         <div className="card max-w-2xl mx-auto bg-gradient-to-r from-blue-900/40 to-blue-800/20 border-blue-500/30 p-8 shadow-2xl">
           <h2 className="text-2xl font-bold text-white mb-2">{program.nama}</h2>
           <p className="text-blue-300 mb-6 font-semibold">Tautan Zoom Utama Program Ini</p>
           {program.zoomUrl ? (
             <a href={program.zoomUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full text-lg font-bold transition-all shadow-lg shadow-blue-600/30 w-full sm:w-auto">
               <FaVideo size={24} /> Gabung Zoom Sekarang
             </a>
           ) : (
             <div className="p-4 bg-black/30 rounded-lg text-gray-400 inline-block">
                Admin belum mengatur URL Zoom untuk program ini.
             </div>
           )}
         </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-white mb-4 border-l-4 border-primary pl-3">Daftar Rekaman Sesi</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {program.sesiAbsensis.length === 0 ? (
             <div className="col-span-full p-8 text-center text-gray-500 bg-surface border border-dashed border-gray-700/50 rounded-lg">
               Belum ada data sesi untuk program ini.
             </div>
           ) : program.sesiAbsensis.map(sesi => (
             <div key={sesi.id} className="card bg-surface/50 border-gray-800/80 hover:border-gray-700 transition-colors p-5">
               <div className="mb-3">
                 <span className="text-xs font-bold bg-primary/20 text-primary px-2 py-0.5 rounded uppercase font-mono">Sesi {sesi.nomorSesi}</span>
               </div>
               <h3 className="font-bold text-lg text-white mb-1">{sesi.judul}</h3>
               <p className="text-sm text-gray-500 mb-4">{new Date(sesi.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

               <div className="space-y-2 mt-4 pt-4 border-t border-border">
                 {sesi.rekamanSesis.length === 0 ? (
                   <p className="text-sm text-gray-600 flex items-center justify-center py-4 italic">Belum ada tayangan rekaman.</p>
                 ) : (
                   sesi.rekamanSesis.map(rek => (
                     <a key={rek.id} href={rek.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-black/20 hover:bg-purple-900/20 border border-transparent hover:border-purple-500/30 rounded-lg transition-all group">
                        <FaPlayCircle className="text-purple-500 text-xl group-hover:scale-110 transition-transform" />
                        <span className="flex-1 text-sm font-semibold text-gray-300 group-hover:text-white truncate">{rek.judul}</span>
                        <FaExternalLinkAlt className="text-gray-600 group-hover:text-purple-400 text-xs" />
                     </a>
                   ))
                 )}
               </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
