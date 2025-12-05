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

import { FileExplorer } from "@/components/shared/FileExplorer";
import { getDictionary } from "@/lib/utils/dictionaries";
import { getUserLanguage } from "@/lib/utils/locale";
import PageBreadcrumb from "@/components/shared/PageBreadcrumb";

export default async function WorkspacePage() {
  const userLanguage = await getUserLanguage();
  const dict = await getDictionary(userLanguage);
  const { errors, ...workspaceDict } = dict.workspace;

  return (
    <div className="container mx-auto p-6">
      <PageBreadcrumb
        pathname="/home/workspace"
        dictionary={dict.breadcrumb}
      />
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{dict.workspace.workspace}</h1>
        <p className="text-muted-foreground mt-2">{dict.workspace.workspace_description}</p>
      </div>

      <FileExplorer dictionary={workspaceDict} errors={errors} />
    </div>
  );
}
