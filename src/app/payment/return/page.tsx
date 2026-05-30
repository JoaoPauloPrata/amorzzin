import { Navbar } from "@/components/landing/Navbar";
import { PaymentReturn } from "@/components/payment/PaymentReturn";

export const dynamic = "force-dynamic";

export default async function PaymentReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ page_id?: string; status?: string; payment_id?: string }>;
}) {
  const params = await searchParams;
  return (
    <>
      <Navbar />
      <main>
        <PaymentReturn
          pageId={params.page_id}
          mpStatus={params.status}
          mpPaymentId={params.payment_id}
        />
      </main>
    </>
  );
}
