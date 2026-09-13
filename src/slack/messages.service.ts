import { Injectable } from '@nestjs/common';

import { getApps, initializeApp, cert } from 'firebase-admin/app';

import { getFirestore } from 'firebase-admin/firestore';

import { getMessaging } from 'firebase-admin/messaging';

@Injectable()
export class MessagesService {
  private readonly firestore;
  private readonly messaging;
  isNotSymbol = ['US_CHECK_IN','RSIENDBOT','BUY_HOLD','SELL_AVOID',"_30min","_1h","_4h","_15min","_1day"]
  constructor() {
    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }

    this.firestore = getFirestore();
    this.messaging = getMessaging();
  }

  // ============================================================
  // SEND MESSAGE
  // ============================================================
  // return await this.messagesService.sendMessage("workspace-1", channelN, "bot-1", ticker, messgage+websiteLink)
  async sendMessage(
    workspaceId: string,// "workspace-1"
    channelId: string, // -----myChannel
    userId: string, // "bot-1"
    userName: string, // -----ticker
    text: string, // -------msg
  ) {
    try {
      const match = text.match(/discord\.com\/channels\/\d+\/(\d+)\/(\d+)/);

      const dc_msg_full = match ? `${match[1]}/${match[2]}` : null;

      const messagesRef = this.firestore
        .collection('workspaces')
        .doc(workspaceId)
        .collection('channels')
        .doc(channelId)
        .collection('messages');

      const message = await messagesRef.add({
        userId,
        userName,
        text,
        createdAt: new Date(),
        dc_msg_full,
      });
      const isNotSymbol = this.isNotSymbol.some(item => userName.includes(item));
      if(!isNotSymbol){
        await this.sendNotificationToUser(
          'n90Q4DYyzQc8Ibv9Xw5xTmT1G5F3',
          `${userName}`,
          text,
        );
      }
      return {
        id: message.id,
        workspaceId,
        channelId,
        userId,
        userName,
        text,
        dc_msg_full,
      };
    } catch (error) {
      console.error('Post to My SLACK Fail:', error);

      throw error;
    }
  }

  // ============================================================
  // UPDATE MESSAGE
  // ============================================================

  async updateMessage(
    workspaceId: string,
    channelId: string,
    messageId: string,
    text: string,
  ) {
    try {
      const matches = [
        ...text.matchAll(/discord\.com\/channels\/\d+\/(\d+)\/(\d+)/g),
      ];

      const dc_msg_full = matches.length
        ? matches.map((match) => `${match[1]}/${match[2]}`)
        : null;

      const messageRef = this.firestore
        .collection('workspaces')
        .doc(workspaceId)
        .collection('channels')
        .doc(channelId)
        .collection('messages')
        .doc(messageId);

      await messageRef.update({
        text,
        dc_msg_full,
        updatedAt: new Date(),
      });

      return {
        id: messageId,
        workspaceId,
        channelId,
        text,
        dc_msg_full,
      };
    } catch (error) {
      console.error('Update My SLACK Message Fail:', error);

      throw error;
    }
  }

  // ============================================================
  // SEND ONE FCM NOTIFICATION
  // ============================================================

  async sendNotification(
    token: string,
    title: string,
    body: string,
    data: Record<string, string> = {},
  ) {
    try {
      const response = await this.messaging.send({
        token,

        notification: {
          title,
          body,
        },

        data,
      });

      console.log('FCM notification sent:', response);

      return response;
    } catch (error: any) {
      // --------------------------------------------------------
      // TOKEN IS NO LONGER VALID
      // --------------------------------------------------------

      if (
        error?.code === 'messaging/registration-token-not-registered' ||
        error?.code === 'messaging/invalid-registration-token'
      ) {
        console.log(
          'FCM token is no longer registered:',
          this.maskToken(token),
        );

        // Return null.
        //
        // The caller has userId and will remove the token
        // from the correct user's Firestore collection.
        return null;
      }

      console.error('FCM notification failed:', error);

      throw error;
    }
  }

  // ============================================================
  // SAVE FCM TOKEN
  // ============================================================

  async saveFcmToken(userId: string, token: string) {
    try {
      if (!userId || !token) {
        throw new Error('userId and token are required');
      }

      // Deterministic document ID based on token.
      const tokenId = Buffer.from(token).toString('base64url');

      const tokenRef = this.firestore
        .collection('users')
        .doc(userId)
        .collection('fcmTokens')
        .doc(tokenId);

      const existing = await tokenRef.get();

      if (existing.exists) {
        await tokenRef.update({
          token,
          updatedAt: new Date(),
        });
      } else {
        await tokenRef.set({
          token,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      console.log('FCM token saved:', userId, this.maskToken(token));

      return {
        success: true,
        userId,
      };
    } catch (error) {
      console.error('Failed to save FCM token:', error);

      throw error;
    }
  }

  // ============================================================
  // GET FCM TOKENS
  // ============================================================

  async getFcmTokens(userId: string): Promise<string[]> {
    const snapshot = await this.firestore
      .collection('users')
      .doc(userId)
      .collection('fcmTokens')
      .get();

    return snapshot.docs
      .map((doc) => doc.data().token)
      .filter(
        (token): token is string =>
          typeof token === 'string' && token.length > 0,
      );
  }

  // ============================================================
  // REMOVE INVALID FCM TOKEN
  // ============================================================

  private async removeFcmToken(
    userId: string,
    token: string,
  ): Promise<boolean> {
    try {
      // --------------------------------------------------------
      // First try deterministic document ID.
      // This is how saveFcmToken() stores the token.
      // --------------------------------------------------------

      const tokenId = Buffer.from(token).toString('base64url');

      const tokenRef = this.firestore
        .collection('users')
        .doc(userId)
        .collection('fcmTokens')
        .doc(tokenId);

      const snapshot = await tokenRef.get();

      if (snapshot.exists) {
        await tokenRef.delete();

        console.log('Deleted stale FCM token:', userId, this.maskToken(token));

        return true;
      }

      // --------------------------------------------------------
      // Fallback:
      // Find the token by its actual token value.
      // --------------------------------------------------------

      const tokenSnapshot = await this.firestore
        .collection('users')
        .doc(userId)
        .collection('fcmTokens')
        .where('token', '==', token)
        .get();

      if (!tokenSnapshot.empty) {
        const batch = this.firestore.batch();

        for (const doc of tokenSnapshot.docs) {
          batch.delete(doc.ref);
        }

        await batch.commit();

        console.log(
          `Deleted ${tokenSnapshot.size} stale FCM token record(s):`,
          userId,
          this.maskToken(token),
        );

        return true;
      }

      console.log(
        'Stale FCM token was not found:',
        userId,
        this.maskToken(token),
      );

      return false;
    } catch (error) {
      console.error(
        'Failed to remove stale FCM token:',
        userId,
        this.maskToken(token),
        error,
      );

      return false;
    }
  }

  // ============================================================
  // MASK TOKEN FOR LOGGING
  // ============================================================

  private maskToken(token: string): string {
    if (!token) {
      return '';
    }

    if (token.length <= 20) {
      return `${token.slice(0, 6)}...`;
    }

    return `${token.slice(0, 12)}...` + `${token.slice(-8)}`;
  }

  // ============================================================
  // SEND NOTIFICATION TO USER
  // ============================================================

  async sendNotificationToUser(
    userId: string,
    title: string,
    body: string,
    data: Record<string, string> = {},
  ) {
    const tokens = await this.getFcmTokens(userId);

    console.log(`Found ${tokens.length} FCM token(s) for user ${userId}`);

    if (!tokens.length) {
      return {
        success: false,
        message: 'No FCM tokens found',
        results: [],
        summary: {
          total: 0,
          sent: 0,
          removed: 0,
          failed: 0,
        },
      };
    }

    const results: Array<{
      token: string;
      success: boolean;
      removed?: boolean;
      response?: any;
      error?: any;
    }> = [];

    // ----------------------------------------------------------
    // Send to every registered token
    // ----------------------------------------------------------

    for (const token of tokens) {
      try {
        const response = await this.sendNotification(token, title, body, data);

        // ------------------------------------------------------
        // SUCCESS
        // ------------------------------------------------------

        if (response) {
          results.push({
            token: this.maskToken(token),
            success: true,
            response,
          });

          continue;
        }

        // ------------------------------------------------------
        // INVALID TOKEN
        //
        // sendNotification() returned null because Firebase
        // said the token is no longer registered.
        // ------------------------------------------------------

        console.log('Removing stale FCM token:', this.maskToken(token));

        const removed = await this.removeFcmToken(userId, token);

        results.push({
          token: this.maskToken(token),
          success: false,
          removed,
          error: 'FCM token is no longer registered',
        });
      } catch (error: any) {
        // ------------------------------------------------------
        // OTHER FCM ERROR
        // ------------------------------------------------------

        console.error(
          'Failed to send notification to token:',
          this.maskToken(token),
          error,
        );

        results.push({
          token: this.maskToken(token),
          success: false,
          removed: false,
          error: error?.message || error,
        });
      }
    }

    // ==========================================================
    // SUMMARY
    // ==========================================================

    const successful = results.filter((result) => result.success).length;

    const removed = results.filter((result) => result.removed === true).length;

    const failed = results.filter(
      (result) => !result.success && result.removed !== true,
    ).length;

    console.log(
      `FCM notification summary: ` +
        `sent=${successful}, ` +
        `removed=${removed}, ` +
        `failed=${failed}`,
    );

    return {
      success: successful > 0,

      results,

      summary: {
        total: results.length,
        sent: successful,
        removed,
        failed,
      },
    };
  }
}
