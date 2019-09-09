import mongoose from "../config/database";
const Schema = mongoose.Schema;

const ProductSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User"
    },
    title: {
      type: String
    },
    content: {
      type: String
    },
    price: {
      type: Number
    },
    images: {
      type: [String]
    },
    isValid: {
      type: Boolean,
      default: false
    },
    ipAddr: {
      type: String
    }
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
  }
);

export default mongoose.conn.model("Product", ProductSchema, "products");
