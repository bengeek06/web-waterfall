import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users } from "lucide-react";
import { getDictionary } from "@/lib/dictionaries";


export default async function AdminPage() {
    const dictionary = await getDictionary('fr');
    
  return (
    <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Card Users */}
            <Card>
                <CardHeader className="flex flex-row items-center gap-3">
                    <Users className="w-8 h-8 text-blue-600" />
                    <CardTitle>{dictionary.users}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Link href="/welcome/admin/users" className="w-full mt-2">
                    <Button variant="outline" className="w-full">
                        {dictionary.manage_users || "Gérer les utilisateurs"}
                    </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}