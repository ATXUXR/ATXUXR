import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Create required Supabase Storage buckets if they don't exist
const REQUIRED_BUCKETS = [
  { name: "covers", public: true },
  { name: "avatars", public: true },
  { name: "events", public: true },
];

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // Check admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: member } = await supabase
    .from("members")
    .select("admin")
    .eq("id", user.id)
    .single();

  if (!member?.admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const results = [];

  for (const bucket of REQUIRED_BUCKETS) {
    try {
      // Check if bucket exists
      const { data: existing } = await supabase.storage.listBuckets();
      const bucketExists = existing?.some((b) => b.name === bucket.name);

      if (!bucketExists) {
        // Create bucket
        const { data: created, error } = await supabase.storage.createBucket(
          bucket.name,
          { public: bucket.public }
        );

        if (error) {
          results.push({
            bucket: bucket.name,
            status: "error",
            message: error.message,
          });
        } else {
          results.push({
            bucket: bucket.name,
            status: "created",
          });
        }
      } else {
        results.push({
          bucket: bucket.name,
          status: "exists",
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      results.push({
        bucket: bucket.name,
        status: "error",
        message,
      });
    }
  }

  return NextResponse.json({
    message: "Bucket setup complete",
    results,
  });
}
