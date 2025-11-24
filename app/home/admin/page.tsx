import React from "react";
import { getDictionary } from "@/lib/dictionaries";
import { getUserLanguage } from "@/lib/locale";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AdminCards } from "@/components/cards/AdminCards";


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
      <AdminCards dictionary={dictionary.admin_page} />
    </div>
  );
}