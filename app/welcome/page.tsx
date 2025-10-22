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
import { getUserData } from "@/lib/user";
import { getUserLanguage } from "@/lib/locale";
import { getDictionary } from "@/lib/dictionaries";

export default async function WelcomePage() {
  const user = await getUserData();
  const userLanguage = await getUserLanguage();
  const dictionary = await getDictionary(userLanguage);
  
  const username = user?.first_name || user?.email || 'Guest';
  
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
      
      {/* Debug info */}
      <div className="max-w-4xl mx-auto mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-lg font-semibold">{dictionary.welcome_page.greeting} {username}!</p>
        <p className="text-sm text-gray-600 mt-2">
          Language from getUserLanguage(): <strong>{userLanguage}</strong>
        </p>
        <p className="text-sm text-gray-600">
          Language from user object: <strong>{user?.language || 'undefined'}</strong>
        </p>
        <p className="text-sm text-gray-600">
          User email: <strong>{user?.email || 'undefined'}</strong>
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {/* Card Administration */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
            <CardTitle>{dictionary.welcome_page.administration}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/welcome/admin" className="w-full mt-2">
              <Button variant="outline" className="w-full">
                {dictionary.welcome_page.access_administration}
              </Button>
            </Link>
          </CardContent>
        </Card>
        {/* Card Entreprise */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Building2 className="w-8 h-8 text-green-600" />
            <CardTitle>{dictionary.welcome_page.company}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/welcome/company" className="w-full mt-2">
              <Button variant="outline" className="w-full">
                {dictionary.welcome_page.access_company}
              </Button>
            </Link>
          </CardContent>
        </Card>
        {/* Card Projets */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <FolderKanban className="w-8 h-8 text-purple-600" />
            <CardTitle>{dictionary.welcome_page.projects}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/welcome/projects" className="w-full mt-2">
              <Button variant="outline" className="w-full">
                {dictionary.welcome_page.access_projects}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
