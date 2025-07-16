import mongoose, { Schema, Document, Types, models } from 'mongoose';

export interface IQuestion {
  type: 'multiple-choice' | 'checkbox' | 'short-answer' | 'paragraph';
  question: string;
  options?: string[];
  correctAnswers?: number[];
  required?: boolean;
}

export interface IQuiz extends Document {
  title: string;
  description?: string;
  questions: IQuestion[];
  status: 'draft' | 'published';
  author: Types.ObjectId;
  link: string;
}

const QuestionSchema = new Schema<IQuestion>({
  type: { type: String, enum: ['multiple-choice', 'checkbox', 'short-answer', 'paragraph'], required: true },
  question: { type: String, required: true },
  options: [String],
  correctAnswers: [Number],
  required: { type: Boolean, default: false },
});

const QuizSchema = new Schema<IQuiz>({
  title: { type: String, required: true },
  description: String,
  questions: [QuestionSchema],
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  link: { type: String, required: true, unique: true },
}, { timestamps: true });

export default models.Quiz || mongoose.model<IQuiz>('Quiz', QuizSchema); 