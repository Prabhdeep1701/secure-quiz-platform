# Firebase Indexes Setup Guide

## Current Status: ✅ Fixed

The application has been updated to avoid requiring composite indexes by sorting data in memory instead of in the database. This eliminates the need for complex indexes.

## If You Want to Use Database Indexes (Optional)

If you prefer to use database indexes for better performance with large datasets, you can create the following indexes in your Firebase Console:

### 1. Lessons Collection Index
- **Collection**: `lessons`
- **Fields**: 
  - `author` (Ascending)
  - `createdAt` (Descending)

### 2. Quizzes Collection Index
- **Collection**: `quizzes`
- **Fields**:
  - `author` (Ascending)
  - `createdAt` (Descending)

### 3. Student Lessons Index
- **Collection**: `lessons`
- **Fields**:
  - `status` (Ascending)
  - `createdAt` (Descending)

### 4. Student Quizzes Index
- **Collection**: `quizzes`
- **Fields**:
  - `status` (Ascending)
  - `createdAt` (Descending)

## How to Create Indexes

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** → **Indexes** tab
4. Click **Create Index**
5. Add the fields as specified above
6. Wait for the index to build (usually takes a few minutes)

## Performance Considerations

- **Current Approach (In-Memory Sorting)**: Good for small to medium datasets (< 1000 documents per user)
- **Database Indexes**: Better for large datasets and real-time performance

The current implementation should work well for most educational use cases. 