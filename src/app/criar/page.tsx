import { Navbar } from "@/components/landing/Navbar";
import { WizardShell } from "@/components/wizard/WizardShell";

export const dynamic = "force-dynamic";

export default function CriarPage() {
  return (
    <>
      <Navbar />
      <main>
        <WizardShell />
      </main>
    </>
  );
}
