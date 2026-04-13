import { NextRequest, NextResponse } from 'next/server';
import { sendBorrowRequestEmail, sendRequestStatusUpdateEmail, sendWelcomeEmail, sendLoginNotificationEmail, sendPaymentConfirmationEmail, sendItemReturnedEmail } from '@/lib/email-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, payload } = body;

    let result;

    switch (type) {
      case 'NEW_REQUEST':
        result = await sendBorrowRequestEmail(payload);
        break;
      case 'REQUEST_STATUS_UPDATE':
        result = await sendRequestStatusUpdateEmail(payload);
        break;
      case 'WELCOME':
        result = await sendWelcomeEmail(payload);
        break;
      case 'LOGIN':
        result = await sendLoginNotificationEmail(payload);
        break;
      case 'PAYMENT_CONFIRMATION':
        result = await sendPaymentConfirmationEmail(payload);
        break;
      case 'ITEM_RETURNED':
        result = await sendItemReturnedEmail(payload);
        break;
      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error: any) {
    console.error('Email API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
