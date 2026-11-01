
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';

const LoginPage = () => {
    const { user, login } = useContext(AuthContext);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (user) return <Navigate to="/" replace />;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSubmitting) return;

        setError('');
        setIsSubmitting(true);

        try {
            await login({ email, password });
        } catch (err) {
            const detail = err.response?.data?.detail;

            setError(
                typeof detail === 'string'
                    ? detail
                    : 'Login failed. Please verify your credentials.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative isolate min-h-screen min-h-[100dvh] w-full overflow-x-hidden bg-whatsapp-bg flex items-center justify-center px-4 py-8 sm:px-6">

            {/* Green Background */}
            <div className="absolute top-0 left-0 w-full h-44 sm:h-56 bg-[#00a884] -z-10" />

            {/* Main Login Card */}
            <div className="relative z-10 bg-white rounded-xl shadow-xl w-full max-w-5xl flex flex-col md:flex-row overflow-hidden">

                {/* Left Information Panel - Desktop and Tablet */}
                <div className="hidden md:flex md:w-1/2 bg-gray-50 p-8 lg:p-12 flex-col justify-center border-r border-gray-200">

                    <h1 className="text-3xl lg:text-4xl font-light text-gray-800 mb-8 font-sans">
                        Use WhatsApp on your computer
                    </h1>

                    <ol className="text-gray-600 space-y-5 text-base lg:text-lg list-decimal pl-5 marker:text-gray-800 marker:font-bold">

                        <li>
                            Open WhatsApp Clone application
                        </li>

                        <li>
                            Enter your registered email and password
                        </li>

                        <li>
                            Log in to start chatting with your contacts
                        </li>

                    </ol>

                    <div className="mt-12 text-sm text-gray-400">
                        * Prototype version: Log in to begin.
                    </div>

                </div>

                {/* Right Login Panel */}
                <div className="w-full md:w-1/2 p-6 sm:p-10 lg:p-12 flex flex-col justify-center items-center">

                    {/* Branding */}
                    <div className="text-center mb-7">

                        <h1 className="text-3xl font-bold text-[#008069] mb-2">
                            WhatsApp
                        </h1>

                        <h2 className="text-xl sm:text-2xl font-medium text-gray-700">
                            Welcome Back
                        </h2>

                        <p className="text-sm text-gray-500 mt-2">
                            Login to continue to your account
                        </p>

                    </div>

                    {/* Login Form */}
                    <form
                        onSubmit={handleSubmit}
                        className="w-full max-w-sm flex flex-col gap-5"
                    >

                        {/* Error Message */}
                        {error && (
                            <div
                                role="alert"
                                className="text-red-500 text-sm text-center bg-red-50 px-3 py-3 rounded-lg break-words"
                            >
                                {error}
                            </div>
                        )}

                        {/* Email */}
                        <input
                            type="email"
                            autoComplete="email"
                            inputMode="email"
                            placeholder="Email Address"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full min-w-0 border-b-2 border-whatsapp-teal outline-none py-3 px-1 text-base text-gray-800 placeholder-gray-400 focus:border-[#008069] transition-colors"
                        />

                        {/* Password */}
                        <input
                            type="password"
                            autoComplete="current-password"
                            placeholder="Password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full min-w-0 border-b-2 border-whatsapp-teal outline-none py-3 px-1 text-base text-gray-800 placeholder-gray-400 focus:border-[#008069] transition-colors"
                        />

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full min-h-[48px] bg-[#008069] hover:bg-[#00a884] disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 px-4 rounded-full font-medium mt-3 transition-colors shadow-md"
                        >
                            {isSubmitting ? 'Logging in...' : 'Log In'}
                        </button>

                        {/* Signup Link */}
                        <div className="text-center mt-3 text-sm sm:text-base text-gray-500">

                            Don't have an account?{' '}

                            <Link
                                to="/signup"
                                className="text-[#008069] hover:underline font-semibold"
                            >
                                Sign up
                            </Link>

                        </div>

                    </form>

                </div>

            </div>

        </div>
    );
};

export default LoginPage;
