import connectDB from "../../../lib/mongodb";
import {
  createAccount,
  fetchAccountsByUserId,
  deleteAccountById,
  updateAccount,
} from "@/services/accountService";
import { authenticate } from "@/utils/backend/authMiddleware";
import { getCache, delCache } from "@/lib/useCache";

export default async function handler(req, res) {
  await connectDB();

  const userId = authenticate(req);

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  switch (req.method) {
    case "GET":
      try {
        const accounts = await getCache({
          key: userId,
          prefix: "accounts",
          ttl: 60 * 60 * 24 * 4, // 4 days
          fetchFn: () => fetchAccountsByUserId(userId),
        });

        res
          .status(200)
          .json({ message: "Accounts fetched successfully.", accounts });
      } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
      }
      break;

    case "POST":
      try {
        const newAccount = await createAccount(userId, req.body);
        // Invalidate cached accounts for this user
        await delCache({ key: userId, prefix: "accounts" });
        await delCache({
          key: userId,
          prefix: "total-balance",
        });
        res.status(201).json({
          message: "Account created successfully.",
          account: newAccount,
        });
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
      break;

    case "DELETE":
      try {
        const { id: accountId } = req.query;

        const result = await deleteAccountById(accountId, userId);
        // Invalidate cached accounts for this user
        await delCache({ key: userId, prefix: "accounts" });
        await delCache({
          key: userId,
          prefix: "total-expense",
        });
        await delCache({
          key: userId,
          prefix: "total-balance",
        });

        res.status(200).json(result);
      } catch (error) {
        const status = error.message === "Account not found" ? 404 : 500;
        res.status(status).json({ message: error.message });
      }
      break;

    case "PUT":
      try {
        const { id } = req.query;
        const updatedAccount = await updateAccount(id, userId, req.body);
        // Invalidate cached accounts for this user
        await delCache({ key: userId, prefix: "accounts" });
        await delCache({
          key: userId,
          prefix: "total-balance",
        });

        res.status(200).json({
          message: "Account updated successfully.",
          account: updatedAccount,
        });
      } catch (error) {
        res.status(error.statusCode || 500).json({
          message: error.message || "Server error",
        });
      }
      break;

    default:
      res.setHeader("Allow", ["GET", "POST", "DELETE", "PUT"]);
      res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
