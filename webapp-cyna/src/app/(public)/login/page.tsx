import { LoginForm } from "@/components/connection/login-form";

export default function Login() {
  return (
    <>
      <div className="flex justify-center mt-5">
        <div className="w-50"></div>
        <div>
          <div className="my-10 text-center">
            <h1 className="text-3xl font-bold mb-5">Log In</h1>
            <p>Login to your account</p>
          </div>
          <div className="h-100 w-100">
            <LoginForm />
          </div>
        </div>
        <div className="w-50"></div>
      </div>
    </>
  );
}
