// app/api/checkout/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/Firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference");
  if (!reference) {
    return NextResponse.json({ success: false, message: "Missing payment reference." }, { status: 400 });
  }

  try {
    const adminDb = getAdminDb(); // throws a clean, catchable error if misconfigured

    const orderRef = adminDb.collection("orders").doc(reference);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
    }
    const order = orderSnap.data()!;

    // Already processed — e.g. the user refreshed this page after a
    // successful verification. Don't decrement stock a second time.
    if (order.paymentStatus === "Paid") {
      return NextResponse.json({ success: true, orderId: reference, alreadyProcessed: true });
    }

    // ── Ask Paystack directly. Never trust a "?status=success" query
    //    param alone — that can be faked by anyone editing the URL. ──
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });
    const verifyData = await verifyRes.json();

    const paystackConfirmsSuccess =
      verifyData.status === true &&
      verifyData.data?.status === "success" &&
      verifyData.data?.amount === Math.round(order.total * 100); // amount must match exactly

    if (!paystackConfirmsSuccess) {
      await orderRef.update({ paymentStatus: "Failed" });
      return NextResponse.json({ success: false, message: "Payment could not be verified." }, { status: 400 });
    }

    // ── Payment confirmed — NOW decrement stock and finalize the order,
    //    as one atomic transaction ─────────────────────────────────
    await adminDb.runTransaction(async (transaction) => {
      const productRefs = order.items.map((item: any) => adminDb.collection("PRODUCTS").doc(item.id));
      const productSnaps = await Promise.all(productRefs.map((ref: any) => transaction.get(ref)));

      productSnaps.forEach((snap: any, index: number) => {
        if (!snap.exists) return;
        const currentStock = snap.data()?.stock ?? 0;
        const purchasedQty = order.items[index].quantity;
        transaction.update(productRefs[index], { stock: Math.max(0, currentStock - purchasedQty) });
      });

      transaction.update(orderRef, {
        paymentStatus: "Paid",
        paymentReference: reference,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    // ── Clear the cart server-side, so it's gone regardless of what
    //    device/tab the customer completes payment on ─────────────
    await adminDb.collection("carts").doc(order.userId).set({ items: [], updatedAt: Date.now() });

    return NextResponse.json({ success: true, orderId: reference });
  } catch (err) {
    console.error("checkout/verify failed:", err);
    return NextResponse.json(
      {
        success: false,
        message:
          process.env.NODE_ENV === "development" && err instanceof Error
            ? err.message
            : "Something went wrong verifying payment.",
      },
      { status: 500 }
    );
  }
}



