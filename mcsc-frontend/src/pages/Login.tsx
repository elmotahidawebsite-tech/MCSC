import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "node_modules/react-i18next";
import { ROLES } from "../constants/roles";
import { useAuth } from "../context/AuthContext";
import { Lock, LogIn, User, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import type { LoginFormData } from "../types";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "../schemas/loginSchema";


export function Login() {

  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const { t, i18n } = useTranslation(["auth", "common"]);
  const isRtl = i18n.resolvedLanguage === "ar";

  const [loginError, setLoginError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });



  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoginError("");
      setIsSubmitting(true);

      const loggedInUser = await login(data);

      if (loggedInUser.role === ROLES.ADMIN) {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/user/dashboard", { replace: true });
      }
    } catch (error) {

      if (error instanceof Error) {
        setLoginError(error.message);
      } else {
        setLoginError(t("auth:errors.somethingWentWrong"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };




  return (
    <main className="min-h-screen bg-[#f8f9fc] flex items-center justify-center px-4" dir={isRtl ? "rtl" : "ltr"}>
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">

          {/* Logo */}
          <div className="flex justify-center">
            <img
              src="../public/MAI.png"
              alt={t("auth:logoAlt")}
              className="w-45 h-50"
            />
          </div>

          {/* Title */}
          <div className={`text-center mt-5 ${isRtl ? "font-[system-ui]" : ""}`}>
            <h1 className="text-3xl font-bold text-slate-800">
              {t("auth:title")}
            </h1>

            <p className="text-xs tracking-[5px] uppercase text-slate-500 mt-2">
              {t("auth:subtitle")}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)}
            className="mt-10 space-y-7">

            {/* Station ID */}
            <div>
              <label className="block text-xs text-slate-500 mb-2">
                {t("auth:stationId.label")}
              </label>

              <div className={`flex items-center border-b border-gray-300 pb-2 ${isRtl ? "flex-row-reverse" : ""}`}>
                <User className={`w-5 h-5 text-gray-400 ${isRtl ? "ml-3" : "mr-3"}`} />

                <input
                  type="text"
                  placeholder={t("auth:stationId.placeholder")}
                  className={`w-full outline-none bg-transparent ${isRtl ? "text-right" : ""}`}
                  {...register("stationId")}
                />
              </div>
              {errors.stationId && (
                <p className={`mt-2 text-sm text-red-500 ${isRtl ? "text-right" : ""}`}>
                  {errors.stationId.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs text-slate-500 mb-2">
                {t("auth:password.label")}
              </label>

              <div className={`flex items-center border-b border-gray-300 pb-2 ${isRtl ? "flex-row-reverse" : ""}`}>
                <Lock className={`w-5 h-5 text-gray-400 ${isRtl ? "ml-3" : "mr-3"}`} />

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth:password.placeholder")}
                  className={`w-full outline-none bg-transparent ${isRtl ? "text-right" : ""}`}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className={`mt-2 text-sm text-red-500 ${isRtl ? "text-right" : ""}`}>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-[#005588] hover:bg-[#00466f] disabled:bg-gray-400 rounded-lg text-white font-semibold flex items-center justify-center gap-2 transition"
            >
              {isSubmitting ? (
                t("auth:buttons.signingIn")
              ) : (
                <>
                  <LogIn size={18} />
                  {t("auth:buttons.login")}
                </>
              )}
            </button>
            {loginError && (
              <p className="mt-3 text-center text-sm text-red-500">
                {loginError}
              </p>
            )}
          </form>
        </div>

        {/* Footer */}
        <p className={`text-center text-[11px] text-slate-400 mt-8 leading-5 ${isRtl ? "font-[system-ui]" : ""}`}>
          {t("auth:footer.line1")} {t("auth:footer.line2")}
        </p>
      </div>
    </main>
  );
}
