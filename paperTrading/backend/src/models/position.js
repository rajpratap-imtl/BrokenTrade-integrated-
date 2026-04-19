import mongoose from "mongoose";

const positionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    avgPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    currentPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    pnl: {
      type: Number,
      default: 0,
    },
  },
  {
    collection: "positions",
    timestamps: { createdAt: true, updatedAt: true },
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  },
);

positionSchema.index({ userId: 1, symbol: 1 }, { unique: true });

const Position = mongoose.models.Position || mongoose.model("Position", positionSchema);

export default Position;
