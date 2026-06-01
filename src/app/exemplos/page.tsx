import { redirect } from "next/navigation";

// /exemplos → primeiro estilo da vitrine (Polaroid).
export default function ExemplosIndex() {
  redirect("/exemplos/polaroid");
}
