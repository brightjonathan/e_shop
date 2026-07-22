// app/api/admin/refund/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getAdminDb } from "@/lib/Firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export async function POST(req: NextRequest) {
  try {
    const adminDb = getAdminDb();

    // ── Verify the caller is actually an admin ──────────────────
    const idToken = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!idToken) {
      return NextResponse.json({ success: false, message: "Please sign in." }, { status: 401 });
    }
    const decoded = await getAuth().verifyIdToken(idToken);
    const isAdmin = decoded.email === ADMIN_EMAIL || decoded.admin === true;
    if (!isAdmin) {
      return NextResponse.json({ success: false, message: "Admin access required." }, { status: 403 });
    }

    const { orderId, reason } = await req.json();
    if (!orderId) {
      return NextResponse.json({ success: false, message: "Missing order id." }, { status: 400 });
    }

    const orderRef = adminDb.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
    }
    const order = orderSnap.data()!;

    if (order.paymentStatus !== "Paid") {
      return NextResponse.json(
        { success: false, message: "Only paid orders can be refunded." },
        { status: 400 }
      );
    }
    if (!order.paymentReference) {
      return NextResponse.json(
        { success: false, message: "This order has no payment reference to refund." },
        { status: 400 }
      );
    }

    // ── Ask Paystack to actually reverse the charge ──────────────
    const refundRes = await fetch("https://api.paystack.co/refund", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transaction: order.paymentReference,
        merchant_note: reason || "Refund issued by admin",
      }),
    });
    const refundData = await refundRes.json();

    if (!refundData.status) {
      return NextResponse.json(
        { success: false, message: refundData.message || "Paystack rejected the refund." },
        { status: 500 }
      );
    }

    // ── Only mark it refunded once Paystack confirms it accepted the request ──
    await orderRef.update({
      status: "Refunded",
      paymentStatus: "Refunded",
      refundReference: refundData.data?.transaction?.reference ?? order.paymentReference,
      refundReason: reason || null,
      refundedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, message: "Refund initiated successfully." });
  } catch (err) {
    console.error("admin/refund failed:", err);
    return NextResponse.json(
      {
        success: false,
        message:
          process.env.NODE_ENV === "development" && err instanceof Error
            ? err.message
            : "Something went wrong processing the refund.",
      },
      { status: 500 }
    );
  }
}