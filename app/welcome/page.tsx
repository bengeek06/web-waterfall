import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Building2, FolderKanban } from "lucide-react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
} from "@/components/ui/breadcrumb";

export default async function WelcomePage() {
  return (
    <div>
      <div className="flex justify-center mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <span>Welcome</span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {/* Card Administration */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
            <CardTitle>Administration</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/welcome/admin" className="w-full mt-2">
              <Button variant="outline" className="w-full">
                Accéder à l&#39;administration
              </Button>
            </Link>
          </CardContent>
        </Card>
        {/* Card Entreprise */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Building2 className="w-8 h-8 text-green-600" />
            <CardTitle>Entreprise</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/welcome/company" className="w-full mt-2">
              <Button variant="outline" className="w-full">
                Accéder à l&#39;entreprise
              </Button>
            </Link>
          </CardContent>
        </Card>
        {/* Card Projets */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <FolderKanban className="w-8 h-8 text-purple-600" />
            <CardTitle>Projets</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/welcome/projects" className="w-full mt-2">
              <Button variant="outline" className="w-full">
                Accéder aux projets
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
