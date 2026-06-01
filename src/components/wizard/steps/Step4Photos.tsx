"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { useWizardStore, type WizardPhoto } from "@/lib/wizard/store";
import { cn } from "@/lib/utils/cn";
import {
  deletePhoto,
  listPhotos,
  reorderPhotos,
  uploadPhoto,
} from "@/app/criar/photo-actions";
import { PHOTO_ALLOWED_MIME, PHOTO_FALLBACK_MAX } from "@/lib/wizard/schemas";
import { StepNav } from "../StepNav";

const ACCEPT_ATTR = PHOTO_ALLOWED_MIME.join(",");

export function Step4Photos({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const pageId    = useWizardStore((s) => s.pageId);
  const editToken = useWizardStore((s) => s.editToken);
  const photos    = useWizardStore((s) => s.photos);
  const setPhotos = useWizardStore((s) => s.setPhotos);

  const [maxPhotos, setMaxPhotos] = useState<number>(PHOTO_FALLBACK_MAX);
  const [hydrating, setHydrating] = useState(true);
  const [uploading, setUploading] = useState(0);
  const [error, setError]         = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Hydrata do servidor — cobre refresh / vinda do passo seguinte.
  useEffect(() => {
    if (!pageId || !editToken) { setHydrating(false); return; }

    let cancelled = false;
    (async () => {
      const res = await listPhotos({ page_id: pageId, edit_token: editToken });
      if (cancelled) return;
      if (res.ok) {
        setPhotos(res.photos.map((p) => ({ id: p.id, position: p.position, url: p.url })));
        setMaxPhotos(res.maxPhotos);
      } else {
        setError(res.error);
      }
      setHydrating(false);
    })();
    return () => { cancelled = true; };
  }, [pageId, editToken, setPhotos]);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    if (!pageId || !editToken) return;
    setError(null);

    const arr   = Array.from(files);
    const slots = Math.max(0, maxPhotos - photos.length - uploading);
    if (arr.length > slots) {
      setError(`Você só pode subir mais ${slots} foto${slots === 1 ? "" : "s"} (limite do plano: ${maxPhotos}).`);
    }
    const toUpload = arr.slice(0, slots);
    if (toUpload.length === 0) return;

    // Posição-base capturada antes do batch — cada arquivo recebe um índice único
    // (base + i), evitando colisão de `position` quando os uploads correm em paralelo.
    const basePosition = photos.length;

    setUploading((n) => n + toUpload.length);

    // Paralelo em vez de sequencial: em mobile com HEIC grande + reprocess no server,
    // o envio um-a-um soma todos os tempos. try/finally garante que o contador SEMPRE
    // decrementa — sem isso, uma exceção (timeout/rede) deixava o botão preso em "Salvando…".
    await Promise.all(
      toUpload.map(async (file, i) => {
        const formData = new FormData();
        formData.set("page_id",    pageId);
        formData.set("edit_token", editToken);
        formData.set("file",       file);
        formData.set("position",   String(basePosition + i));

        try {
          const res = await uploadPhoto(formData);
          if (res.ok) {
            const current = useWizardStore.getState().photos;
            useWizardStore.getState().setPhotos(
              [
                ...current,
                { id: res.photo.id, position: res.photo.position, url: res.photo.url },
              ].sort((a, b) => a.position - b.position),
            );
          } else {
            setError(res.error);
          }
        } catch (err) {
          console.error("uploadPhoto lançou exceção", err);
          setError("Não deu pra enviar uma das imagens. Tenta de novo.");
        } finally {
          setUploading((n) => n - 1);
        }
      }),
    );
  }, [pageId, editToken, photos.length, uploading, maxPhotos]);

  const onPickClick   = () => inputRef.current?.click();
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = "";
    }
  };

  const [dragOver, setDragOver] = useState(false);
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removePhoto = async (id: string) => {
    if (!pageId || !editToken) return;
    const before = photos;
    const next   = photos.filter((p) => p.id !== id).map((p, i) => ({ ...p, position: i }));
    setPhotos(next);

    const res = await deletePhoto({ page_id: pageId, edit_token: editToken, photo_id: id });
    if (!res.ok) {
      setError(res.error);
      setPhotos(before);
    }
  };

  // ─── DnD ──────────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (!pageId || !editToken)         return;

    const oldIndex = photos.findIndex((p) => p.id === active.id);
    const newIndex = photos.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const before  = photos;
    const reorder = arrayMove(photos, oldIndex, newIndex).map((p, i) => ({ ...p, position: i }));
    setPhotos(reorder);

    const res = await reorderPhotos({
      page_id:     pageId,
      edit_token:  editToken,
      ordered_ids: reorder.map((p) => p.id),
    });
    if (!res.ok) {
      setError(res.error);
      setPhotos(before);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  const slotsLeft = Math.max(0, maxPhotos - photos.length);
  const submitting = uploading > 0 || navigating;

  const onContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setNavigating(true);
    onNext();
  };

  return (
    <form onSubmit={onContinue} className="space-y-6">
      <header>
        <h2 className="font-display text-3xl font-bold text-ink md:text-4xl">
          Sobe as fotos do carrossel
        </h2>
        <p className="mt-2 text-ink/70">
          {hydrating
            ? "Carregando fotos…"
            : `${photos.length} de ${maxPhotos} fotos. Arrasta pra reordenar — a primeira aparece em destaque.`}
        </p>
      </header>

      <div
        onClick={slotsLeft === 0 ? undefined : onPickClick}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          slotsLeft === 0
            ? "cursor-not-allowed border-ink/10 bg-ink/5 text-ink/40"
            : "cursor-pointer border-rose-200 bg-white/60 text-ink/70 hover:border-rose-400 hover:bg-white",
          dragOver && "border-rose-500 bg-rose-50",
        )}
      >
        <span className="text-3xl">📸</span>
        <p className="text-sm font-medium">
          {slotsLeft === 0
            ? `Limite de ${maxPhotos} fotos atingido`
            : "Clica aqui ou arrasta as fotos"}
        </p>
        <p className="text-xs text-ink/50">
          JPG, PNG, WebP ou HEIC — até 5 MB cada
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          multiple
          className="hidden"
          onChange={onInputChange}
        />
      </div>

      {photos.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {photos.map((photo, idx) => (
                <PhotoTile
                  key={photo.id}
                  photo={photo}
                  index={idx}
                  onRemove={removePhoto}
                />
              ))}
              {uploading > 0 && (
                <li className="aspect-square animate-pulse rounded-xl bg-ink/10" />
              )}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {photos.length === 0 && uploading === 0 && !hydrating && (
        <p className="text-center text-xs text-ink/50">
          Pode pular esse passo se quiser — fotos são opcionais.
        </p>
      )}

      <StepNav
        canBack={true}
        isLast={false}
        submitting={submitting}
        error={error}
        onBack={onBack}
      />
    </form>
  );
}

// ─── PhotoTile ──────────────────────────────────────────────────────────────

function PhotoTile({
  photo,
  index,
  onRemove,
}: {
  photo: WizardPhoto;
  index: number;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: photo.id });

  const style: React.CSSProperties = {
    transform:  CSS.Transform.toString(transform),
    transition,
    zIndex:     isDragging ? 10 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative aspect-square overflow-hidden rounded-xl border border-ink/10 bg-ink/5 shadow-sm",
        isDragging && "ring-2 ring-rose-400 shadow-lg",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        aria-label={`Arrastar foto ${index + 1}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt={`Foto ${index + 1}`}
          className="h-full w-full object-cover"
          draggable={false}
        />
      </button>

      <span className="pointer-events-none absolute left-1.5 top-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
        {index + 1}
      </span>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onRemove(photo.id); }}
        className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-xs font-bold text-white opacity-0 transition-opacity hover:bg-rose-600 group-hover:opacity-100"
        aria-label="Remover foto"
      >
        ×
      </button>
    </li>
  );
}
