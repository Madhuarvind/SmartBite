
// src/ai/flows/verify-otp.ts
'use server';
/**
 * @fileOverview A flow for verifying a one-time password (OTP) for email verification.
 */
import { ai } from '@/ai/genkit';
import { db } from '@/lib/firebase';
import { doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { VerifyOtpInput, VerifyOtpInputSchema, VerifyOtpOutput, VerifyOtpOutputSchema } from '../schemas';

export async function verifyOtp(
  input: VerifyOtpInput
): Promise<VerifyOtpOutput> {
  return verifyOtpFlow(input);
}

const verifyOtpFlow = ai.defineFlow(
  {
    name: 'verifyOtpFlow',
    inputSchema: VerifyOtpInputSchema,
    outputSchema: VerifyOtpOutputSchema,
  },
  async ({ userId, otp }) => {
    try {
      const otpRef = doc(db, 'otps', userId);
      const otpDoc = await getDoc(otpRef);

      if (!otpDoc.exists()) {
        return { success: false, message: 'Invalid OTP or it has expired. Please register again.' };
      }

      const otpData = otpDoc.data();
      const now = new Date();
      
      if (otpData.expiresAt.toDate() < now) {
        await deleteDoc(otpRef);
        return { success: false, message: 'Your OTP has expired. Please register again.' };
      }

      if (otpData.code !== otp) {
        return { success: false, message: 'The OTP you entered is incorrect.' };
      }

      // OTP is correct, now mark the user as verified in our system
      // Note: This does NOT verify the email in Firebase Auth itself,
      // that requires the user to click the link. This is an additional layer.
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        otpVerified: true,
      });

      // Clean up the used OTP
      await deleteDoc(otpRef);

      return { success: true, message: 'Email successfully verified.' };

    } catch (e) {
      console.error('Error in verifyOtpFlow:', e);
      return {
        success: false,
        message: 'An internal error occurred during OTP verification.',
      };
    }
  }
);
