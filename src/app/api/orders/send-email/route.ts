import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getOrderPDFBase64, type OrderPDFData } from '@/lib/utils/pdf-generator';

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * POST /api/orders/send-email
 * Send order email to supplier with PDF attachment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderData, supplierEmail, fromEmail } = body as {
      orderData: OrderPDFData;
      supplierEmail: string;
      fromEmail?: string;
    };

    if (!supplierEmail) {
      return NextResponse.json(
        { error: 'Supplier email is required' },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Email service not configured. Please add RESEND_API_KEY to your environment variables.' },
        { status: 500 }
      );
    }

    // Generate PDF as base64
    const pdfBase64 = getOrderPDFBase64(orderData);

    // Prepare email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .header h1 { margin: 0; color: #2c3e50; }
            .items { background: #fff; border: 1px solid #dee2e6; border-radius: 8px; padding: 15px; margin: 20px 0; }
            .item { padding: 10px 0; border-bottom: 1px solid #f1f3f5; }
            .item:last-child { border-bottom: none; }
            .item-name { font-weight: bold; }
            .item-quantity { color: #6c757d; }
            .total { background: #e9ecef; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: right; }
            .total strong { font-size: 18px; color: #2c3e50; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🛒 Nouvelle Commande</h1>
              <p>Date: ${orderData.orderDate}</p>
            </div>

            <p>Bonjour,</p>
            <p>Nous souhaitons passer la commande suivante :</p>

            <div class="items">
              ${orderData.items.map(item => `
                <div class="item">
                  <div class="item-name">${item.productName}</div>
                  <div class="item-quantity">
                    ${item.quantity} ${item.unit}
                    ${item.estimatedPrice ? `• ${(item.quantity * item.estimatedPrice).toFixed(2)} €` : ''}
                  </div>
                </div>
              `).join('')}
            </div>

            ${orderData.totalEstimatedCost > 0 ? `
              <div class="total">
                <strong>Total estimé: ${orderData.totalEstimatedCost.toFixed(2)} €</strong>
              </div>
            ` : ''}

            <p>Veuillez trouver le bon de commande en pièce jointe.</p>
            <p>Merci de confirmer la réception de cette commande.</p>

            <div class="footer">
              ${orderData.restaurantName ? `<p><strong>${orderData.restaurantName}</strong></p>` : ''}
              ${orderData.restaurantEmail ? `<p>Email: ${orderData.restaurantEmail}</p>` : ''}
              ${orderData.restaurantPhone ? `<p>Tél: ${orderData.restaurantPhone}</p>` : ''}
              <p style="margin-top: 10px;">
                <em>Ce message a été généré automatiquement par Cocorico</em>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email with PDF attachment
    const result = await resend.emails.send({
      from: fromEmail || 'Cocorico <onboarding@resend.dev>', // Use verified domain in production
      to: supplierEmail,
      subject: `Commande - ${orderData.restaurantName || 'Restaurant'} - ${orderData.orderDate}`,
      html: emailHtml,
      attachments: [
        {
          filename: `commande-${orderData.supplierName.toLowerCase().replace(/\s+/g, '-')}-${orderData.orderDate}.pdf`,
          content: pdfBase64,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      messageId: result.data?.id,
      message: 'Email sent successfully',
    });
  } catch (error) {
    console.error('Error sending order email:', error);
    return NextResponse.json(
      {
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
