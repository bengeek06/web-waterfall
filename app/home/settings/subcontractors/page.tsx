/**
 * Copyright (c) 2025 Waterfall
 * 
 * This source code is dual-licensed under:
 * - GNU Affero General Public License v3.0 (AGPLv3) for open source use
 * - Commercial License for proprietary use
 * 
 * See LICENSE and LICENSE.md files in the root directory for full license text.
 * For commercial licensing inquiries, contact: benjamin@waterfall-project.pro
 */

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Subcontractors from "@/components/pages/Subcontractors";
import { getDictionary } from "@/lib/utils/dictionaries";
import { getLocale } from "@/lib/utils/locale";

export default async function SubcontractorsPage() {
  const locale = await getLocale();
  await getDictionary(locale);
  
  // Dictionary pour le composant Subcontractors
  const subcontractorsDictionary = {
    page_title: "Sous-traitants",
    create_button: "Créer un sous-traitant",
    import_button: "Importer depuis",
    export_button: "Exporter vers",
    import_json: "JSON",
    import_csv: "CSV",
    export_json: "JSON",
    export_csv: "CSV",
    table_name: "Nom",
    table_email: "Email",
    table_contact: "Personne de contact",
    table_phone: "Téléphone",
    table_address: "Adresse",
    table_description: "Description",
    table_actions: "Actions",
    no_subcontractors: "Aucun sous-traitant",
    modal_create_title: "Créer un sous-traitant",
    modal_edit_title: "Modifier le sous-traitant",
    form_name: "Nom",
    form_name_required: "Nom *",
    form_email: "Email",
    form_contact: "Personne de contact",
    form_phone: "Téléphone",
    form_address: "Adresse",
    form_description: "Description",
    form_cancel: "Annuler",
    form_create: "Créer",
    form_save: "Enregistrer",
    delete_confirm_message: "Supprimer ce sous-traitant ?",
    error_fetch: "Erreur lors de la récupération des sous-traitants",
    error_create: "Erreur lors de la création du sous-traitant",
    error_update: "Erreur lors de la mise à jour du sous-traitant",
    error_delete: "Erreur lors de la suppression du sous-traitant",
    error_export: "Erreur lors de l'export",
    error_import: "Erreur lors de l'import",
    import_report_title: "Rapport d'import",
    import_report_close: "Fermer",
    import_report_total: "Total",
    import_report_success: "Réussis",
    import_report_failed: "Échecs",
    import_report_errors: "Erreurs",
    import_report_warnings: "Avertissements",
  };

  return (
    <main>
      <div className="flex justify-center mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/home">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/home/settings">Paramètres</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span>Sous-traitants</span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="max-w-6xl mx-auto">
        <Subcontractors dictionary={subcontractorsDictionary} />
      </div>
    </main>
  );
}
