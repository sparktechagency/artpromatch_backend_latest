import { Schema } from 'mongoose';
import { IMessage, MessageType, MessageTypeValues } from './message.interface';
import { model } from 'mongoose';

export const MessageSchema: Schema<IMessage> = new Schema<IMessage>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'Auth',
      required: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'Auth',
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    messageType: {
      type: String,
      enum: MessageTypeValues,
      default: MessageType.text,
      required: true,
    },
    roomId: {
      type: String,
      required: true,
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    is_read: {
      type: Boolean,
      default: false,
    },
    priorityLevel: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal',
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false, toJSON: { virtuals: true } }
);

export const MessageModel = model<IMessage>('Message', MessageSchema);
