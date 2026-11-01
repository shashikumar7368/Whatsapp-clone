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

    if (user) return <Navigate to="/" replace />;

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await authService.signup(formData);
            // Auto login after signup
            await login({ email: formData.email, password: formData.password });
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.detail || 'Signup failed');
        }
    };

    return (
        <div className="min-h-screen bg-whatsapp-bg flex flex-col items-center pt-20">
            <div className="bg-[#00a884] h-[222px] w-full absolute top-0 z-0"></div>

            <div className="z-10 bg-white rounded-lg shadow-xl w-[90%] max-w-[500px] flex flex-col items-center p-12">
                <h2 className="text-2xl font-medium text-gray-700 mb-6">Create Account</h2>

                {error && <div className="text-red-500 text-sm mb-4 w-full text-center bg-red-50 py-2 rounded">{error}</div>}

                <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
                    <input
                        name="name"
                        required
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full border-b-2 border-whatsapp-teal outline-none py-2 px-1 text-gray-800 placeholder-gray-400"
                    />
                    <input
                        name="email"
                        type="email"
                        required
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full border-b-2 border-whatsapp-teal outline-none py-2 px-1 text-gray-800 placeholder-gray-400"
                    />
                    <input
                        name="phone"
                        required
                        placeholder="Phone Number"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full border-b-2 border-whatsapp-teal outline-none py-2 px-1 text-gray-800 placeholder-gray-400"
                    />
                    <input
                        name="password"
                        type="password"
                        required
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full border-b-2 border-whatsapp-teal outline-none py-2 px-1 text-gray-800 placeholder-gray-400"
                    />

                    <button
                        type="submit"
                        className="w-full bg-[#008069] hover:bg-[#00a884] text-white py-3 rounded-full font-medium mt-4 shadow-md transition-colors"
                    >
                        Sign Up
                    </button>

                    <div className="text-center mt-2 text-sm text-gray-500">
                        Already have an account? <Link to="/login" className="text-[#008069] hover:underline font-medium">Log in</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignupPage;
