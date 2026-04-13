import { resend } from './resend';

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

export const sendBorrowRequestEmail = async ({
  to,
  borrowerName,
  itemTitle,
  requestId,
  amount,
}: {
  to: string;
  borrowerName: string;
  itemTitle: string;
  requestId: string;
  amount: number;
}) => {
  try {
    const { data, error } = await resend.emails.send({
      from: `LocalShare <${FROM_EMAIL}>`,
      to,
      subject: `New Borrow Request: ${itemTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #22c55e;">New Borrow Request! 🤝</h2>
          <p>Hi there,</p>
          <p><strong>${borrowerName}</strong> wants to borrow your <strong>"${itemTitle}"</strong>.</p>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Potential Earnings</p>
            <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #111827;">₹${amount}</p>
          </div>
          <p>You can accept or decline this request directly from your dashboard.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/messages?id=${requestId}" 
             style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">
             Review Request
          </a>
          <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #9ca3af;">You're receiving this because someone is interested in an item you listed on LocalShare.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend Error:', error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error('Email Service Error:', err);
    return { success: false, error: err };
  }
};

export const sendRequestStatusUpdateEmail = async ({
  to,
  status,
  lenderName,
  itemTitle,
  requestId,
}: {
  to: string;
  status: 'accepted' | 'rejected';
  lenderName: string;
  itemTitle: string;
  requestId: string;
}) => {
  const isAccepted = status === 'accepted';
  const title = isAccepted ? 'Request Accepted! 🎉' : 'Request Update';
  const color = isAccepted ? '#22c55e' : '#ef4444';

  try {
    const { data, error } = await resend.emails.send({
      from: `LocalShare <${FROM_EMAIL}>`,
      to,
      subject: isAccepted ? `Great news! Your request for ${itemTitle} was accepted` : `Update on your request for ${itemTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: ${color};">${title}</h2>
          <p>Hi there,</p>
          <p><strong>${lenderName}</strong> has <strong>${status}</strong> your request to borrow <strong>"${itemTitle}"</strong>.</p>
          
          ${isAccepted ? `
            <p>You can now proceed with the payment and coordinate the pickup through chat.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/messages?id=${requestId}" 
               style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">
               Pay & Chat
            </a>
          ` : `
            <p>Don't worry! There are plenty of other items available in your neighborhood.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/search" 
               style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">
               Explore Other Items
            </a>
          `}
          
          <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #9ca3af;">Thank you for being part of LocalShare community.</p>
        </div>
      `,
    });

    if (error) return { success: false, error };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err };
  }
};

export const sendWelcomeEmail = async ({
  to,
  name,
}: {
  to: string;
  name: string;
}) => {
  try {
    const { data, error } = await resend.emails.send({
      from: `LocalShare <${FROM_EMAIL}>`,
      to,
      subject: `Welcome to LocalShare, ${name}! 👋`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #22c55e;">Welcome to the Neighborhood! 🏠</h2>
          <p>Hi <strong>${name}</strong>,</p>
          <p>We're thrilled to have you join LocalShare. Our mission is to build stronger communities by making it easy to share resources with your neighbors.</p>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="margin-top: 0; color: #166534;">Ready to get started?</h3>
            <ul style="color: #374151; padding-left: 20px;">
              <li><strong>List an item:</strong> Have a ladder, drill, or board game gathering dust? Share it!</li>
              <li><strong>Borrow something:</strong> Need a tool for a one-time project? Check what's nearby.</li>
              <li><strong>Earn Neighbor Points:</strong> Gain points for being a helpful neighbor.</li>
            </ul>
          </div>

          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/search" 
             style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">
             Explore Nearby Items
          </a>
          
          <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #9ca3af;">Happy sharing,<br>The LocalShare Team</p>
        </div>
      `,
    });

    if (error) return { success: false, error };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err };
  }
};

export const sendLoginNotificationEmail = async ({
  to,
  name,
}: {
  to: string;
  name: string;
}) => {
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  
  try {
    const { data, error } = await resend.emails.send({
      from: `LocalShare Security <${FROM_EMAIL}>`,
      to,
      subject: `New Login to your LocalShare account`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #374151;">Security Alert: New Login 🔒</h2>
          <p>Hi ${name},</p>
          <p>We detected a new login to your LocalShare account.</p>
          
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;"><strong>When:</strong> ${timestamp}</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;"><strong>Action:</strong> Web Login</p>
          </div>

          <p style="font-size: 14px; color: #4b5563;">If this was you, you can safely ignore this email. If you don't recognize this activity, please change your password immediately.</p>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile" 
             style="display: inline-block; color: #3b82f6; text-decoration: underline; font-weight: 500; margin-top: 10px;">
             Review Account Activity
          </a>
          
          <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #9ca3af;">LocalShare Security Team</p>
        </div>
      `,
    });

    if (error) return { success: false, error };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err };
  }
};
export const sendPaymentConfirmationEmail = async ({
  to,
  userName,
  itemTitle,
  amount,
  role,
  paymentId,
}: {
  to: string;
  userName: string;
  itemTitle: string;
  amount: number;
  role: 'payer' | 'receiver';
  paymentId: string;
}) => {
  const isPayer = role === 'payer';
  const subject = isPayer 
    ? `Payment Successful: ${itemTitle} 🏷️` 
    : `Payment Received: ${itemTitle} 💰`;
  
  const title = isPayer ? 'Payment Successful! 🎉' : 'Payment Received! 💰';
  const message = isPayer 
    ? `Your payment of <strong>₹${amount}</strong> for <strong>"${itemTitle}"</strong> was successful. You can now coordinate the pickup with the lender.`
    : `You have received a payment of <strong>₹${amount}</strong> from your neighbor for borrowing <strong>"${itemTitle}"</strong>.`;

  try {
    const { data, error } = await resend.emails.send({
      from: `LocalShare <${FROM_EMAIL}>`,
      to,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #22c55e;">${title}</h2>
          <p>Hi ${userName},</p>
          <p>${message}</p>
          
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px dashed #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Transaction Details</p>
            <p style="margin: 8px 0 0 0; font-size: 16px;"><strong>Item:</strong> ${itemTitle}</p>
            <p style="margin: 4px 0 0 0; font-size: 16px;"><strong>Amount:</strong> ₹${amount}</p>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #9ca3af;"><strong>ID:</strong> ${paymentId}</p>
          </div>

          <p style="font-size: 14px; color: #4b5563;">You can view the full transaction details and chat with your neighbor in the message center.</p>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/messages" 
             style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">
             Go to Messages
          </a>
          
          <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #9ca3af;">Happy sharing!<br>The LocalShare Team</p>
        </div>
      `,
    });

    if (error) return { success: false, error };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err };
  }
};

export const sendItemReturnedEmail = async ({
  to,
  userName,
  itemTitle,
  role,
}: {
  to: string;
  userName: string;
  itemTitle: string;
  role: 'lender' | 'borrower';
}) => {
  const isLender = role === 'lender';
  const subject = `Item Returned: ${itemTitle} ✅`;
  const title = isLender ? 'Your item is back! 📦' : 'Item returned successfully! ✅';
  const message = isLender 
    ? `Great news! <strong>"${itemTitle}"</strong> has been marked as returned and is now back in your inventory. It's automatically been listed as <strong>available</strong> for other neighbors.`
    : `Thank you for returning <strong>"${itemTitle}"</strong>! We hope it was useful for your project. Your neighbor has been notified that the item is back safely.`;

  try {
    const { data, error } = await resend.emails.send({
      from: `LocalShare <${FROM_EMAIL}>`,
      to,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #22c55e;">${title}</h2>
          <p>Hi ${userName},</p>
          <p>${message}</p>
          
          <div style="background: #fdf2f8; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #db2777;">
            <h3 style="margin-top: 0; color: #9d174d;">Share your experience! ⭐️</h3>
            <p style="color: #4b5563; font-size: 14px;">Reviewing your neighbor helps build trust in the community. Take a moment to leave a review for this transaction.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile?tab=borrows" 
               style="display: inline-block; background: #db2777; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 5px; font-size: 13px;">
               Leave a Review
            </a>
          </div>

          <p style="font-size: 14px; color: #4b5563;">Thank you for helping us build a more sustainable and connected neighborhood.</p>
          
          <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #9ca3af;">See you next time,<br>The LocalShare Team</p>
        </div>
      `,
    });

    if (error) return { success: false, error };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err };
  }
};
