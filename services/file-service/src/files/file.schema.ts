import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'files' })
export class File {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true, unique: true })
  storageKey: string;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true })
  mimeType: string;

  @Prop()
  checksumSha256?: string;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export type FileDocument = File & Document;
export const FileSchema = SchemaFactory.createForClass(File);
