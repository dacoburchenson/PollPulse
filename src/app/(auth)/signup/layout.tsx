import { Logo } from "@/components/logo";

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    return (
    <div>
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="flex justify-center">
                <Logo />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
                Create your account
            </h2>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10">
                {children}
            </div>
        </div>
    </div>
  );
}
