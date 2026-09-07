import { Injectable } from '@nestjs/common';

import { getApps, initializeApp, cert } from 'firebase-admin/app';

import { getFirestore } from 'firebase-admin/firestore';

@Injectable()
export class MessagesService {
  private readonly firestore;

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
  }

  async sendMessage(
    workspaceId: string,
    channelId: string,
    userId: string,
    userName: string,
    text: string,
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
}
