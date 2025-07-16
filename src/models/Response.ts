import mongoose, { Schema, Document, Types, models } from 'mongoose';

export interface IResponse extends Document {
  quiz: Types.ObjectId;
  student: Types.ObjectId;
  answers: any[];
  submittedAt: Date;
  score?: number;
}

const ResponseSchema = new Schema<IResponse>({
  quiz: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  answers: [{ type: Schema.Types.Mixed, required: true }],
  submittedAt: { type: Date, default: Date.now },
  score: { type: Number, default: 0 },
});

export default models.Response || mongoose.model<IResponse>('Response', ResponseSchema); 