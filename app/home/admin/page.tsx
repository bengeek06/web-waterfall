import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { KeyRound, Users } from "lucide-react";
import { getDictionary } from "@/lib/dictionaries";
import { getUserLanguage } from "@/lib/locale";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";


export default async function AdminPage() {
    const userLanguage = await getUserLanguage();
    const dictionary = await getDictionary(userLanguage);
    
  return (
    <div>
      <div className="flex justify-center mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/home">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span>Administration</span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Card Users */}
            <Card>
                <CardHeader className="flex flex-row items-center gap-3">
                    <Users className="w-8 h-8 text-blue-600" />
                    <CardTitle>{dictionary.admin_page.users}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Link href="/home/admin/users" className="w-full mt-2">
                    <Button variant="outline" className="w-full">
                        {dictionary.admin_page.manage_users}
                    </Button>
                    </Link>
                </CardContent>
            </Card>
            {/* Card Roles */}
            <Card>
                <CardHeader className="flex flex-row items-center gap-3">
                    <KeyRound className="w-8 h-8 text-green-600" />
                    <CardTitle>{dictionary.admin_page.roles}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Link href="/home/admin/roles" className="w-full mt-2">
                    <Button variant="outline" className="w-full">
                        {dictionary.admin_page.manage_roles}
                    </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}