
// src/ai/flows/send-verification-otp.ts
'use server';
/**
 * @fileOverview A flow for generating and sending a one-time password (OTP) for email verification.
 */
import { ai } from '@/ai/genkit';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Resend } from 'resend';
import { SendVerificationOtpInput, SendVerificationOtpInputSchema, SendVerificationOtpOutput, SendVerificationOtpOutputSchema } from '../schemas';

// Initialize Resend with your API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationOtp(
  input: SendVerificationOtpInput
): Promise<SendVerificationOtpOutput> {
  return sendVerificationOtpFlow(input);
}

const sendVerificationOtpFlow = ai.defineFlow(
  {
    name: 'sendVerificationOtpFlow',
    inputSchema: SendVerificationOtpInputSchema,
    outputSchema: SendVerificationOtpOutputSchema,
  },
  async ({ userId, email, name }) => {
    const otp = generateOtp();
    const expiryMinutes = 10;
    const expiryDate = new Date(Date.now() + expiryMinutes * 60 * 1000);

    try {
      // 1. Store the OTP in Firestore
      const otpRef = doc(db, 'otps', userId);
      await setDoc(otpRef, {
        code: otp,
        email: email,
        expiresAt: expiryDate,
        createdAt: serverTimestamp(),
      });

      // 2. Send the OTP via email using Resend
      const { data, error } = await resend.emails.send({
        from: 'SmartBite <onboarding@resend.dev>',
        to: [email],
        subject: 'Your SmartBite Verification Code',
        html: `
          <div style="font-family: sans-serif; text-align: center; padding: 20px;">
            <h2>Welcome to SmartBite, ${name}!</h2>
            <p>Your verification code is:</p>
            <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 20px 0; padding: 10px; background-color: #f0f0f0; border-radius: 8px;">
              ${otp}
            </p>
            <p>This code will expire in ${expiryMinutes} minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
          </div>
        `,
      });

      if (error) {
        console.error('Resend error:', error);
        throw new Error('Failed to send verification email.');
      }

      return {
        success: true,
        message: 'OTP has been sent to your email.',
      };

    } catch (e) {
      console.error('Error in sendVerificationOtpFlow:', e);
      return {
        success: false,
        message: 'An internal error occurred while sending the OTP.',
      };
    }
  }
);
