// app/api/checkout/initiate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getAdminDb } from "@/lib/Firebase/admin";

const SHIPPING_FEES: Record<string, number> = {
  standard: 2000,
  express: 5000,
  pickup: 0,
};

export async function POST(req: NextRequest) {
  try {
    const adminDb = getAdminDb(); // throws a clean, catchable error if misconfigured

    // ── Verify the caller is actually signed in ────────────────
    const idToken = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!idToken) {
      return NextResponse.json({ success: false, message: "Please sign in." }, { status: 401 });
    }
    const decoded = await getAuth().verifyIdToken(idToken);
    const userId = decoded.uid;
    const userEmail = decoded.email ?? null;

    const { cart, shippingAddress, deliveryMethod } = await req.json();

    if (!cart || cart.length === 0) {
      return NextResponse.json({ success: false, message: "Your cart is empty." }, { status: 400 });
    }
    if (!shippingAddress?.fullName || !shippingAddress?.address || !shippingAddress?.phone) {
      return NextResponse.json({ success: false, message: "Shipping details are incomplete." }, { status: 400 });
    }

    // ── Recompute everything from live Firestore data — never trust
    //    prices or stock the client sends us ──────────────────────
    let subtotal = 0;
    const orderItems = [];

    for (const cartItem of cart as { id: string; quantity: number }[]) {
      const snap = await adminDb.collection("PRODUCTS").doc(cartItem.id).get();
      if (!snap.exists) {
        return NextResponse.json(
          { success: false, message: "A product in your cart no longer exists." },
          { status: 400 }
        );
      }
      const product = snap.data()!;
      const availableStock = product.stock ?? 0;

      if (cartItem.quantity > availableStock) {
        return NextResponse.json(
          { success: false, message: `${product.productName}: only ${availableStock} left in stock.` },
          { status: 400 }
        );
      }

      subtotal += product.price * cartItem.quantity;
      orderItems.push({
        id: cartItem.id,
        productName: product.productName,
        imageURL: product.imageURL,
        price: product.price,
        quantity: cartItem.quantity,
      });
    }

    const shippingFee = SHIPPING_FEES[deliveryMethod] ?? SHIPPING_FEES.standard;
    const total = subtotal + shippingFee;

    // ── Create the order as Pending — stock is NOT touched yet.
    //    It only becomes real once /api/checkout/verify confirms payment. ──
    const orderRef = adminDb.collection("orders").doc();
    await orderRef.set({
      userId,
      userEmail,
      items: orderItems,
      subtotal,
      shippingFee,
      total,
      shippingAddress,
      deliveryMethod,
      status: "Pending",
      paymentStatus: "Pending",
      createdAt: new Date(),
    });

    // ── Start the Paystack transaction. Reusing the order's own id as
    //    the Paystack reference means /verify can look the order up
    //    directly with no extra field needed. ─────────────────────
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: userEmail,
        amount: Math.round(total * 100), // Paystack expects kobo
        reference: orderRef.id,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/callback`,
        metadata: { orderId: orderRef.id, userId },
      }),
    });
    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      await orderRef.update({ paymentStatus: "Failed" });
      return NextResponse.json(
        { success: false, message: "Could not start payment. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: orderRef.id,
      authorizationUrl: paystackData.data.authorization_url,
    });
  } catch (err) {
    console.error("checkout/initiate failed:", err);
    return NextResponse.json(
      {
        success: false,
        message:
          process.env.NODE_ENV === "development" && err instanceof Error
            ? err.message
            : "Something went wrong starting checkout.",
      },
      { status: 500 }
    );
  }
}



