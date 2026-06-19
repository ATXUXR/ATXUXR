import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Btn } from "@/components/ui/Button";
import { PageHero } from "@/components/PageHero";
import { SubmitForm } from "./SubmitForm";

export const metadata = {
  title: "Submit a blog post",
  description: "Share your thoughts with the ATXUXR community.",
};

export default async function SubmitPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?auth=signin&next=/blog/submit");
  }

  const { data: member } = await supabase
    .from("members")
    .select("id, name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (!member) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "grid",
          placeItems: "center",
          padding: 40,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 460 }}>
          <h2 style={{ fontSize: 24, margin: "0 0 10px" }}>
            Join the community first
          </h2>
          <p style={{ fontSize: 16, color: "var(--fg-muted)", margin: "0 0 22px" }}>
            Complete your member profile to submit blog posts.
          </p>
          <a href="/community" style={{ textDecoration: "none" }}>
            <Btn>View community</Btn>
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHero
        title="Share your perspective"
        subtitle="Contribute to the ATXUXR blog"
      />
      <section style={{ background: "var(--bg)", minHeight: "60vh" }}>
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "40px 28px",
          }}
        >
          <SubmitForm member={member} />
        </div>
      </section>
    </>
  );
}
