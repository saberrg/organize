import { createClient } from "@/utils/supabase/server";
import { redirect } from 'next/navigation';

export async function checkPermission() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  console.log("User data:", user);

  if (!user) {
    redirect("/sign-in");
  }
  
  // Query the user_roles table to check for roles
  const { data: role, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error("Error fetching roles:", error);
    redirect('/error');
  }

  // Check if user has admin or organizer role
  const hasAccess = role && (role.role === 'admin' || role.role === 'organizer');
  if (!hasAccess) {
    redirect('/unauthorized');
  }

  return user;
} 