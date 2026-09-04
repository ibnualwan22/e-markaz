import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mime = file.type;
    const base64Data = buffer.toString('base64');
    const fileUri = `data:${mime};base64,${base64Data}`;

    // PDF harus pakai resource_type 'raw' agar URL bisa diakses langsung
    const isPdf = mime === "application/pdf";
    const uploadResponse = await cloudinary.uploader.upload(fileUri, {
      resource_type: isPdf ? "raw" : "image",
      folder: "emarkaz"
    });

    return NextResponse.json({ success: true, url: uploadResponse.secure_url });
  } catch (error: any) {
    console.error("Cloudinary Error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload" }, { status: 500 });
  }
}
