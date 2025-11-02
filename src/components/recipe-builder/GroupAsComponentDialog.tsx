"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Layers, Sparkles } from "lucide-react";

type GroupAsComponentDialogProps = {
  open: boolean;
  onClose: () => void;
  selectedCount: number;
  onGroup: (componentName: string, saveToLibrary: boolean) => void;
};

export function GroupAsComponentDialog({
  open,
  onClose,
  selectedCount,
  onGroup,
}: GroupAsComponentDialogProps) {
  const [componentName, setComponentName] = useState("");
  const [saveToLibrary, setSaveToLibrary] = useState(true);

  const handleGroup = () => {
    if (!componentName.trim()) return;
    onGroup(componentName.trim(), saveToLibrary);
    setComponentName("");
    setSaveToLibrary(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && componentName.trim()) {
      handleGroup();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setComponentName("");
          setSaveToLibrary(true);
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-purple-600" />
            Grouper en composant
          </DialogTitle>
          <DialogDescription>
            Créer un composant réutilisable à partir de {selectedCount} ingrédient{selectedCount !== 1 ? "s" : ""} sélectionné{selectedCount !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Component Name */}
          <div className="space-y-2">
            <label htmlFor="componentName" className="text-sm font-medium">
              Nom du composant
            </label>
            <Input
              id="componentName"
              autoFocus
              placeholder="Ex: Marinade au thym, Fond de veau..."
              value={componentName}
              onChange={(e) => setComponentName(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Save to Library */}
          <div className="flex items-start space-x-3 rounded-lg border p-3 bg-purple-50/50">
            <Checkbox
              id="saveToLibrary"
              checked={saveToLibrary}
              onCheckedChange={(checked) => setSaveToLibrary(checked as boolean)}
              className="mt-0.5"
            />
            <div className="flex-1">
              <label
                htmlFor="saveToLibrary"
                className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="h-3 w-3 text-purple-600" />
                Enregistrer dans la bibliothèque
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                Rendre ce composant réutilisable dans d'autres recettes
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleGroup} disabled={!componentName.trim()}>
            Créer le composant
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
