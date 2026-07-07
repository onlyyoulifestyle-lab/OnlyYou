// app/api/notify-new-order/route.ts
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

// Admin client — service role key, server-side only. Never expose to client.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SHOP_EMAIL = "onlyyoulifestyle@gmail.com";

export async function POST(req: Request) {
  try {
    const { orderId, userId, totalAmount, items, shippingAddress, billingAddress } = await req.json();

    if (!orderId || !userId) {
      return NextResponse.json(
        { error: "Missing orderId or userId" },
        { status: 400 }
      );
    }

    // Look up the customer's email + name from Supabase Auth
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !userData?.user?.email) {
      console.error("Could not find user email:", userError);
      return NextResponse.json(
        { error: "Customer email not found" },
        { status: 404 }
      );
    }

    const customerEmail = userData.user.email;
    const customerName = userData.user.user_metadata?.full_name || "there";
    const shortId = orderId.slice(0, 8).toUpperCase();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    // Helper formatting function for addresses
    const formatAddress = (addr: any) => {
      if (!addr) return "Not Provided";
      return [
        addr.line1,
        addr.line2,
        `${addr.city}, ${addr.state || ''} ${addr.postal_code || ''}`,
        addr.country
      ].filter(Boolean).join("<br/>");
    };

    const shippingHtml = formatAddress(shippingAddress);
    const billingHtml = billingAddress ? formatAddress(billingAddress) : shippingHtml;

    // Build modern minimalist line-item rows
    const itemRows = (items || [])
      .map((item: any) => {
        const name = item.products?.name || item.name || "Item";
        const thumb = item.products?.thumbnail_url || item.thumbnail_url || "";
        const qty = item.quantity || 1;
        const size = item.size || item.variant || "Standard";
        const price = item.price ? `₹${Number(item.price).toLocaleString()}` : "";

        return `
          <tr>
            <td style="padding: 16px 0; border-bottom: 1px solid #f1f5f9; vertical-align: top;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                <tr>
                  ${thumb ? `
                  <td width="64" style="padding-right: 16px; vertical-align: top;">
                    <img src="${thumb}" width="64" height="64" style="border-radius: 8px; object-fit: cover; display:block; border: 1px solid #f1f5f9;" />
                  </td>
                  ` : ''}
                  <td style="vertical-align: top;">
                    <div style="font-weight: 600; font-size: 14px; color: #0f172a; margin-bottom: 4px;">${name}</div>
                    <div style="font-size: 12px; color: #64748b;">Qty: ${qty} &middot; Size: ${size}</div>
                  </td>
                  <td style="text-align: right; vertical-align: top; font-weight: 600; font-size: 14px; color: #0f172a;">
                    ${price}
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
      })
      .join("");

    // Modern Shared CSS Layout base
    const baseEmailStyles = `
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      max-width: 580px; 
      margin: 0 auto; 
      background-color: #ffffff; 
      color: #334155;
      line-height: 1.5;
    `;

    // ---------- 1. PREMIUM CUSTOMER CONFIRMATION EMAIL ----------
    const customerHtml = `
      <div style="${baseEmailStyles}">
        <div style="padding: 40px 0 32px 0; text-align: center;">
          <span style="background: #fdf2f8; color: #db2777; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; padding: 6px 12px; border-radius: 9999px;">Order Confirmed</span>
          <h1 style="color: #0f172a; font-size: 28px; font-weight: 800; margin: 16px 0 8px 0; letter-spacing: -0.5px;">Thanks for your order!</h1>
          <p style="color: #64748b; font-size: 15px; margin: 0;">Hi ${customerName}, we're getting your items ready for shipment.</p>
        </div>

        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 32px; background: #f8fafc; border-radius: 12px;">
          <tr>
            <td style="padding: 16px; font-size: 13px; color: #64748b;">Order Reference:<br><strong style="color: #0f172a; font-size: 15px;">#${shortId}</strong></td>
            <td style="padding: 16px; font-size: 13px; color: #64748b; text-align: right;">Date:<br><strong style="color: #0f172a; font-size: 15px;">${new Date().toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'})}</strong></td>
          </tr>
        </table>

        <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; margin: 0 0 8px 0;">Your Items</h3>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          ${itemRows}
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #64748b;">Total Amount Paid</td>
            <td style="padding: 8px 0; text-align: right; font-size: 20px; font-weight: 700; color: #0f172a;">₹${Number(totalAmount).toLocaleString()}</td>
          </tr>
        </table>

        <div style="border-top: 1px solid #e2e8f0; margin-top: 32px; padding-top: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
            <tr>
              <td width="50%" style="vertical-align: top; padding-right: 12px;">
                <h4 style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #0f172a; margin: 0 0 8px 0; letter-spacing: 0.5px;">Shipping Address</h4>
                <p style="font-size: 13px; color: #475569; margin: 0; line-height: 1.4;">${shippingHtml}</p>
              </td>
              <td width="50%" style="vertical-align: top; padding-left: 12px;">
                <h4 style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #0f172a; margin: 0 0 8px 0; letter-spacing: 0.5px;">Billing Address</h4>
                <p style="font-size: 13px; color: #475569; margin: 0; line-height: 1.4;">${billingHtml}</p>
              </td>
            </tr>
          </table>
        </div>

        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #f1f5f9; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            Need updates? Simply reply directly to this email. We're here to help.
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin: 12px 0 0 0; font-weight: 600;">
            OnlyYou Lifestyle
          </p>
        </div>
      </div>
    `;

    // ---------- 2. PREMIUM SHOP OWNER ALERT EMAIL ----------
    const ownerHtml = `
      <div style="${baseEmailStyles}">
        <div style="padding: 40px 0 32px 0; text-align: left; border-bottom: 2px solid #0f172a;">
          <span style="background: #e11d48; color: #ffffff; font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; padding: 4px 8px; border-radius: 4px;">Fulfillment Required</span>
          <h1 style="color: #0f172a; font-size: 26px; font-weight: 800; margin: 12px 0 4px 0; letter-spacing: -0.5px;">New Order Received</h1>
          <p style="color: #64748b; font-size: 15px; margin: 0;">Order Reference: <strong>#${shortId}</strong> &middot; Total: <strong>₹${Number(totalAmount).toLocaleString()}</strong></p>
        </div>

        <div style="padding: 20px 0; border-bottom: 1px solid #e2e8f0;">
          <h3 style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a; margin: 0 0 12px 0;">Customer Profile</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="color: #64748b; padding: 4px 0;">Name:</td>
              <td style="font-weight: 600; color: #0f172a; text-align: right;">${customerName}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 4px 0;">Email:</td>
              <td style="font-weight: 600; color: #0f172a; text-align: right;"><a href="mailto:${customerEmail}" style="color: #db2777; text-decoration: none;">${customerEmail}</a></td>
            </tr>
          </table>
        </div>

        <div style="padding: 24px 0;">
          <h3 style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a; margin: 0 0 12px 0;">Items Ordered</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
            ${itemRows}
          </table>
        </div>

        <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-top: 12px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
            <tr>
              <td width="50%" style="vertical-align: top; padding-right: 8px;">
                <h4 style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; margin: 0 0 6px 0;">Deliver To</h4>
                <p style="font-size: 13px; color: #0f172a; margin: 0; line-height: 1.4;"><strong>${customerName}</strong><br>${shippingHtml}</p>
              </td>
              <td width="50%" style="vertical-align: top; padding-left: 8px;">
                <h4 style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; margin: 0 0 6px 0;">Billing Summary</h4>
                <p style="font-size: 13px; color: #0f172a; margin: 0; line-height: 1.4;">${billingHtml}</p>
              </td>
            </tr>
          </table>
        </div>

        <div style="margin-top: 40px; text-align: center;">
          <p style="color: #64748b; font-size: 13px; margin-bottom: 16px;">Please review and process this transaction inside your management portal.</p>
          <p style="color: #94a3b8; font-size: 11px; margin: 24px 0 0 0;">Automated System &bull; OnlyYou Lifestyle</p>
        </div>
      </div>
    `;

    // Send both emails in parallel
    await Promise.all([
      transporter.sendMail({
        from: `"OnlyYou Lifestyle" <${process.env.EMAIL_USER}>`,
        to: customerEmail,
        subject: `Order Confirmed — #${shortId}`,
        html: customerHtml,
      }),
      transporter.sendMail({
        from: `"OnlyYou Lifestyle Fulfillment" <${process.env.EMAIL_USER}>`,
        to: SHOP_EMAIL,
        subject: `🛍️  [New Order] #${shortId} — ₹${Number(totalAmount).toLocaleString()}`,
        html: ownerHtml,
      }),
    ]);

    return NextResponse.json({ success: true, sentTo: [customerEmail, SHOP_EMAIL] });
  } catch (error: any) {
    console.error("New order email error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send order emails" },
      { status: 500 }
    );
  }
}