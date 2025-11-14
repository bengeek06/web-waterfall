# Refactor: Create reusable TreeActions component

## Objectif
Extract import/export/mermaid preview logic from organization-tree into a reusable component for WBS/PBS trees.

## État actuel
Le code d'import/export/preview Mermaid est dupliqué dans chaque composant d'arbre (organization-tree, et bientôt WBS/PBS).

## Composants déjà génériques
- ✅ **MermaidPreviewModal** - Déjà totalement réutilisable, prend juste `onGenerate(diagramType)` et `dictionary`

## Composants à créer

### 1. TreeActions.tsx
Composant wrapper qui encapsule les boutons import/export et la modale Mermaid.

**Props:**
```typescript
interface TreeActionsProps {
  service: string;           // 'identity', 'wbs', 'pbs'
  path: string;              // '/organization-units', '/work-breakdown', etc.
  dictionary: {              // Traductions i18n
    import_button: string;
    export_button: string;
    import_json: string;
    export_csv: string;
    export_mermaid: string;
    // ... autres clés
  };
  onMermaidGenerate: (diagramType: string) => Promise<string>;
  onRefresh?: () => void;    // Callback après import réussi
}
```

**Utilisation:**
```tsx
<TreeActions
  service="identity"
  path="/organization-units"
  dictionary={dict.organization}
  onMermaidGenerate={generateMermaidCode}
  onRefresh={fetchOrganizationUnits}
/>
```

### 2. Pattern de dictionnaires partagés
Créer des clés communes dans tous les dictionnaires d'arbres:

**dictionaries/en/common-tree.json:**
```json
{
  "import_button": "Import",
  "export_button": "Export",
  "import_json": "Import JSON",
  "import_csv": "Import CSV",
  "export_json": "Export JSON",
  "export_csv": "Export CSV",
  "export_mermaid": "Export Mermaid Image",
  "error_export": "Failed to export",
  "error_import": "Failed to import",
  "import_report_title": "Import Report",
  "import_report_total": "Total processed",
  "import_report_success": "Successful",
  "import_report_failed": "Failed",
  "import_report_errors": "Errors",
  "import_report_warnings": "Warnings",
  "import_report_close": "Close",
  "mermaid_modal_title": "Diagram Preview",
  "mermaid_diagram_type": "Diagram Type",
  "mermaid_flowchart": "Flowchart",
  "mermaid_graph": "Graph",
  "mermaid_mindmap": "Mindmap",
  "mermaid_download": "Download PNG",
  "mermaid_loading": "Generating diagram...",
  "mermaid_error": "Failed to generate diagram"
}
```

Chaque dictionnaire d'arbre étend ces clés communes avec ses clés spécifiques.

## Logique réutilisable

### handleExport
```typescript
const handleExport = async (type: 'json' | 'csv' | 'mermaid') => {
  setIsExporting(true);
  try {
    const blob = await BASIC_IO_ROUTES.export({
      service,
      path,
      type,
      tree: true,
      enrich: true,
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${path.split('/').pop()}.${type}`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Export failed:', error);
    // Show error toast
  } finally {
    setIsExporting(false);
  }
};
```

### handleImport
```typescript
const handleImport = async (file: File) => {
  setIsImporting(true);
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const report = await BASIC_IO_ROUTES.import({
      service,
      path,
      file,
    });
    
    setImportReport(report);
    if (onRefresh) onRefresh();
  } catch (error) {
    console.error('Import failed:', error);
    // Show error toast
  } finally {
    setIsImporting(false);
  }
};
```

### handleMermaidExport
```typescript
const handleMermaidExport = async (diagramType: string) => {
  const mermaidText = await onMermaidGenerate(diagramType);
  return mermaidText;
};
```

## UI Structure
```tsx
<div className="flex gap-2">
  {/* Import Dropdown */}
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" size="sm" disabled={isImporting}>
        <Upload className="mr-2 h-4 w-4" />
        {dictionary.import_button}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem onClick={() => importInputRef.current?.click()}>
        {dictionary.import_json}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => importInputRef.current?.click()}>
        {dictionary.import_csv}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>

  {/* Export Dropdown */}
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" size="sm" disabled={isExporting}>
        <Download className="mr-2 h-4 w-4" />
        {dictionary.export_button}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem onClick={() => handleExport('json')}>
        {dictionary.export_json}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => handleExport('csv')}>
        {dictionary.export_csv}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setIsMermaidModalOpen(true)}>
        <ImageIcon className="mr-2 h-4 w-4" />
        {dictionary.export_mermaid}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>

  {/* Hidden file input */}
  <input type="file" ref={importInputRef} onChange={handleFileSelect} />
  
  {/* Mermaid Preview Modal */}
  <MermaidPreviewModal
    isOpen={isMermaidModalOpen}
    onClose={() => setIsMermaidModalOpen(false)}
    onGenerate={handleMermaidExport}
    dictionary={dictionary}
  />
  
  {/* Import Report Dialog */}
  {importReport && <ImportReportDialog ... />}
</div>
```

## Bénéfices
- ✅ Code DRY - une seule implémentation pour tous les arbres
- ✅ Comportement cohérent entre organization-tree, WBS, PBS
- ✅ Facilite l'ajout de nouveaux types d'arbres
- ✅ Maintenabilité - corrections/améliorations en un seul endroit
- ✅ Tests plus simples - tester un composant au lieu de N

## Plan de migration
1. Créer `components/TreeActions.tsx` avec la logique complète
2. Extraire les clés communes dans `dictionaries/en/common-tree.json` et `dictionaries/fr/common-tree.json`
3. Refactorer `organization-tree.tsx` pour utiliser TreeActions
4. Implémenter WBS et PBS avec TreeActions dès le départ
5. Valider que tout fonctionne identiquement

## Notes
- Le composant parent garde le contrôle de `onMermaidGenerate` car la génération du code Mermaid est spécifique à chaque type d'arbre
- `onRefresh` est optionnel pour permettre au parent de rafraîchir les données après import
