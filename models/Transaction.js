import mongoose from "../config/database";
const Schema = mongoose.Schema;

const TransactionSchema = new Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User"
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User"
    },
    product: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Product"
    },
    state: {
      type: String,
      default: "start",
    },
    inputNumber: {
      type: Number
    }
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
  }
);

export default mongoose.conn.model("Transaction", TransactionSchema, "transactions");
