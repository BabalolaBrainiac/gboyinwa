/**
 * Test Resend Email Configuration
 * 
 * Usage: npx tsx scripts/test-resend.ts your-email@example.com
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve('.env.local') });

import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'newsletter@gboyinwa.com';

async function testResend() {
  console.log('='.repeat(60));
  console.log('RESEND EMAIL TEST');
  console.log('='.repeat(60));
  console.log();

  // Check API key
  if (!RESEND_API_KEY) {
    console.error('[ERROR] RESEND_API_KEY not found in environment');
    process.exit(1);
  }

  console.log('[OK] API key found');
  console.log(`[INFO] From email: ${RESEND_FROM_EMAIL}`);
  console.log();

  // Get recipient email from command line
  const recipientEmail = process.argv[2];
  if (!recipientEmail) {
    console.error('[ERROR] Please provide a recipient email address');
    console.log('Usage: npx tsx scripts/test-resend.ts your-email@example.com');
    process.exit(1);
  }

  console.log(`[INFO] Sending test email to: ${recipientEmail}`);
  console.log();

  try {
    const resend = new Resend(RESEND_API_KEY);

    // Test 1: Send a simple email
    console.log('[TEST 1] Sending simple text email...');
    const { data: textData, error: textError } = await resend.emails.send({
      from: `Gboyinwa <${RESEND_FROM_EMAIL}>`,
      to: recipientEmail,
      subject: 'Test Email - Text Only',
      text: 'This is a test email from the Gboyinwa website. If you received this, the Resend integration is working!',
    });

    if (textError) {
      console.error('[FAIL] Text email failed:', textError);
    } else {
      console.log('[OK] Text email sent! Message ID:', textData?.id);
    }

    console.log();

    // Test 2: Send HTML email
    console.log('[TEST 2] Sending HTML email...');
    const { data: htmlData, error: htmlError } = await resend.emails.send({
      from: `Gboyinwa <${RESEND_FROM_EMAIL}>`,
      to: recipientEmail,
      subject: 'Test Email - HTML',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333;">Test Email</h1>
          <p>This is a <strong>test email</strong> from the Gboyinwa website.</p>
          <p>If you received this, the Resend integration is working correctly!</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">Gboyinwa Foundation</p>
        </div>
      `,
    });

    if (htmlError) {
      console.error('[FAIL] HTML email failed:', htmlError);
    } else {
      console.log('[OK] HTML email sent! Message ID:', htmlData?.id);
    }

    console.log();
    console.log('='.repeat(60));
    console.log('TEST COMPLETE');
    console.log('='.repeat(60));
    console.log();
    console.log('If you did not receive the emails:');
    console.log('1. Check your spam/junk folder');
    console.log('2. Verify the domain is verified in Resend dashboard');
    console.log('3. Check Resend dashboard for delivery logs');
    console.log('4. Ensure the from email domain matches your verified domain');

  } catch (err: any) {
    console.error('[ERROR] Unexpected error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

testResend();
