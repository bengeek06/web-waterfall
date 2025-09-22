import { ColumnDef } from "@tanstack/react-table";

export type User = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  avatar_url?: string;
  is_active: boolean;
  is_verified: boolean;
  last_login_at?: string;
  created_at?: string;
};

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "first_name",
    header: "Prénom",
  },
  {
    accessorKey: "last_name",
    header: "Nom",
  },
  {
    accessorKey: "phone_number",
    header: "Téléphone",
  },
  {
    accessorKey: "is_active",
    header: "Actif",
    cell: ({ row }) => (row.original.is_active ? "Oui" : "Non"),
  },
  {
    accessorKey: "is_verified",
    header: "Vérifié",
    cell: ({ row }) => (row.original.is_verified ? "Oui" : "Non"),
  },
  {
    accessorKey: "last_login_at",
    header: "Dernière connexion",
  },
  {
    accessorKey: "created_at",
    header: "Créé le",
  },
  // Les actions (modifier/supprimer) seront ajoutées dans page.tsx via une colonne custom
];
