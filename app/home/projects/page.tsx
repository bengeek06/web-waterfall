import { getDictionary } from "@/lib/utils/dictionaries";
import { getUserLanguage } from "@/lib/utils/locale";
import PageBreadcrumb from "@/components/shared/PageBreadcrumb";

export default async function ProjectsPage() {
  const userLanguage = await getUserLanguage();
  const dictionary = await getDictionary(userLanguage);

  return (
    <main>
      <PageBreadcrumb
        pathname="/home/projects"
        dictionary={dictionary.breadcrumb}
      />
      {/* Page projets vide */}
    </main>
  );
}