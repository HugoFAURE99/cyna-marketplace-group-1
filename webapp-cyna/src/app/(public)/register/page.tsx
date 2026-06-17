import { RegisterForm } from "@/components/connection/register-form";

export default function Register() {
  return (
    <>
      <div className="flex justify-center mt-5">
        <div>
          <div className="my-10 text-center">
            <h1 className="text-3xl font-bold mb-5">Register</h1>
            <p>Create a new account</p>
          </div>
          <div className="h-100 w-100">
            <RegisterForm />
          </div>
        </div>
      </div>
    </>
  );
}
