import { model, Schema } from 'mongoose';
import { ISecretReview } from './secretReview.interface';

const secretReviewSchema = new Schema<ISecretReview>(
  {
    // client: {
    //   type: Schema.Types.ObjectId,
    //   ref: 'Client',
    //   required: true,
    //   unique: true,
    // },
    // artist: {
    //   type: Schema.Types.ObjectId,
    //   ref: 'Client',
    //   required: true,
    //   unique: true,
    // },
    service: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      unique: true,
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      unique: true,
    },

    description: {
      type: String,
      required: [true, 'Secret Review is required!'],
    },
  },
  { timestamps: true, versionKey: false }
);

const SecretReview = model<ISecretReview>('SecretReview', secretReviewSchema);
export default SecretReview;
