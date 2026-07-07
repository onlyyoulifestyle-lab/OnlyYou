// app/api/notify-order-status/route.ts
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

// Admin client — uses the service role key, server-side only.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { userId, orderId, status, totalAmount, trackingUrl, trackingNumber } = await req.json();

    if (!userId || !orderId || !status) {
      return NextResponse.json(
        { error: "Missing required fields (userId, orderId, or status)" },
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

    const toEmail = userData.user.email;
    const customerName = userData.user.user_metadata?.full_name || "there";
    const shortId = orderId.slice(0, 8).toUpperCase();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    // Mapping clean visual styles & terminology
    const statusLabels: Record<string, string> = {
      pending: "Pending",
      confirmed: "Confirmed",
      out_for_delivery: "Out for Delivery",
      completed: "Delivered",
      cancelled: "Cancelled",
    };

    // Color configurations tailored to different step milestones
    const statusColors: Record<string, { bg: string; text: string }> = {
      pending: { bg: "#f1f5f9", text: "#475569" },          // Slate
      confirmed: { bg: "#eff6ff", text: "#1d4ed8" },        // Blue
      out_for_delivery: { bg: "#fef3c7", text: "#b45309" }, // Amber
      completed: { bg: "#f0fdf4", text: "#15803d" },        // Green
      cancelled: { bg: "#fef2f2", text: "#b91c1c" },        // Red
    };

    const statusMessages: Record<string, string> = {
      pending: "We've received your order and it's awaiting operational confirmation.",
      confirmed: "Great news! Your order has been officially confirmed and is now being meticulously prepared for shipment.",
      out_for_delivery: "Your package is officially on its way! Our courier partner is out for delivery to your location.",
      completed: "Your order has been safely delivered. We hope you love your new pieces! Thank you for choosing OnlyYou Lifestyle.",
      cancelled: "Your order has been cancelled. If this was an error or you have billing concerns, please reach out to us right away.",
    };

    const friendlyStatus = statusLabels[status] || status.toUpperCase();
    const currentColors = statusColors[status] || { bg: "#f8fafc", text: "#0f172a" };
    const displayMessage = statusMessages[status] || "Your order status has been updated by our team.";

    // Conditional render segment for tracking numbers/links
    let trackingHtml = "";
    if (status === "out_for_delivery" && (trackingNumber || trackingUrl)) {
      trackingHtml = `
        <div style="margin: 24px 0; padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px dashed #e2e8f0;">
          <h4 style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #0f172a; margin: 0 0 8px 0; letter-spacing: 0.5px;">Tracking Details</h4>
          ${trackingNumber ? `<p style="font-size: 13px; color: #475569; margin: 0 0 12px 0;">Tracking ID: <strong style="color: #0f172a;">${trackingNumber}</strong></p>` : ""}
          ${trackingUrl ? `
            <a href="${trackingUrl}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 13px; font-weight: 600; text-decoration: none; padding: 10px 20px; border-radius: 8px;">
              Track Shipment
            </a>
          ` : ""}
        </div>
      `;
    }

    const mailOptions = {
      from: `"OnlyYou Lifestyle" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `Order Update #${shortId} — Status: ${friendlyStatus}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; background-color: #ffffff; color: #334155; line-height: 1.5;">
          
          <!-- Header Accent Banner -->
          <div style="padding: 40px 0 24px 0; text-align: center;">
            <span style="background: ${currentColors.bg}; color: ${currentColors.text}; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; padding: 6px 14px; border-radius: 9999px;">
              ${friendlyStatus}
            </span>
            <h1 style="color: #0f172a; font-size: 26px; font-weight: 800; margin: 20px 0 8px 0; letter-spacing: -0.5px;">Order Status Update</h1>
            <p style="color: #64748b; font-size: 15px; margin: 0; max-width: 440px; margin: 0 auto;">Hi ${customerName},</p>
          </div>

          <!-- Body Content Text -->
          <div style="padding: 0 12px; font-size: 15px; color: #475569; text-align: center;">
            <p style="margin: 0; line-height: 1.6;">${displayMessage}</p>
          </div>

          <!-- Optional Tracking Action Card -->
          ${trackingHtml}

          <!-- Metadata Summary Block -->
          <div style="margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 10px 0; color: #64748b;">Order Reference</td>
                <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #0f172a;">#${shortId}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #64748b;">Current Fulfillment Status</td>
                <td style="padding: 10px 0; text-align: right; font-weight: 700; color: ${currentColors.text}; text-transform: uppercase; font-size: 13px;">
                  ${friendlyStatus}
                </td>
              </tr>
              ${totalAmount ? `
              <tr>
                <td style="padding: 10px 0; color: #64748b; border-top: 1px dashed #e2e8f0; margin-top: 4px;">Total Amount</td>
                <td style="padding: 10px 0; text-align: right; font-weight: 800; color: #0f172a; font-size: 16px; border-top: 1px dashed #e2e8f0; margin-top: 4px;">
                  ₹${Number(totalAmount).toLocaleString()}
                </td>
              </tr>` : ""}
            </table>
          </div>

          <!-- Clean Branded Footer Component -->
          <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #f1f5f9; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              Have questions regarding this timeline? Simply reply to this message anytime.
            </p>
            <p style="color: #94a3b8; font-size: 12px; margin: 12px 0 0 0; font-weight: 600; letter-spacing: 0.5px;">
              OnlyYou Lifestyle
            </p>
          </div>

        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, sentTo: toEmail });
  } catch (error: any) {
    console.error("Email send error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    );
  }
}