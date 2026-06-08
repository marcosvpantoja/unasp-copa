import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Camera, Trash2 } from "lucide-react";
import type { Player } from "@/hooks/useTacticalBoard";

interface Props {
  player: Player | null;
  onClose: () => void;
  onSave: (patch: { number: number; name: string; photoUrl?: string }) => void;
  onClear: () => void;
}

export function PlayerEditModal({ player, onClose, onSave, onClear }: Props) {
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (player) {
      setName(player.name ?? "");
      setNumber(player.number > 0 ? String(player.number) : "");
      setPhotoUrl(player.photoUrl);
    }
  }, [player]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setPhotoUrl(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSave = () => {
    const n = parseInt(number, 10);
    onSave({
      number: Number.isFinite(n) ? n : 0,
      name: name.trim(),
      photoUrl,
    });
    onClose();
  };

  return (
    <Dialog open={!!player} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Jogador</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-dashed border-border bg-card transition-colors hover:border-primary"
              aria-label="Selecionar foto"
            >
              {photoUrl ? (
                <img src={photoUrl} alt="Foto do jogador" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <Camera className="h-7 w-7" />
                </div>
              )}
            </button>
            {photoUrl && (
              <button
                type="button"
                onClick={() => setPhotoUrl(undefined)}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Remover foto
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
            />
          </div>

          <div className="grid grid-cols-[80px_1fr] gap-3">
            <div>
              <Label htmlFor="player-number">Número</Label>
              <Input
                id="player-number"
                inputMode="numeric"
                value={number}
                onChange={(e) => setNumber(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
                placeholder="10"
              />
            </div>
            <div>
              <Label htmlFor="player-name">Nome</Label>
              <Input
                id="player-name"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 30))}
                placeholder="Ex.: Falcão"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="flex !justify-between gap-2 sm:flex-row">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              onClear();
              onClose();
            }}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-1 h-4 w-4" /> Limpar
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSave}>
              Salvar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
