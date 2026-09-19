import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PdfViewer from "./PdfViewer";


export default async function PortalMateri() {
  const session = await getServerSession(authOptions);
  
  const santriData = await prisma.santri.findUnique({
    where: { userId: session?.user?.id },
    include: { pendaftaran: true }
  });

  if (!santriData) return <div>Data santri tidak ditemukan</div>;

  const materiList = await prisma.materi.findMany({
    where: { 
      programId: santriData.pendaftaran.programId,
      isPublished: true 
    },
    orderBy: { createdAt: 'desc' }
  });

  const serialized = materiList.map(m => ({
    id: m.id,
    judul: m.judul,
    deskripsi: m.deskripsi,
    fileUrl: m.fileUrl,
    createdAt: m.createdAt.toISOString()
  }));

  const currentUser = {
    id: session?.user?.id || "",
    username: session?.user?.name || "Guest",
    role: session?.user?.role || "SANTRI",
    periodeId: santriData.pendaftaran.periodeId
  };

  return <PdfViewer materiList={serialized} currentUser={currentUser} />;
}
