import { authAdmin } from "./firebaseAdmin";

async function addCustomClaim(uid, claimKey, claimValue) {
  try {
    const user = await authAdmin.getUser(uid);
    console.log(`User found: ${user.email}`);

    const newClaims = { [claimKey]: claimValue };

    await authAdmin.setCustomUserClaims(uid, newClaims);
    console.log(`Successfully added claim '${claimKey}: ${claimValue}' to user ${uid}`);
  } catch (error) {
    console.error("Error adding custom claim:", error);
  }
}

// Example: Assign "admin" role
const userUID = "AKhVrEmTUpXGC6rAgbpurTCnvN22"; // Replace with target user's UID
addCustomClaim(userUID, "role", "admin");
