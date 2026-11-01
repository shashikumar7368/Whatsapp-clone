
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { authService } from '../services/authService';
import { Navigate, Link, useNavigate } from 'react-router-dom';

const SignupPage = () => {
    const { user, login } = useContext(AuthContext);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    });

    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (user) return <Navigate to="/" replace />;

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (isSubmitting) return;

        setIsSubmitting(true);

        try {
            await authService.signup(formData);

            // Automatically log in after successful signup
            await login({
                email: formData.email,
                password: formData.password
            });

            navigate('/');
        } catch (err) {
            const detail = err.response?.data?.detail;

            setError(
                typeof detail === 'string'
                    ? detail
                    : 'Signup failed. Please check your details and try again.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative isolate min-h-screen min-h-[100dvh] w-full overflow-x-hidden bg-whatsapp-bg flex items-center justify-center px-4 py-10 sm:px-6">

            {/* Background Header */}
            <div className="absolute top-0 left-0 w-full h-44 sm:h-56 bg-[#00a884] -z-10" />

            {/* Signup Card */}
            <div className="relative z-10 bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col items-center px-5 py-8 sm:px-10 sm:py-10">

                {/* App Name */}
                <h1 className="text-2xl sm:text-3xl font-bold text-[#008069] mb-2">
                    WhatsApp
                </h1>

                <h2 className="text-xl sm:text-2xl font-medium text-gray-700 mb-6 text-center">
                    Create Account
                </h2>

                {/* Error Message */}
                {error && (
                    <div
                        role="alert"
                        className="text-red-500 text-sm mb-4 w-full text-center bg-red-50 py-3 px-3 rounded-lg break-words"
                    >
                        {error}
                    </div>
                )}

                {/* Signup Form */}
                <form
                    onSubmit={handleSubmit}
                    className="w-full flex flex-col gap-5 sm:gap-6"
                >

                    {/* Full Name */}
                    <input
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full min-w-0 border-b-2 border-whatsapp-teal outline-none py-3 px-1 text-base text-gray-800 placeholder-gray-400 focus:border-[#008069] transition-colors"
                    />

                    {/* Email */}
                    <input
                        name="email"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        required
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full min-w-0 border-b-2 border-whatsapp-teal outline-none py-3 px-1 text-base text-gray-800 placeholder-gray-400 focus:border-[#008069] transition-colors"
                    />

                    {/* Phone Number */}
                    <input
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        inputMode="tel"
                        required
                        placeholder="Phone Number"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full min-w-0 border-b-2 border-whatsapp-teal outline-none py-3 px-1 text-base text-gray-800 placeholder-gray-400 focus:border-[#008069] transition-colors"
                    />

                    {/* Password */}
                    <input
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full min-w-0 border-b-2 border-whatsapp-teal outline-none py-3 px-1 text-base text-gray-800 placeholder-gray-400 focus:border-[#008069] transition-colors"
                    />

                    {/* Signup Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full min-h-[48px] bg-[#008069] hover:bg-[#00a884] disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 px-4 rounded-full font-medium mt-3 shadow-md transition-colors"
                    >
                        {isSubmitting ? 'Creating Account...' : 'Sign Up'}
                    </button>

                    {/* Login Link */}
                    <div className="text-center mt-2 text-sm sm:text-base text-gray-500">
                        Already have an account?{' '}
                        <Link
                            to="/login"
                            className="text-[#008069] hover:underline font-semibold"
                        >
                            Log in
                        </Link>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default SignupPage;
