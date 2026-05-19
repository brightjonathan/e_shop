import Notiflix, { Confirm } from "notiflix";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export const handleSignOut = async (
  signOutUser: () => Promise<void>,
  router: AppRouterInstance
) => {
  Confirm.show(
    "Sign Out",
    "Are you sure you want to sign out?",
    "Yes",
    "Cancel",
    async () => {
      try {
        await signOutUser();

        Notiflix.Notify.success(
          "Signed out successfully!"
        );

        router.push("/", {
        scroll: false,
        });
      } catch (error) {
        Notiflix.Notify.failure(
          "Failed to sign out. Please try again."
        );

        console.error(error);
      }
    }
  );
};