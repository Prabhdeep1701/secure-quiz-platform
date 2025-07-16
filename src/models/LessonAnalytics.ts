import mongoose, { Schema, Document, Types, models } from 'mongoose';

export interface ILessonView {
  student: Types.ObjectId;
  viewedAt: Date;
  timeSpent?: number; // in seconds
  completed: boolean;
}

export interface ILessonAnalytics extends Document {
  lesson: Types.ObjectId;
  totalViews: number;
  uniqueViews: number;
  averageTimeSpent: number; // in seconds
  completionRate: number; // percentage
  views: ILessonView[];
  lastViewed: Date;
}

const LessonViewSchema = new Schema<ILessonView>({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  viewedAt: { type: Date, default: Date.now },
  timeSpent: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
});

const LessonAnalyticsSchema = new Schema<ILessonAnalytics>({
  lesson: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true, unique: true },
  totalViews: { type: Number, default: 0 },
  uniqueViews: { type: Number, default: 0 },
  averageTimeSpent: { type: Number, default: 0 },
  completionRate: { type: Number, default: 0 },
  views: [LessonViewSchema],
  lastViewed: { type: Date, default: Date.now },
}, { timestamps: true });

// Index for efficient queries
LessonAnalyticsSchema.index({ lesson: 1 });
LessonAnalyticsSchema.index({ 'views.student': 1 });

export default models.LessonAnalytics || mongoose.model<ILessonAnalytics>('LessonAnalytics', LessonAnalyticsSchema); 