import { useEffect } from "react";

import { useNavigate, useSearchParams } from "react-router";

import PasswordResetForm from "@/components/auth/PasswordResetForm/PasswordResetForm";
import { toaster } from "@/components/ui/toaster";
import ClientRoutes from "@/constants/client-routes";

const PASSWORD_CHANGED_MESSAGE =
  "Password changed successfully. Please log in with your new password.";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const uid = searchParams.get("uid");

  useEffect(() => {
    if (token && uid) return;

    toaster.error({
      title: "Invalid URL",
      description: "The password reset link is invalid.",
    });
    navigate(`${ClientRoutes.AUTH}/${ClientRoutes.LOGIN}`, { replace: true });
  }, [navigate, token, uid]);

  if (!token || !uid) return null;

  return (
    <PasswordResetForm
      uid={uid}
      token={token}
      title="Reset your password"
      submitLabel="Reset password"
      onSuccess={(redirectTo) =>
        navigate(redirectTo || `${ClientRoutes.AUTH}/${ClientRoutes.LOGIN}`, {
          replace: true,
          state: { message: PASSWORD_CHANGED_MESSAGE },
        })
      }
    />
  );
};

export default ResetPassword;
