import { SignUp } from "@clerk/react";

function AdminSignUp() {
  return (
    <div className="min-h-screen bg-navy-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-md overflow-hidden">
        <div className="bg-navy-700 p-6 sm:p-8 text-center">
          <img src="/logo.png" alt="Adiyogi" className="h-12 sm:h-16 mx-auto mb-3" />
          <h1 className="font-display font-bold text-white text-xl sm:text-2xl">Create Account</h1>
          <p className="text-navy-200 text-xs sm:text-sm">Adiyogi International</p>
        </div>
        <div className="p-5 sm:p-8">
          <SignUp
            routing="hash"
            signInUrl="/admin"
            appearance={{
            appearance={{
              variables: {
                colorPrimary: '#1B3A6B',
                colorTextOnPrimary: '#ffffff',
                colorBackground: '#ffffff',
                colorInputBackground: '#ffffff',
                colorInputText: '#1B3A6B',
                borderRadius: '0.5rem',
                fontFamily: 'DM Sans, sans-serif',
              },
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-0",
                headerTitle: "font-display font-bold text-navy-800 text-xl hidden",
                headerSubtitle: "text-gray-500 text-sm hidden",
                socialButtonsBlockButton: "border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg py-2.5 transition-colors",
                socialButtonsBlockButtonText: "font-medium text-sm",
                formFieldLabel: "text-gray-700 font-semibold text-sm",
                formFieldInput: "border border-gray-300 rounded-lg px-3 py-2.5 text-navy-800 focus:ring-2 focus:ring-navy-700 focus:border-navy-700 transition-all",
                formButtonPrimary: "bg-navy-700 hover:bg-navy-800 text-white font-semibold rounded-lg py-2.5 px-4 transition-colors",
                footerActionLink: "text-navy-700 hover:text-navy-800 font-medium text-sm",
                dividerLine: "bg-gray-200",
                dividerText: "text-gray-400 text-xs uppercase",
                identityPreviewText: "text-gray-700 text-sm",
                identityPreviewEditButton: "text-navy-700 hover:text-navy-800",
                formFieldInputShowPasswordButton: "text-gray-400 hover:text-navy-700",
                footer: "hidden",
                header: "hidden",
                otpCodeFieldInput: "border border-gray-300 rounded-lg text-navy-700 text-center text-lg",
                formFieldError: "text-red-500 text-xs",
              },
            }}
          />
          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{" "}
            <a href="/admin" className="text-navy-600 font-semibold hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminSignUp;