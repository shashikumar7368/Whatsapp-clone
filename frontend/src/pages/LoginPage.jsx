import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';

const LoginPage = () => {
    const { user, login } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    if (user) return <Navigate to="/" replace />;

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login({ email, password });
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed. Please verify credentials.');
        }
    };

    return (
        <div className="min-h-screen bg-whatsapp-bg flex flex-col items-center pt-20">
            <div className="bg-[#00a884] h-[222px] w-full absolute top-0 z-0"></div>

            <div className="z-10 bg-white rounded-lg shadow-xl w-[90%] max-w-[1000px] flex overflow-hidden min-h-[500px]">
                <div className="w-1/2 bg-gray-50 p-12 flex flex-col justify-center border-r border-gray-200">
                    <h1 className="text-3xl font-light text-gray-800 mb-6 font-sans">Use WhatsApp on your computer</h1>
                    <ol className="text-gray-600 space-y-4 text-lg list-decimal pl-5 marker:text-gray-800 marker:font-bold">
                        <li>Open WhatsApp cloned app</li>
                        <li>Tap <strong>Menu</strong> or <strong>Settings</strong></li>
                        <li>Tap <strong>Linked devices</strong> then <strong>Link a device</strong></li>
                    </ol>

                    <div className="mt-auto text-sm text-gray-400">
                        * Prototype version: Just log in to begin.
                    </div>
                </div>

                <div className="w-1/2 p-12 flex flex-col justify-center items-center">
                    <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-5">
                        <h2 className="text-2xl font-medium text-gray-700 mb-2">Login to Prototype</h2>
                        {error && <div className="text-red-500 text-sm">{error}</div>}

                        <input
                            type="email"
                            placeholder="Email Address"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border-b-2 border-whatsapp-teal outline-none py-2 px-1 text-gray-800 placeholder-gray-400"
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border-b-2 border-whatsapp-teal outline-none py-2 px-1 text-gray-800 placeholder-gray-400"
                        />

                        <button
                            type="submit"
                            className="w-full bg-[#008069] hover:bg-[#00a884] text-white py-3 rounded-full font-medium mt-4 transition-colors shadow-md"
                        >
                            Log In
                        </button>

                        <div className="text-center mt-4 text-sm text-gray-500">
                            Don't have an account? <Link to="/signup" className="text-[#008069] hover:underline font-medium">Sign up</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
