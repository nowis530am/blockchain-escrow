import mongoose from "../config/database";
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    name: {
      type: String
    },
    phone: {
      type: String
    },
    address: {
      type: String
    },
    zipCode: {
      type: String
    },
    email: {
      type: String
    },
    password: {
      type: String
    },
    profileImagePath: {
      type: String
    },
    account: {
      address: {
        type: String
      },
      privateKey: {
        type: String
      },
    },
    emailConfirmKey: {
      type: String
    },
    isValid: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
  }
);

export default mongoose.conn.model("User", UserSchema, "users");
