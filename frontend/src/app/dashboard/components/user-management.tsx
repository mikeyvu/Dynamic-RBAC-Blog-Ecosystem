import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";

interface UserManagementProps {
  isAdmin: boolean;
}

export default function UserManagement({ isAdmin }: UserManagementProps) {
  if (!isAdmin) return null;

  return (
    /* --- TAB CONTENT: USERS MANAGEMENT (only Admin can access) --- */
    <TabsContent value="users">
      <Card className="border-amber-200 bg-amber-50/30">
        <CardHeader>
          <CardTitle className="text-amber-800">
            🛡️ User Management Tab
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border bg-white p-4 space-y-2">
            <p className="text-sm font-medium text-slate-700">
              Dữ liệu tài khoản trong hệ thống:
            </p>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
              <li>
                admin@gmail.com -{" "}
                <span className="badge bg-slate-100 px-1 rounded text-xs font-bold text-amber-700">
                  ADMIN
                </span>
              </li>
              <li>
                author_mikey@gmail.com -{" "}
                <span className="badge bg-slate-100 px-1 rounded text-xs font-bold text-blue-700">
                  AUTHOR
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
