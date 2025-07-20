# Firebase Setup Guide

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=LIFwJCLLKfrj+qpWwGNQkkTPWud1whL2GqyWZDfXiZw=

# Firebase Client Configuration (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin Configuration (Private)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Private Key Here\n-----END PRIVATE KEY-----\n"

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key-here
```

## How to Set Up Firebase

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "secure-quiz-platform")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

### 2. Get Firebase Client Configuration

1. In your Firebase project, click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>) to add a web app
5. Register your app with a nickname (e.g., "quiz-platform-web")
6. Copy the configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

7. Use these values in your `.env.local` file for the `NEXT_PUBLIC_FIREBASE_*` variables

### 3. Set Up Firebase Admin SDK

1. In Firebase Console, go to Project Settings
2. Click on "Service accounts" tab
3. Click "Generate new private key"
4. Download the JSON file
5. Use the values from the JSON file in your `.env.local`:
   - `FIREBASE_PROJECT_ID`: The project ID
   - `FIREBASE_CLIENT_EMAIL`: The client_email field
   - `FIREBASE_PRIVATE_KEY`: The private_key field (keep the quotes and \n characters)

### 4. Enable Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location close to your users
5. Click "Done"

### 5. Set Up Security Rules (Optional but Recommended)

In Firestore Database > Rules, replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Teachers can read/write their own lessons
    match /lessons/{lessonId} {
      allow read, write: if request.auth != null && 
        resource.data.author == request.auth.uid;
    }
    
    // Teachers can read/write their own quizzes
    match /quizzes/{quizId} {
      allow read, write: if request.auth != null && 
        resource.data.author == request.auth.uid;
    }
    
    // Students can read published quizzes and write their responses
    match /responses/{responseId} {
      allow read, write: if request.auth != null && 
        resource.data.student == request.auth.uid;
    }
  }
}
```

## Testing Your Setup

1. Copy the `.env.local` file to your project root
2. Start your development server: `npm run dev`
3. Check that your app loads without Firebase errors
4. Try registering a new user to test the database connection

## Security Notes

- Never commit `.env.local` to version control
- Keep your Firebase Admin private key secure
- Use different Firebase projects for development and production
- Regularly rotate your API keys
- Set up proper Firestore security rules for production

## Database Collections

Your app will automatically create these Firestore collections:
- `users` - User accounts and authentication data
- `lessons` - Educational lessons created by teachers
- `quizzes` - Quizzes created by teachers
- `responses` - Student quiz responses and scores 