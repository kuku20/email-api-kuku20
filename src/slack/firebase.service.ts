import { Injectable } from '@nestjs/common';

import {
  getApps,
  initializeApp,
  cert
} from 'firebase-admin/app';

import {
  getFirestore,
  Firestore
} from 'firebase-admin/firestore';

@Injectable()
export class FirebaseService {

  private readonly firestore: Firestore;

  constructor() {

    if (!getApps().length) {

      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY
            ?.replace(/\\n/g, '\n')
        })
      });

    }

    this.firestore = getFirestore();
  }

  getFirestore(): Firestore {
    return this.firestore;
  }
}

