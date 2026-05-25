import mongoose, { Schema, Document } from 'mongoose';

// User Interface & Schema
export interface IUser extends Document {
  userId: string;
  email: string;
  name?: string;
  credits: number;
  subscriptionTier: 'free' | 'pro' | 'business';
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'trialing';
  subscriptionCurrentPeriodEnd?: Date;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  userId: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  name: { type: String },
  credits: { type: Number, default: 100 },
  subscriptionTier: { type: String, enum: ['free', 'pro', 'business'], default: 'free' },
  subscriptionStatus: { type: String, enum: ['active', 'canceled', 'past_due', 'trialing'], default: 'trialing' },
  subscriptionCurrentPeriodEnd: { type: Date },
  avatarUrl: { type: String },
}, { timestamps: true });

// Project Interface & Schema
export interface IProject extends Document {
  userId: string;
  name: string;
  description?: string;
  brandColor?: string;
  logoUrl?: string;
  watermarkUrl?: string;
  settings?: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  brandColor: { type: String },
  logoUrl: { type: String },
  watermarkUrl: { type: String },
  settings: { type: Schema.Types.Mixed, default: {} },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// VideoTemplate Interface & Schema
export interface IVideoTemplate extends Document {
  userId: string;
  projectId?: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  templateType: 'intro' | 'outro' | 'transition' | 'text_overlay' | 'custom';
  assets: any;
  settings: any;
  isPublic: boolean;
  category?: string;
  tags: string[];
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const VideoTemplateSchema: Schema = new Schema({
  userId: { type: String, required: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  name: { type: String, required: true },
  description: { type: String },
  templateType: { type: String, enum: ['intro', 'outro', 'transition', 'text_overlay', 'custom'], default: 'custom' },
  assets: { type: Schema.Types.Mixed, default: {} },
  settings: { type: Schema.Types.Mixed, default: {} },
  isPublic: { type: Boolean, default: false },
  category: { type: String },
  tags: { type: [String], default: [] },
  usageCount: { type: Number, default: 0 },
}, { timestamps: true });

// VideoGeneration Interface & Schema
export interface IVideoGeneration extends Document {
  userId: string;
  projectId?: mongoose.Types.ObjectId;
  templateId?: mongoose.Types.ObjectId;
  prompt: string;
  style: string;
  duration: number;
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  outputUrl?: string;
  thumbnailUrl?: string;
  metadata?: any;
  errorMessage?: string;
  creditsUsed: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VideoGenerationSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  templateId: { type: Schema.Types.ObjectId, ref: 'VideoTemplate' },
  prompt: { type: String, required: true },
  style: { type: String, required: true },
  duration: { type: Number, required: true },
  aspectRatio: { type: String, enum: ['9:16', '16:9', '1:1', '4:5'], default: '9:16' },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending', index: true },
  progress: { type: Number, default: 0 },
  outputUrl: { type: String },
  thumbnailUrl: { type: String },
  metadata: { type: Schema.Types.Mixed, default: {} },
  errorMessage: { type: String },
  creditsUsed: { type: Number, default: 1 },
  completedAt: { type: Date },
}, { timestamps: true });

// ScheduledPost Interface & Schema
export interface IScheduledPost extends Document {
  userId: string;
  projectId?: mongoose.Types.ObjectId;
  videoGenerationId?: mongoose.Types.ObjectId;
  platform: 'youtube' | 'instagram' | 'tiktok' | 'email';
  scheduledTime: Date;
  timezone: string;
  status: 'scheduled' | 'posted' | 'failed' | 'canceled';
  postData: any;
  platformPostId?: string;
  errorMessage?: string;
  postedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduledPostSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  videoGenerationId: { type: Schema.Types.ObjectId, ref: 'VideoGeneration' },
  platform: { type: String, enum: ['youtube', 'instagram', 'tiktok', 'email'], required: true },
  scheduledTime: { type: Date, required: true, index: true },
  timezone: { type: String, required: true },
  status: { type: String, enum: ['scheduled', 'posted', 'failed', 'canceled'], default: 'scheduled', index: true },
  postData: { type: Schema.Types.Mixed, default: {} },
  platformPostId: { type: String },
  errorMessage: { type: String },
  postedAt: { type: Date },
}, { timestamps: true });

// PlatformConnection Interface & Schema
export interface IPlatformConnection extends Document {
  userId: string;
  platform: 'youtube' | 'instagram' | 'tiktok' | 'email';
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  platformUserId: string;
  platformUserName?: string;
  platformUserEmail?: string;
  profilePicture?: string;
  isActive: boolean;
  settings?: any;
  createdAt: Date;
  updatedAt: Date;
}

const PlatformConnectionSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  platform: { type: String, enum: ['youtube', 'instagram', 'tiktok', 'email'], required: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String },
  tokenExpiresAt: { type: Date },
  platformUserId: { type: String, required: true },
  platformUserName: { type: String },
  platformUserEmail: { type: String },
  profilePicture: { type: String },
  isActive: { type: Boolean, default: true },
  settings: { type: Schema.Types.Mixed, default: {} },
});
PlatformConnectionSchema.index({ userId: 1, platform: 1 }, { unique: true });

// CreditTransaction Interface & Schema
export interface ICreditTransaction extends Document {
  userId: string;
  type: 'purchase' | 'usage' | 'refund' | 'bonus';
  amount: number;
  description: string;
  referenceId?: string;
  metadata?: any;
  createdAt: Date;
}

const CreditTransactionSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  type: { type: String, enum: ['purchase', 'usage', 'refund', 'bonus'], required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  referenceId: { type: String },
  metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: { createdAt: true, updatedAt: false } });

// LyricsAutomation Interface & Schema
export interface ILyricsAutomation extends Document {
  userId: string;
  isActive: boolean;
  selectedSongs: string[];
  textColor: string;
  font: string;
  backgroundGradient: string;
  createdAt: Date;
  updatedAt: Date;
}

const LyricsAutomationSchema: Schema = new Schema({
  userId: { type: String, required: true, unique: true, index: true },
  isActive: { type: Boolean, default: false },
  selectedSongs: { type: [String], default: ['all'] },
  textColor: { type: String, default: '#ef4444' },
  font: { type: String, default: 'Caveat' },
  backgroundGradient: { type: String, default: 'chashma-lagwla' }
}, { timestamps: true });

// Exporting Models
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const Project = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
export const VideoTemplate = mongoose.models.VideoTemplate || mongoose.model<IVideoTemplate>('VideoTemplate', VideoTemplateSchema);
export const VideoGeneration = mongoose.models.VideoGeneration || mongoose.model<IVideoGeneration>('VideoGeneration', VideoGenerationSchema);
export const ScheduledPost = mongoose.models.ScheduledPost || mongoose.model<IScheduledPost>('ScheduledPost', ScheduledPostSchema);
export const PlatformConnection = mongoose.models.PlatformConnection || mongoose.model<IPlatformConnection>('PlatformConnection', PlatformConnectionSchema);
export const CreditTransaction = mongoose.models.CreditTransaction || mongoose.model<ICreditTransaction>('CreditTransaction', CreditTransactionSchema);
export const LyricsAutomation = mongoose.models.LyricsAutomation || mongoose.model<ILyricsAutomation>('LyricsAutomation', LyricsAutomationSchema);

