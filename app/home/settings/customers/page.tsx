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
import Customers from "@/components/customers";
import { getDictionary } from "@/lib/dictionaries";
import { getLocale } from "@/lib/locale";

export default async function CustomersPage() {
  const locale = await getLocale();
  await getDictionary(locale);
  
  // Dictionary pour le composant Customers
  const customersDictionary = {
    page_title: "Clients",
    create_button: "Créer un client",
    import_button: "Importer",
    export_button: "Exporter",
    import_json: "Importer JSON",
    import_csv: "Importer CSV",
    export_json: "Exporter JSON",
    export_csv: "Exporter CSV",
    table_name: "Nom",
    table_email: "Email",
    table_contact: "Personne de contact",
    table_phone: "Téléphone",
    table_address: "Adresse",
    table_actions: "Actions",
    no_customers: "Aucun client",
    modal_create_title: "Créer un client",
    modal_edit_title: "Modifier le client",
    form_name: "Nom",
    form_name_required: "Nom *",
    form_email: "Email",
    form_contact: "Personne de contact",
    form_phone: "Téléphone",
    form_address: "Adresse",
    form_cancel: "Annuler",
    form_create: "Créer",
    form_save: "Enregistrer",
    delete_confirm_message: "Supprimer ce client ?",
    error_fetch: "Erreur lors de la récupération des clients",
    error_create: "Erreur lors de la création du client",
    error_update: "Erreur lors de la mise à jour du client",
    error_delete: "Erreur lors de la suppression du client",
    error_export: "Erreur lors de l'export",
    error_import: "Erreur lors de l'import",
    import_report_title: "Rapport d'import",
    import_report_close: "Fermer",
    import_report_total: "Total",
    import_report_success: "Succès",
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
              <span>Clients</span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="max-w-6xl mx-auto">
        <Customers dictionary={customersDictionary} />
      </div>
    </main>
  );
}
