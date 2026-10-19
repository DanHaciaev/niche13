import { requireAdmin } from "@/lib/admin/auth";
import { signOut } from "@/lib/admin/actions/auth";
import { Sidebar } from "@/components/admin/Sidebar";
import { PageTransition } from "@/components/admin/PageTransition";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const { count } = await admin.supabase
    .from("requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar email={admin.email} newRequests={count ?? 0} signOut={signOut} />
      <main className="min-w-0 flex-1 px-5 py-8 md:px-10 md:py-12 xl:px-14">
        <div className="mx-auto max-w-6xl">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
    </div>
  );
}
