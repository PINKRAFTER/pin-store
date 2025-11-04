import { getUserById } from "@/lib/actions/user.actions";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import UpdateUserForm from "./update-user-form";
import { updateUserSchema } from "@/lib/validators";
import { z } from "zod";

export const metadata: Metadata = {
  title: "Admin - Edit User",
};

const AdminUserEditPage = async (props: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await props.params;
  const user = await getUserById(id);

  if (!user) notFound();

  return (
    <div className="space-y-8 max-w-lg mx-auto">
      <h1 className="h2-bold">Edit User</h1>
      <UpdateUserForm user={user as z.infer<typeof updateUserSchema>} />
    </div>
  );
};

export default AdminUserEditPage;
