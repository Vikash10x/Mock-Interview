import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema(
  {
    key: { type: String, default: "site_visits", unique: true },
    count: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Visitor", visitorSchema);
