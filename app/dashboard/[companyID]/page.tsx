import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop";

export default async function Page({ params }: { params: { companyId: string } }) {
  const { companyId } = params;

  // Detect if running locally
  const isDev = process.env.NODE_ENV !== "production";

  let userId = "dev-user";
  let accessLevel: string = "admin";

  // Only run real auth when deployed
  if (!isDev) {
    try {
      const verified = await whopsdk.verifyUserToken(await headers());
      userId = verified.userId;

      const access = await whopsdk.users.checkAccess(companyId, { id: userId });

      accessLevel = access?.access_level ?? "none";

      if (accessLevel === "none") {
        return (
          <div style={{ padding: 20, fontFamily: "system-ui" }}>
            <h2>No Access</h2>
            <p>You don't have an active membership for this product.</p>
          </div>
        );
      }
    } catch (error) {
      return (
        <div style={{ padding: 20 }}>
          <h2>Authentication Error</h2>
          <p>Unable to verify user.</p>
        </div>
      );
    }
  }

  return (
    <div style={{ padding: 12, height: "100vh", boxSizing: "border-box" }}>
      <div style={{ marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>Apex Research Terminal</h2>
        <div style={{ opacity: 0.7, fontSize: 12 }}>
          Company: {companyId} | User: {userId} | Access: {accessLevel}
        </div>
      </div>

      <iframe
        src="/research/index.html"
        style={{
          width: "100%",
          height: "calc(100vh - 60px)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 12,
          background: "white",
        }}
        title="Research Terminal"
      />
    </div>
  );
}
