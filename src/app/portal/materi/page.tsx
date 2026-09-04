import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import PdfViewer from "./PdfViewer";

const prisma = new PrismaClient();

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

  return <PdfViewer materiList={serialized} />;
}
