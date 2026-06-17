import { ResetPasswordForm } from "@/components/connection/reset-password-form";

export default function ResetPassword() {
  return (
    <>
      <div className="flex justify-center mt-5">
        <div>
          <div className="my-10 text-center">
            <h1 className="text-3xl font-bold mb-5">Reset Password</h1>
          </div>
          <div className="h-100 w-100">
            <ResetPasswordForm />
          </div>
        </div>
      </div>
    </>
  );
}
