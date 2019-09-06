import mongoose from "../config/database";
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    email: {
      type: String
    },
    password: {
      type: String
    },
    nickname: {
      type: String
    },
    profileImagePath: {
      type: String
    },
    signature: {
      type: String
    },
    emailConfirmKey: {
      type: String
    },
    isValid: {
      type: Boolean,
      default: false
    },
    isDeactive: {
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

export default mongoose.conn.model("User", UserSchema, "users");
