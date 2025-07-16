import mongoose, { Schema, Document, Types, models } from 'mongoose';

export interface ILesson extends Document {
  title: string;
  description?: string;
  content: string;
  author: Types.ObjectId;
  status: 'draft' | 'published';
  aiGenerated: boolean;
  originalPrompt?: string;
}

const LessonSchema = new Schema<ILesson>({
  title: { type: String, required: true },
  description: String,
  content: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  aiGenerated: { type: Boolean, default: false },
  originalPrompt: String,
}, { timestamps: true });

export default models.Lesson || mongoose.model<ILesson>('Lesson', LessonSchema); 