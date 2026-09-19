"use server";
import { prisma } from "@/lib/prisma";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";


const userSelectArg = {
  username: true,
  role: { select: { name: true } },
  santri: {
    select: {
      pendaftaran: {
        select: {
          namaLengkap: true
        }
      }
    }
  }
};

export async function getAnnotations(materiId: string, halaman: number, periodeId: string) {
  try {
    const annotations = await prisma.annotation.findMany({
      where: { 
        materiId, 
        halaman,
        periodeId
      },
      include: {
        user: { select: userSelectArg }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    return { success: true, data: annotations };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function saveAnnotation(materiId: string, halaman: number, periodeId: string, tipe: string, data: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Unauthenticated" };
    }
    
    const role = typeof session.user.role === 'string' ? session.user.role.toUpperCase() : ((session.user.role as any)?.name?.toUpperCase() || "");
    const isAdmin = role.includes('ADMIN') || role.includes('PENGAJAR') || role.includes('GURU');
    if (!isAdmin) {
      return { success: false, error: "Unauthorized (Only Admin can annotate)" };
    }

    const annotation = await prisma.annotation.create({
      data: {
        materiId,
        periodeId,
        halaman,
        tipe,
        data,
        userId: session.user.id
      },
      include: {
        user: { select: userSelectArg }
      }
    });

    try {
       // fire the pusher event so santri (and other admins) can see the stroke in real-time
       // ensure the channel name uses periodeId as well to avoid conflicts
       await pusherServer.trigger(`materi-${materiId}-hal-${halaman}-periode-${periodeId}`, 'new-annotation', annotation);
    } catch (pushErr) {
       console.error("Pusher trigger failed:", pushErr);
    }

    return { success: true, data: annotation };
  } catch (error: any) {
    console.error("saveAnnotation error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteAnnotation(annotationId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Unauthenticated" };
    }

    const annotation = await prisma.annotation.findUnique({ where: { id: annotationId } });
    if (!annotation) return { success: false, error: "Anotasi tidak ditemukan" };

    const role = typeof session.user.role === 'string' ? session.user.role.toUpperCase() : ((session.user.role as any)?.name?.toUpperCase() || "");
    const isAdmin = role.includes('ADMIN') || role.includes('PENGAJAR') || role.includes('GURU');
    if (!isAdmin && annotation.userId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.annotation.delete({ where: { id: annotationId } });
    
    try {
      await pusherServer.trigger(`materi-${annotation.materiId}-hal-${annotation.halaman}-periode-${annotation.periodeId}`, 'delete-annotation', { id: annotationId });
    } catch (pushErr) {
      console.error("Pusher trigger failed:", pushErr);
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
