import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subsriber: {
      type: Schema.Types.ObjectId, //the onw who is subscribing
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId, //the one to whome subscriber is subscribing
      ref: "User",
    },
  },
  { timestamps: true }
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);
