import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { fileId } = body;

    if (!fileId) {
      return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
    }

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

    // Get file record to find the file path
    const { data: fileRecord, error: selectError } = await supabase
      .from("event_files")
      .select("file_url, event_id")
      .eq("id", fileId)
      .maybeSingle();

    if (selectError || !fileRecord) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Extract file path from URL
    // URL format: https://{bucket}.supabase.co/storage/v1/object/public/event-files/{eventId}/{fileName}
    const urlParts = fileRecord.file_url.split("/event-files/");
    if (urlParts.length < 2) {
      return NextResponse.json({ error: "Invalid file URL" }, { status: 400 });
    }
    const filePath = `${fileRecord.event_id}/${urlParts[1]}`;

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from("event-files")
      .remove([filePath]);

    if (deleteError) {
      console.error("Storage delete error:", deleteError);
      // Continue anyway, delete from DB
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from("event_files")
      .delete()
      .eq("id", fileId);

    if (dbError) {
      console.error("Database delete error:", dbError);
      return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("File delete error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
