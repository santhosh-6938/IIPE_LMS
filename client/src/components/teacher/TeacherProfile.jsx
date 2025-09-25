import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const TeacherProfile = () => {
	const { user } = useSelector(state => state.auth);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [data, setData] = useState(null);
	const [tab, setTab] = useState('overview'); // overview | archived

	useEffect(() => {
		const run = async () => {
			try {
				setLoading(true);
				const token = localStorage.getItem('token');
				const res = await axios.get(`${API_URL}/profile/me`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
				setData(res.data);
			} catch (e) {
				setError(e?.response?.data?.message || 'Failed to load profile');
			} finally {
				setLoading(false);
			}
		};
		run();
	}, []);

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading profile...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<p className="text-red-600">{error}</p>
			</div>
		);
	}

	const active = data?.classrooms?.active || [];
	const archived = data?.classrooms?.archived || [];
	const overview = data?.attendanceOverview || { overallPercentage: 0, perClassroom: [] };

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="bg-white rounded-xl shadow-sm p-6 mb-6">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
							<p className="text-gray-600">{user?.email}</p>
						</div>
						<div className="text-right">
							<p className="text-4xl font-bold text-blue-600">{overview.overallPercentage}%</p>
							<p className="text-gray-600">Overall attendance</p>
						</div>
					</div>
				</div>

				<div className="mb-4 border-b">
					<nav className="flex space-x-6">
						{['overview','archived'].map(t => (
							<button key={t} onClick={() => setTab(t)} className={`py-2 px-1 border-b-2 text-sm font-medium ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'}`}>
								{t === 'overview' ? 'Overview' : 'Archived'}
							</button>
						))}
					</nav>
				</div>

				{tab === 'overview' ? (
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						<div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
							<h2 className="text-lg font-semibold text-gray-900 mb-4">Active Classrooms</h2>
							{active.length === 0 ? (
								<p className="text-gray-600">No active classrooms.</p>
							) : (
								<ul className="divide-y">
									{active.map(c => (
										<li key={c._id} className="py-3 flex items-center justify-between">
											<div>
												<p className="font-medium text-gray-900">{c.name}</p>
												<p className="text-sm text-gray-600">{c.program} • {c.branch} • {c.academicYear} • {c.semester}</p>
											</div>
										</li>
									))}
								</ul>
							)}
						</div>
						<div className="bg-white rounded-xl shadow-sm p-6">
							<h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance by Classroom</h2>
							{overview.perClassroom.length === 0 ? (
								<p className="text-gray-600">No attendance data.</p>
							) : (
								<ul className="space-y-2">
									{overview.perClassroom.map(p => (
										<li key={p.classroomId} className="flex items-center justify-between">
											<span className="text-gray-800">{p.classroomName}</span>
											<span className="font-semibold text-blue-600">{p.percentage}%</span>
										</li>
									))}
								</ul>
							)}
						</div>
					</div>
				) : (
					<div className="bg-white rounded-xl shadow-sm p-6">
						<h2 className="text-lg font-semibold text-gray-900 mb-4">Archived Classrooms</h2>
						{archived.length === 0 ? (
							<p className="text-gray-600">No archived classrooms.</p>
						) : (
							<ul className="divide-y">
								{archived.map(c => (
									<li key={c._id} className="py-3">
										<p className="font-medium text-gray-900">{c.name}</p>
										<p className="text-sm text-gray-600">{c.program} • {c.branch} • {c.academicYear} • {c.semester}</p>
									</li>
								))}
							</ul>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default TeacherProfile;

