import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import AuthLayout from "../../components/auth-layout/AuthLayout";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";

function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  }

  function validate() {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post("/auth/signup", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      navigate("/login");
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Something went wrong. Please check your connection and try again.";
      setServerError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-xl sm:text-2xl font-display font-semibold text-[#121212] mb-1.5">
        Create your account
      </h1>
      <p className="text-[#6B6A63] text-xs sm:text-sm mb-5">
        A quiet place for everything you don't want to forget.
      </p>

      {serverError && (
        <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <div>
          <label htmlFor="name" className="block text-sm text-[#121212] mb-1.5">
            Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6A63]" />
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your name"
              className={`w-full pl-10 pr-4 py-2 sm:py-2.5 bg-white border rounded-lg text-[#121212] placeholder:text-[#6B6A63]/60 text-sm focus:outline-none transition-colors ${errors.name ? "border-red-400 focus:border-red-400" : "border-[#E5E2D9] focus:border-[#F4C430]"
                }`}
            />
          </div>
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm text-[#121212] mb-1.5">
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6A63]" />
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className={`w-full pl-10 pr-4 py-2 sm:py-2.5 bg-white border rounded-lg text-[#121212] placeholder:text-[#6B6A63]/60 text-sm focus:outline-none transition-colors ${errors.email ? "border-red-400 focus:border-red-400" : "border-[#E5E2D9] focus:border-[#F4C430]"
                }`}
            />
          </div>
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm text-[#121212] mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6A63]" />
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              className={`w-full pl-10 pr-10 py-2 sm:py-2.5 bg-white border rounded-lg text-[#121212] placeholder:text-[#6B6A63]/60 text-sm focus:outline-none transition-colors ${errors.password ? "border-red-400 focus:border-red-400" : "border-[#E5E2D9] focus:border-[#F4C430]"
                }`}
            />
            <button
              type="button"
              aria-label="toggle password visibility"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6A63] hover:text-[#121212] transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#F4C430] text-[#121212] py-2.5 rounded-lg font-medium text-sm hover:bg-[#e0b420] transition-colors mt-1 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="text-sm text-[#6B6A63] mt-5 text-center">
        Already have an account?{" "}
        <Link to="/login" className="text-[#F4C430] hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}

export default SignUp;