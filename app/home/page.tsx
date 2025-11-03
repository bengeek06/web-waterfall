import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Building2, FolderKanban } from "lucide-react";
import Link from "next/link";
import { getUserData } from "@/lib/user";
import { getUserLanguage } from "@/lib/locale";
import { getDictionary } from "@/lib/dictionaries";
import { COLOR_CLASSES, ICON_SIZES } from "@/lib/design-tokens";

export default async function WelcomePage() {
  const user = await getUserData();
  const userLanguage = await getUserLanguage();
  const dictionary = await getDictionary(userLanguage);
  
  const displayName = user?.first_name || user?.email || 'Guest';
  
  return (
    <div>
      {/* Welcome message */}
      <div className="max-w-4xl mx-auto mb-8 text-center">
        <h1 className={`text-3xl font-bold ${COLOR_CLASSES.text.waterfallPrimaryDark}`}>
          {dictionary.welcome_page.greeting} {displayName}!
        </h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {/* Card Users Administration */}
        <Card className={`border-l-4 ${COLOR_CLASSES.border.waterfallUser} shadow-sm hover:shadow-md transition-shadow`}>
          <CardHeader className="flex flex-row items-center gap-3">
            <ShieldCheck className={`${ICON_SIZES.lg} ${COLOR_CLASSES.text.waterfallUser}`} />
            <CardTitle>{dictionary.welcome_page.administration}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/home/admin" className="w-full mt-2">
              <Button variant="outline" className="w-full">
                {dictionary.welcome_page.access_administration}
              </Button>
            </Link>
          </CardContent>
        </Card>
        {/* Card Company Settings */}
        <Card className={`border-l-4 ${COLOR_CLASSES.border.waterfallCompany} shadow-sm hover:shadow-md transition-shadow`}>
          <CardHeader className="flex flex-row items-center gap-3">
            <Building2 className={`${ICON_SIZES.lg} ${COLOR_CLASSES.text.waterfallCompany}`} />
            <CardTitle>{dictionary.welcome_page.company}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/home/company" className="w-full mt-2">
              <Button variant="outline" className="w-full">
                {dictionary.welcome_page.access_company}
              </Button>
            </Link>
          </CardContent>
        </Card>
        {/* Card Projects */}
        <Card className={`border-l-4 ${COLOR_CLASSES.border.waterfallProject} shadow-sm hover:shadow-md transition-shadow`}>
          <CardHeader className="flex flex-row items-center gap-3">
            <FolderKanban className={`${ICON_SIZES.lg} ${COLOR_CLASSES.text.waterfallProject}`} />
            <CardTitle>{dictionary.welcome_page.projects}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/home/projects" className="w-full mt-2">
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
