import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'share_links' })
export class ShareLink {
  @Prop({ type: Types.ObjectId, ref: 'File', required: true, index: true })
  fileId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true })
  tokenHash: string;

  @Prop({ required: true })
  expiresAt: Date;
}

export type ShareLinkDocument = ShareLink & Document;
export const ShareLinkSchema = SchemaFactory.createForClass(ShareLink);
ShareLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
