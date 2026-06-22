import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: member } = await supabase
      .from("members")
      .select("admin")
      .eq("id", user.id)
      .maybeSingle();

    if (!member?.admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const eventId = formData.get("eventId") as string;

    if (!file || !eventId) {
      return NextResponse.json({ error: "Missing file or eventId" }, { status: 400 });
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
    }

    // Upload file to Supabase storage
    const fileName = `${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("event-files")
      .upload(`${eventId}/${fileName}`, file);

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage
      .from("event-files")
      .getPublicUrl(`${eventId}/${fileName}`);

    // Store file metadata in database
    const { data: fileRecord, error: dbError } = await supabase
      .from("event_files")
      .insert({
        event_id: eventId,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file_url: publicUrl,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database insert error:", dbError);
      return NextResponse.json({ error: "Failed to save file metadata" }, { status: 500 });
    }

    return NextResponse.json(fileRecord, { status: 201 });
  } catch (err) {
    console.error("File upload error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
