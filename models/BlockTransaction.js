import mongoose from "../config/database";
const Schema = mongoose.Schema;

const BlockTransactionSchema = new Schema(
  {
    hash: {
      type: String
    },
    from: {
      type: String
    },
    to: {
      type: String
    },
    product: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Product"
    },
    value: {
      type: String
    },
    user: {
      type: Object
    }
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
  }
);

export default mongoose.conn.model("BlockTransaction", BlockTransactionSchema, "block_transactions");
