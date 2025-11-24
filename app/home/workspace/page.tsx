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

export default async function WorkspacePage() {
  const dict = await getDictionary("fr");

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{dict.workspace.workspace}</h1>
        <p className="text-muted-foreground mt-2">{dict.workspace.workspace_description}</p>
      </div>

      <FileExplorer dictionary={dict.workspace} />
    </div>
  );
}
