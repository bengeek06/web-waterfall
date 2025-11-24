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

// ==================== TYPES ====================

/**
 * Représente une permission unique
 */
export interface Permission {
  service: string;    // "identity", "guardian", etc.
  resource: string;   // "users", "roles", "policies", etc.
  action: string;     // "list", "create", "update", "delete", "read"
}

/**
 * Condition de permission unique
 */
export interface PermissionCondition {
  readonly service: string;
  readonly resource: string;
  readonly action: string;
}

/**
 * Groupe de conditions combinées par AND
 */
export type PermissionAndGroup = readonly PermissionCondition[];

/**
 * Conditions combinées par OR (tableau de groupes AND)
 * Exemple: [[condA, condB], [condC]] signifie (condA AND condB) OR condC
 */
export type PermissionRequirements = readonly PermissionAndGroup[];

// ==================== UTILS ====================

/**
 * Vérifie si une permission correspond à une condition
 */
export function matchesPermission(
  permission: Permission,
  condition: PermissionCondition
): boolean {
  const matches = (
    permission.service === condition.service &&
    permission.resource === condition.resource &&
    permission.action === condition.action
  );
  
  return matches;
}

/**
 * Vérifie si un groupe AND de conditions est satisfait
 */
export function checkAndGroup(
  permissions: Permission[],
  andGroup: PermissionAndGroup
): boolean {
  return andGroup.every((condition) =>
    permissions.some((permission) => matchesPermission(permission, condition))
  );
}

/**
 * Vérifie si les requirements (avec OR/AND) sont satisfaits
 * @param permissions - Liste des permissions de l'utilisateur
 * @param requirements - Tableau de groupes AND combinés par OR
 * @returns true si au moins un groupe AND est satisfait
 */
export function checkPermissions(
  permissions: Permission[],
  requirements: PermissionRequirements
): boolean {
  // Si pas de requirements, toujours autorisé
  if (requirements.length === 0) {
    return true;
  }

  // Vérifie si au moins un groupe AND est satisfait (logique OR)
  return requirements.some((andGroup) =>
    checkAndGroup(permissions, andGroup)
  );
}

/**
 * Crée une clé unique pour une permission (pour indexation)
 */
export function getPermissionKey(permission: Permission): string {
  return `${permission.service}.${permission.resource}.${permission.action}`;
}

/**
 * Recherche une permission par service, resource et action dans une liste
 */
export function findPermission(
  permissions: Permission[],
  service: string,
  resource: string,
  action: string
): Permission | undefined {
  return permissions.find(
    (p) => p.service === service && p.resource === resource && p.action === action
  );
}

/**
 * Crée un objet de constantes de permissions à partir d'une liste dynamique
 * Utile pour générer des constantes type-safe depuis l'API
 * 
 * @example
 * ```ts
 * const apiPermissions = await fetch('/api/guardian/permissions').then(r => r.json());
 * const DYNAMIC_PERMISSIONS = createPermissionConstants(apiPermissions);
 * // Utilisation: DYNAMIC_PERMISSIONS['identity.users.list']
 * ```
 */
export function createPermissionConstants(
  permissions: Permission[]
): Record<string, Permission> {
  const constants: Record<string, Permission> = {};
  
  for (const permission of permissions) {
    const key = getPermissionKey(permission).toUpperCase().replaceAll('.', '_');
    constants[key] = permission;
  }
  
  return constants;
}

/**
 * Constantes de permissions communes
 * Note: Les noms de ressources correspondent aux noms retournés par l'API Guardian
 * (singulier: "user", "company", "role", etc.)
 */
export const PERMISSIONS = {
  // Identity - Users
  IDENTITY_USER_LIST: { service: 'identity', resource: 'user', action: 'LIST' },
  IDENTITY_USER_READ: { service: 'identity', resource: 'user', action: 'READ' },
  IDENTITY_USER_CREATE: { service: 'identity', resource: 'user', action: 'CREATE' },
  IDENTITY_USER_UPDATE: { service: 'identity', resource: 'user', action: 'UPDATE' },
  IDENTITY_USER_DELETE: { service: 'identity', resource: 'user', action: 'DELETE' },

  // Identity - Companies
  IDENTITY_COMPANY_LIST: { service: 'identity', resource: 'company', action: 'LIST' },
  IDENTITY_COMPANY_READ: { service: 'identity', resource: 'company', action: 'READ' },
  IDENTITY_COMPANY_UPDATE: { service: 'identity', resource: 'company', action: 'UPDATE' },

  // Identity - Organization Units
  IDENTITY_ORGANIZATION_UNIT_LIST: { service: 'identity', resource: 'organization_unit', action: 'LIST' },
  IDENTITY_ORGANIZATION_UNIT_READ: { service: 'identity', resource: 'organization_unit', action: 'READ' },
  IDENTITY_ORGANIZATION_UNIT_CREATE: { service: 'identity', resource: 'organization_unit', action: 'CREATE' },
  IDENTITY_ORGANIZATION_UNIT_UPDATE: { service: 'identity', resource: 'organization_unit', action: 'UPDATE' },
  IDENTITY_ORGANIZATION_UNIT_DELETE: { service: 'identity', resource: 'organization_unit', action: 'DELETE' },

  // Identity - Positions
  IDENTITY_POSITION_LIST: { service: 'identity', resource: 'position', action: 'LIST' },
  IDENTITY_POSITION_READ: { service: 'identity', resource: 'position', action: 'READ' },
  IDENTITY_POSITION_CREATE: { service: 'identity', resource: 'position', action: 'CREATE' },
  IDENTITY_POSITION_UPDATE: { service: 'identity', resource: 'position', action: 'UPDATE' },
  IDENTITY_POSITION_DELETE: { service: 'identity', resource: 'position', action: 'DELETE' },

  // Identity - Customers
  IDENTITY_CUSTOMER_LIST: { service: 'identity', resource: 'customer', action: 'LIST' },
  IDENTITY_CUSTOMER_READ: { service: 'identity', resource: 'customer', action: 'READ' },
  IDENTITY_CUSTOMER_CREATE: { service: 'identity', resource: 'customer', action: 'CREATE' },
  IDENTITY_CUSTOMER_UPDATE: { service: 'identity', resource: 'customer', action: 'UPDATE' },
  IDENTITY_CUSTOMER_DELETE: { service: 'identity', resource: 'customer', action: 'DELETE' },

  // Identity - Subcontractors
  IDENTITY_SUBCONTRACTOR_LIST: { service: 'identity', resource: 'subcontractor', action: 'LIST' },
  IDENTITY_SUBCONTRACTOR_READ: { service: 'identity', resource: 'subcontractor', action: 'READ' },
  IDENTITY_SUBCONTRACTOR_CREATE: { service: 'identity', resource: 'subcontractor', action: 'CREATE' },
  IDENTITY_SUBCONTRACTOR_UPDATE: { service: 'identity', resource: 'subcontractor', action: 'UPDATE' },
  IDENTITY_SUBCONTRACTOR_DELETE: { service: 'identity', resource: 'subcontractor', action: 'DELETE' },

  // Guardian - Roles
  GUARDIAN_ROLE_LIST: { service: 'guardian', resource: 'role', action: 'LIST' },
  GUARDIAN_ROLE_READ: { service: 'guardian', resource: 'role', action: 'READ' },
  GUARDIAN_ROLE_CREATE: { service: 'guardian', resource: 'role', action: 'CREATE' },
  GUARDIAN_ROLE_UPDATE: { service: 'guardian', resource: 'role', action: 'UPDATE' },
  GUARDIAN_ROLE_DELETE: { service: 'guardian', resource: 'role', action: 'DELETE' },

  // Guardian - Policies
  GUARDIAN_POLICY_LIST: { service: 'guardian', resource: 'policy', action: 'LIST' },
  GUARDIAN_POLICY_READ: { service: 'guardian', resource: 'policy', action: 'READ' },
  GUARDIAN_POLICY_CREATE: { service: 'guardian', resource: 'policy', action: 'CREATE' },
  GUARDIAN_POLICY_UPDATE: { service: 'guardian', resource: 'policy', action: 'UPDATE' },
  GUARDIAN_POLICY_DELETE: { service: 'guardian', resource: 'policy', action: 'DELETE' },
} as const;

/**
 * Requirements prédéfinis pour les features communes
 */
export const PERMISSION_REQUIREMENTS = {
  // Administration des utilisateurs: nécessite list sur user OU role
  USER_ADMINISTRATION: [
    [PERMISSIONS.IDENTITY_USER_LIST],
    [PERMISSIONS.GUARDIAN_ROLE_LIST],
  ],

  // Paramètres entreprise: nécessite read OU update sur company
  COMPANY_SETTINGS: [
    [PERMISSIONS.IDENTITY_COMPANY_READ],
    [PERMISSIONS.IDENTITY_COMPANY_UPDATE],
  ],

  // Informations de l'entreprise: nécessite update sur company
  COMPANY_INFO: [
    [PERMISSIONS.IDENTITY_COMPANY_UPDATE],
  ],

  // Structure organisationnelle: nécessite toutes les permissions sur organization_unit et position
  ORGANIZATION_STRUCTURE: [
    [
      PERMISSIONS.IDENTITY_ORGANIZATION_UNIT_LIST,
      PERMISSIONS.IDENTITY_ORGANIZATION_UNIT_READ,
      PERMISSIONS.IDENTITY_ORGANIZATION_UNIT_CREATE,
      PERMISSIONS.IDENTITY_ORGANIZATION_UNIT_UPDATE,
      PERMISSIONS.IDENTITY_ORGANIZATION_UNIT_DELETE,
      PERMISSIONS.IDENTITY_POSITION_LIST,
      PERMISSIONS.IDENTITY_POSITION_READ,
      PERMISSIONS.IDENTITY_POSITION_CREATE,
      PERMISSIONS.IDENTITY_POSITION_UPDATE,
      PERMISSIONS.IDENTITY_POSITION_DELETE,
    ],
  ],

  // Gestion des clients: nécessite list sur customer
  CUSTOMERS_MANAGEMENT: [
    [PERMISSIONS.IDENTITY_CUSTOMER_LIST],
  ],

  // Gestion des sous-traitants: nécessite list sur subcontractor
  SUBCONTRACTORS_MANAGEMENT: [
    [PERMISSIONS.IDENTITY_SUBCONTRACTOR_LIST],
  ],

  // Gestion des rôles: nécessite list sur role
  ROLES_MANAGEMENT: [
    [PERMISSIONS.GUARDIAN_ROLE_LIST],
  ],

  // Gestion des policies: nécessite list sur policy
  POLICIES_MANAGEMENT: [
    [PERMISSIONS.GUARDIAN_POLICY_LIST],
  ],
} as const;
