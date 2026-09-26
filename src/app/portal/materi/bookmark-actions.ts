"use server";
import { prisma } from "@/lib/prisma";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";


export async function getBookmarks(materiId: string, includeTeacherBookmarks: boolean = false) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Unauthenticated" };
    }

    const whereClause: any = { materiId };
    
    if (includeTeacherBookmarks) {
       whereClause.OR = [
         { userId: session.user.id },
         { user: { role: { name: { in: ['ADMIN', 'PENGAJAR', 'GURU', 'SUPERADMIN'] } } } }
       ];
    } else {
       whereClause.userId = session.user.id;
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: whereClause,
      include: {
        user: { select: { username: true, role: { select: { name: true } } } }
      },
      orderBy: { halaman: 'asc' }
    });
    
    return { success: true, data: bookmarks };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createBookmark(materiId: string, halaman: number, judul: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Unauthenticated" };
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        materiId,
        halaman,
        judul,
        userId: session.user.id
      }
    });

    return { success: true, data: bookmark };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteBookmark(bookmarkId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Unauthenticated" };
    }

    const bookmark = await prisma.bookmark.findUnique({ where: { id: bookmarkId } });
    if (!bookmark) return { success: false, error: "Bookmark tidak ditemukan" };

    if (bookmark.userId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.bookmark.delete({ where: { id: bookmarkId } });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
