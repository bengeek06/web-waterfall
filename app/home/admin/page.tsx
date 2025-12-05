import React from "react";
import { getDictionary } from "@/lib/utils/dictionaries";
import { getUserLanguage } from "@/lib/utils/locale";
import PageBreadcrumb from "@/components/shared/PageBreadcrumb";
import { AdminCards } from "@/components/cards/AdminCards";


export default async function AdminPage() {
    const userLanguage = await getUserLanguage();
    const dictionary = await getDictionary(userLanguage);
    
  return (
    <div>
      <PageBreadcrumb
        pathname="/home/admin"
        dictionary={dictionary.breadcrumb}
      />
      <AdminCards dictionary={dictionary.admin_page} />
    </div>
  );
}