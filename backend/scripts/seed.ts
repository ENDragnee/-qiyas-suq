/*
  Dev seed script — solves the bootstrapping problem: shops are admin-created
  but no admin user can be created through the API (createUserSchema forces
  role:"user", ARCHITECTURE.md §10 item 13). Run this once against a fresh DB
  to get a working admin + shop + regular user.

  Run from the backend dir:
    DATABASE_URL='mongodb://suq:qazwsxedc@localhost:27017/suq?authSource=admin' \
      bun scripts/seed.ts

  DEV ONLY — delete or guard before any production deploy.
*/
import { ConnectDB } from "../src/libs/mongoose";
import { HashPassword } from "../src/libs/password-utils";
import User from "../src/models/user";
import Shop from "../src/models/shop";

async function main() {
  // DEV-ONLY guard: never seed a production database. The seed wipes and
  // recreates the "Seed Shop" plus admin/testuser accounts, so it must not run
  // where ENVIRONMENT=production. Keep this script out of production deploys.
  if (Bun.env.ENVIRONMENT === "production") {
    console.error(
      "Refusing to run the dev seed script in production (ENVIRONMENT=production).",
    );
    process.exit(1);
  }

  await ConnectDB();

  const adminPass = "adminpass123";
  const userPass = "userpass123";

  // Ensure a shop exists for both accounts to belong to.
  await Shop.deleteMany({ name: "Seed Shop" });
  const shop = await Shop.create({
    name: "Seed Shop",
    accounts: ["admin", "testuser"],
    password: await HashPassword(adminPass),
    banner: "",
  });

  // Upsert admin (role: admin — impossible via the signup API).
  await User.deleteMany({ userName: "admin" });
  const admin = await User.create({
    name: "Admin",
    userName: "admin",
    password: await HashPassword(adminPass),
    role: "admin",
    shopId: shop._id,
  });

  // Upsert a regular user in the same shop.
  await User.deleteMany({ userName: "testuser" });
  const user = await User.create({
    name: "Test User",
    userName: "testuser",
    password: await HashPassword(userPass),
    role: "user",
    shopId: shop._id,
  });

  console.log(
    JSON.stringify(
      {
        shop: { id: shop._id.toString(), name: shop.name },
        admin: {
          userName: "admin",
          password: adminPass,
          role: admin.role,
          shopId: admin.shopId.toString(),
        },
        user: {
          userName: "testuser",
          password: userPass,
          role: user.role,
          shopId: user.shopId.toString(),
        },
      },
      null,
      2,
    ),
  );

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
