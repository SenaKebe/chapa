import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import axios from 'axios';
import * as crypto from 'crypto';

interface ChapaResponse {
  status: string;
  data: {
    tx_ref: string;
    checkout_url: string;
  };
}

interface ChapaPaymentResponse {
  tx_ref: string;
  checkout_url: string;
  status: string;
}

@Injectable()
export class ChapaService {
  private readonly baseUrl = 'https://api.chapa.co/v1';

  constructor(private readonly httpService: HttpService) {}

  async initiatePayment(data: {
    amount: number;
    email: string;
    orderId: string;
  }): Promise<ChapaPaymentResponse> {
    if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) {
      throw new Error('Invalid email format');
    }

    try {
      const response = await axios.post<ChapaResponse>(
        `${this.baseUrl}/transaction/initialize`,
        {
          amount: data.amount,
          currency: 'ETB',
          email: data.email,
          tx_ref: `order_${data.orderId}_${Date.now()}`,
          order_id: data.orderId,
          callback_url: `${process.env.APP_URL}/payments/verify`,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
          },
        },
      );

      return {
        tx_ref: response.data.data.tx_ref,
        checkout_url: response.data.data.checkout_url,
        status: response.data.status,
      };
    } catch (error: any) {
      console.error(
        'Chapa Init Payment Error:',
        error.response?.data || error.message,
      );
      throw new Error('Failed to initiate Chapa payment.');
    }
  }

  // async verifyWebhook(payload: any): Promise<boolean> {
  //   try {
  //     const response = await axios.get<ChapaResponse>(
  //       `${this.baseUrl}/transaction/verify/${payload.tx_ref}`,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
  //         },
  //       },
  //     );

  //     return response.data.status === 'success';
  //   } catch (error: any) {
  //     console.error(
  //       'Chapa Webhook Verification Error:',
  //       error.response?.data || error.message,
  //     );
  //     return false;
  //   }
  // }

  async verifyPayment(tx_ref: string) {
    const url = `${this.baseUrl}/transaction/verify/${tx_ref}`;

    const response = (await firstValueFrom(
      this.httpService.get(url, {
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        },
      }),
    )) as any;

    return response.data.data;
  }

  async verifyWebhook(payload: any): Promise<boolean> {
    try {
      const response = await lastValueFrom(
        this.httpService.get(
          `https://api.chapa.co/v1/transaction/verify/${payload.tx_ref}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
            },
          },
        ),
      );

      console.log('Chapa verification response:', response.data);
      return response.data.status === 'success';
    } catch (error: any) {
      console.error(
        'Verification failed:',
        error?.response?.data || error.message,
      );
      return false;
    }
  }
  async verifyWebhookSignature(
    payload: any,
    signature: string,
  ): Promise<boolean> {
    if (process.env.NODE_ENV === 'test') {
      console.warn('⚠️ Skipping webhook signature verification (TEST MODE)');
      return true;
    }

    if (!process.env.CHAPA_WEBHOOK_SECRET) {
      throw new Error('CHAPA_WEBHOOK_SECRET is not configured');
    }

    try {
      const computedSignature = crypto
        .createHmac('sha256', process.env.CHAPA_WEBHOOK_SECRET)
        .update(JSON.stringify(payload))
        .digest('hex');

      return (
        signature === computedSignature ||
        signature === `sha256=${computedSignature}`
      );
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }
}
