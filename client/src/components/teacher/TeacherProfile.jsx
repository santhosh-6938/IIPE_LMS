import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { getNames } from 'country-list';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const TeacherProfile = () => {
	const { user } = useSelector(state => state.auth);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [data, setData] = useState(null);
	const [tab, setTab] = useState('overview'); // overview | archived | update
	const [form, setForm] = useState({
		name: '',
		gender: '',
		dateOfBirth: '',
		alternateEmail: '',
		nationality: '',
		languagesKnown: '',
		designation: '',
		department: '',
		programsTaught: '',
		coursesAssigned: '',
		specialization: '',
		experienceYears: '',
		dateOfJoining: '',
		employmentType: '',
		highestQualification: '',
		degreesCertifications: '',
		institutionsAttended: '',
		yearOfGraduation: '',
		researchInterests: '',
		publications: '',
		workshops: '',
		awards: '',
		currentAddress: { line1:'', line2:'', city:'', state:'', postalCode:'', country:'' },
		permanentAddress: { line1:'', line2:'', city:'', state:'', postalCode:'', country:'' },
		profilePhotoFile: null
	});
	const countryOptions = getNames();

	const initFormFromData = () => {
		const u = data?.user || {};
		setForm({
			name: u.name || '',
			gender: u.gender || '',
			dateOfBirth: u.dateOfBirth ? new Date(u.dateOfBirth).toISOString().slice(0,10) : '',
			alternateEmail: u.alternateEmail || '',
			nationality: u.nationality || '',
			languagesKnown: (u.languagesKnown || []).join(', '),
			designation: u.designation || '',
			department: u.department || '',
			programsTaught: (u.programsTaught || []).join(', '),
			coursesAssigned: (u.coursesAssigned || []).join(', '),
			specialization: u.specialization || '',
			experienceYears: u.experienceYears || '',
			dateOfJoining: u.dateOfJoining ? new Date(u.dateOfJoining).toISOString().slice(0,10) : '',
			employmentType: u.employmentType || '',
			highestQualification: u.highestQualification || '',
			degreesCertifications: (u.degreesCertifications || []).join(', '),
			institutionsAttended: (u.institutionsAttended || []).join(', '),
			yearOfGraduation: u.yearOfGraduation || '',
			researchInterests: (u.researchInterests || []).join(', '),
			publications: (u.publications || []).join(', '),
			workshops: (u.workshops || []).join(', '),
			awards: (u.awards || []).join(', '),
			currentAddress: { ...(u.currentAddress || {}) },
			permanentAddress: { ...(u.permanentAddress || {}) },
			profilePhotoFile: null
		});
	};

	useEffect(() => { if (data) initFormFromData(); }, [data]);

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

	const handleFormChange = (e) => {
		const { name, value } = e.target;
		if (name.startsWith('currentAddress.') || name.startsWith('permanentAddress.')) {
			const [root, key] = name.split('.');
			setForm(prev => ({ ...prev, [root]: { ...prev[root], [key]: value }}));
		} else {
			setForm(prev => ({ ...prev, [name]: value }));
		}
	};

	const handlePhoto = (e) => {
		const file = e.target.files?.[0];
		setForm(prev => ({ ...prev, profilePhotoFile: file || null }));
	};

	const submitUpdate = async (e) => {
		e.preventDefault();
		try {
			const token = localStorage.getItem('token');
			const fd = new FormData();
			// basic
			fd.append('name', form.name || '');
			if (form.gender) fd.append('gender', form.gender);
			if (form.dateOfBirth) fd.append('dateOfBirth', form.dateOfBirth);
			if (form.alternateEmail) fd.append('alternateEmail', form.alternateEmail);
			if (form.nationality) fd.append('nationality', form.nationality);
			if (form.profilePhotoFile) fd.append('profilePhoto', form.profilePhotoFile);
			// arrays
			if (form.languagesKnown) fd.append('languagesKnown', form.languagesKnown);
			if (form.programsTaught) fd.append('programsTaught', form.programsTaught);
			if (form.coursesAssigned) fd.append('coursesAssigned', form.coursesAssigned);
			if (form.degreesCertifications) fd.append('degreesCertifications', form.degreesCertifications);
			if (form.institutionsAttended) fd.append('institutionsAttended', form.institutionsAttended);
			if (form.researchInterests) fd.append('researchInterests', form.researchInterests);
			if (form.publications) fd.append('publications', form.publications);
			if (form.workshops) fd.append('workshops', form.workshops);
			if (form.awards) fd.append('awards', form.awards);
			// professional
			if (form.designation) fd.append('designation', form.designation);
			if (form.department) fd.append('department', form.department);
			if (form.specialization) fd.append('specialization', form.specialization);
			if (form.experienceYears !== '') fd.append('experienceYears', String(form.experienceYears));
			if (form.dateOfJoining) fd.append('dateOfJoining', form.dateOfJoining);
			if (form.employmentType) fd.append('employmentType', form.employmentType);
			// academic
			if (form.highestQualification) fd.append('highestQualification', form.highestQualification);
			if (form.yearOfGraduation) fd.append('yearOfGraduation', String(form.yearOfGraduation));
			// addresses
			fd.append('currentAddress', JSON.stringify(form.currentAddress || {}));
			fd.append('permanentAddress', JSON.stringify(form.permanentAddress || {}));

			await axios.put(`${API_URL}/profile/update`, fd, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
			// refresh
			const res = await axios.get(`${API_URL}/profile/me`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
			setData(res.data);
			setTab('overview');
		} catch (e) {
			setError(e?.response?.data?.message || 'Failed to update profile');
		}
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="bg-white rounded-xl shadow-sm p-6 mb-6">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
							<p className="text-gray-600">{user?.email}</p>
							{data?.user?.employeeId && (
								<p className="text-sm text-gray-700 mt-1">Employee ID: <span className="font-medium">{data.user.employeeId}</span></p>
							)}
						</div>
						<div className="text-right">
							<p className="text-4xl font-bold text-blue-600">{overview.overallPercentage}%</p>
							<p className="text-gray-600">Overall attendance</p>
						</div>
					</div>
				</div>

				<div className="mb-4 border-b">
					<nav className="flex space-x-6">
						{['overview', 'archived', 'update'].map(t => (
							<button key={t} onClick={() => setTab(t)} className={`py-2 px-1 border-b-2 text-sm font-medium ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'}`}>
								{t === 'overview' ? 'Overview' : t === 'archived' ? 'Archived' : 'Update Profile'}
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

						{/* Basic Information */}
						<div className="lg:col-span-3 bg-white rounded-xl shadow-sm p-6">
							<h3 className="text-md font-semibold text-gray-900 mb-4">Basic Information</h3>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
								<div><span className="text-gray-600">Employee ID:</span> <span className="font-medium">{data?.user?.employeeId || '-'}</span></div>
								<div><span className="text-gray-600">Email:</span> <span className="font-medium">{data?.user?.email || '-'}</span></div>
								<div><span className="text-gray-600">Alternate Email:</span> <span className="font-medium">{data?.user?.alternateEmail || '-'}</span></div>
								<div><span className="text-gray-600">Gender:</span> <span className="font-medium">{data?.user?.gender || '-'}</span></div>
								<div><span className="text-gray-600">Date of Birth:</span> <span className="font-medium">{data?.user?.dateOfBirth ? new Date(data.user.dateOfBirth).toLocaleDateString() : '-'}</span></div>
								<div><span className="text-gray-600">Nationality:</span> <span className="font-medium">{data?.user?.nationality || '-'}</span></div>
								<div className="md:col-span-3"><span className="text-gray-600">Languages Known:</span> <span className="font-medium">{(data?.user?.languagesKnown || []).join(', ') || '-'}</span></div>
								<div className="md:col-span-3"><span className="text-gray-600">Current Address:</span> <span className="font-medium">{[data?.user?.currentAddress?.line1, data?.user?.currentAddress?.line2, data?.user?.currentAddress?.city, data?.user?.currentAddress?.state, data?.user?.currentAddress?.postalCode, data?.user?.currentAddress?.country].filter(Boolean).join(', ') || '-'}</span></div>
								<div className="md:col-span-3"><span className="text-gray-600">Permanent Address:</span> <span className="font-medium">{[data?.user?.permanentAddress?.line1, data?.user?.permanentAddress?.line2, data?.user?.permanentAddress?.city, data?.user?.permanentAddress?.state, data?.user?.permanentAddress?.postalCode, data?.user?.permanentAddress?.country].filter(Boolean).join(', ') || '-'}</span></div>
							</div>
						</div>

						{/* Professional Details */}
						<div className="lg:col-span-3 bg-white rounded-xl shadow-sm p-6">
							<h3 className="text-md font-semibold text-gray-900 mb-4">Professional Details</h3>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
								<div><span className="text-gray-600">Designation:</span> <span className="font-medium">{data?.user?.designation || '-'}</span></div>
								<div><span className="text-gray-600">Department:</span> <span className="font-medium">{data?.user?.department || '-'}</span></div>
								<div><span className="text-gray-600">Experience (years):</span> <span className="font-medium">{data?.user?.experienceYears ?? '-'}</span></div>
								<div><span className="text-gray-600">Date of Joining:</span> <span className="font-medium">{data?.user?.dateOfJoining ? new Date(data.user.dateOfJoining).toLocaleDateString() : '-'}</span></div>
								<div><span className="text-gray-600">Employment Type:</span> <span className="font-medium">{data?.user?.employmentType || '-'}</span></div>
								<div className="md:col-span-3"><span className="text-gray-600">Program(s) Taught:</span> <span className="font-medium">{(data?.user?.programsTaught || []).join(', ') || '-'}</span></div>
								<div className="md:col-span-3"><span className="text-gray-600">Courses Assigned:</span> <span className="font-medium">{(data?.user?.coursesAssigned || []).join(', ') || '-'}</span></div>
								<div className="md:col-span-3"><span className="text-gray-600">Specialization:</span> <span className="font-medium">{data?.user?.specialization || '-'}</span></div>
							</div>
						</div>

						{/* Academic Qualifications */}
						<div className="lg:col-span-3 bg-white rounded-xl shadow-sm p-6">
							<h3 className="text-md font-semibold text-gray-900 mb-4">Academic Qualifications</h3>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
								<div className="md:col-span-3"><span className="text-gray-600">Highest Qualification:</span> <span className="font-medium">{data?.user?.highestQualification || '-'}</span></div>
								<div className="md:col-span-3"><span className="text-gray-600">Degrees / Certifications:</span> <span className="font-medium">{(data?.user?.degreesCertifications || []).join(', ') || '-'}</span></div>
								<div className="md:col-span-3"><span className="text-gray-600">Institutions Attended:</span> <span className="font-medium">{(data?.user?.institutionsAttended || []).join(', ') || '-'}</span></div>
								<div><span className="text-gray-600">Year of Graduation:</span> <span className="font-medium">{data?.user?.yearOfGraduation ?? '-'}</span></div>
								<div className="md:col-span-3"><span className="text-gray-600">Research Interests:</span> <span className="font-medium">{(data?.user?.researchInterests || []).join(', ') || '-'}</span></div>
								<div className="md:col-span-3"><span className="text-gray-600">Publications / Papers:</span> <span className="font-medium">{(data?.user?.publications || []).join(', ') || '-'}</span></div>
								<div className="md:col-span-3"><span className="text-gray-600">Workshops / Seminars Attended:</span> <span className="font-medium">{(data?.user?.workshops || []).join(', ') || '-'}</span></div>
								<div className="md:col-span-3"><span className="text-gray-600">Awards / Recognitions:</span> <span className="font-medium">{(data?.user?.awards || []).join(', ') || '-'}</span></div>
							</div>
						</div>

						{/* Administrative Metadata */}
						<div className="lg:col-span-3 bg-white rounded-xl shadow-sm p-6">
							<h3 className="text-md font-semibold text-gray-900 mb-4">Administrative Metadata</h3>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
								<div><span className="text-gray-600">Created By:</span> <span className="font-medium">{data?.user?.createdBy || '-'}</span></div>
								<div><span className="text-gray-600">Updated By:</span> <span className="font-medium">{data?.user?.updatedBy || '-'}</span></div>
								<div><span className="text-gray-600">Verification Status:</span> <span className="font-medium">{data?.user?.verificationStatus || '-'}</span></div>
								<div className="md:col-span-3"><span className="text-gray-600">Remarks / Notes:</span> <span className="font-medium">{data?.user?.remarks || '-'}</span></div>
							</div>
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
				{tab === 'update' && (
					<div className="bg-white rounded-xl shadow-sm p-6">
						<h2 className="text-lg font-semibold text-gray-900 mb-4">Update Profile</h2>
						<form onSubmit={submitUpdate} className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700">Full Name</label>
									<input name="name" value={form.name} onChange={handleFormChange} className="mt-1 w-full border px-3 py-2 rounded" />
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700">Profile Picture</label>
									<input type="file" accept="image/*" onChange={handlePhoto} className="mt-1 w-full" />
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700">Gender</label>
									<select name="gender" value={form.gender} onChange={handleFormChange} className="mt-1 w-full border px-3 py-2 rounded">
										<option value="">Select</option>
										<option value="male">Male</option>
										<option value="female">Female</option>
										<option value="other">Other</option>
										<option value="prefer_not_to_say">Prefer not to say</option>
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700">Date of Birth</label>
									<input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleFormChange} className="mt-1 w-full border px-3 py-2 rounded" />
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700">Employee ID (default)</label>
									<input value={data?.user?.employeeId || ''} readOnly className="mt-1 w-full border px-3 py-2 rounded bg-gray-50" />
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700">Email (default)</label>
									<input value={data?.user?.email || ''} readOnly className="mt-1 w-full border px-3 py-2 rounded bg-gray-50" />
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700">Alternate Email</label>
									<input name="alternateEmail" value={form.alternateEmail} onChange={handleFormChange} type="email" className="mt-1 w-full border px-3 py-2 rounded" />
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700">Nationality</label>
									<select name="nationality" value={form.nationality} onChange={handleFormChange} className="mt-1 w-full border px-3 py-2 rounded">
										<option value="">Select Country</option>
										{countryOptions.map(c => (
											<option key={c} value={c}>{c}</option>
										))}
									</select>
								</div>
								<div className="md:col-span-2">
									<label className="block text-sm font-medium text-gray-700">Languages Known (comma separated)</label>
									<input name="languagesKnown" value={form.languagesKnown} onChange={handleFormChange} className="mt-1 w-full border px-3 py-2 rounded" />
								</div>
							</div>

							<h3 className="text-md font-semibold text-gray-900">Address</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<p className="text-sm font-medium text-gray-700">Current Address</p>
									{['line1','line2','city','state','postalCode','country'].map(k => (
										<input key={k} name={`currentAddress.${k}`} value={form.currentAddress?.[k] || ''} onChange={handleFormChange} placeholder={k} className="mt-1 w-full border px-3 py-2 rounded" />
									))}
								</div>
								<div>
									<p className="text-sm font-medium text-gray-700">Permanent Address</p>
									{['line1','line2','city','state','postalCode','country'].map(k => (
										<input key={k} name={`permanentAddress.${k}`} value={form.permanentAddress?.[k] || ''} onChange={handleFormChange} placeholder={k} className="mt-1 w-full border px-3 py-2 rounded" />
									))}
								</div>
							</div>

							<h3 className="text-md font-semibold text-gray-900">Professional Details</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700">Designation / Role</label>
									<input name="designation" value={form.designation} onChange={handleFormChange} className="mt-1 w-full border px-3 py-2 rounded" />
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700">Department / Branch</label>
									<input name="department" value={form.department} onChange={handleFormChange} className="mt-1 w-full border px-3 py-2 rounded" />
								</div>
								<div className="md:col-span-2">
									<label className="block text-sm font-medium text-gray-700">Program(s) Taught</label>
									<input name="programsTaught" value={form.programsTaught} onChange={handleFormChange} placeholder="Comma separated" className="mt-1 w-full border px-3 py-2 rounded" />
								</div>
								<div className="md:col-span-2">
									<label className="block text-sm font-medium text-gray-700">Courses Assigned</label>
									<input name="coursesAssigned" value={form.coursesAssigned} onChange={handleFormChange} placeholder="Comma separated" className="mt-1 w-full border px-3 py-2 rounded" />
								</div>
								<div className="md:col-span-2">
									<label className="block text-sm font-medium text-gray-700">Specialization / Area of Expertise</label>
									<input name="specialization" value={form.specialization} onChange={handleFormChange} className="mt-1 w-full border px-3 py-2 rounded" />
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700">Experience (years)</label>
									<input name="experienceYears" type="number" min="0" max="60" value={form.experienceYears} onChange={handleFormChange} className="mt-1 w-full border px-3 py-2 rounded" />
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700">Date of Joining</label>
									<input name="dateOfJoining" type="date" value={form.dateOfJoining} onChange={handleFormChange} className="mt-1 w-full border px-3 py-2 rounded" />
								</div>
								<div className="md:col-span-2">
									<label className="block text-sm font-medium text-gray-700">Employment Type</label>
									<select name="employmentType" value={form.employmentType} onChange={handleFormChange} className="mt-1 w-full border px-3 py-2 rounded">
										<option value="">Select</option>
										<option value="Full-time">Full-time</option>
										<option value="Part-time">Part-time</option>
										<option value="Research Scholar">Research Scholar</option>
									</select>
								</div>
							</div>

							<h3 className="text-md font-semibold text-gray-900">Academic Qualifications</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="md:col-span-2">
									<label className="block text-sm font-medium text-gray-700">Highest Qualification</label>
									<input name="highestQualification" value={form.highestQualification} onChange={handleFormChange} className="mt-1 w-full border px-3 py-2 rounded" />
								</div>
								<div className="md:col-span-2">
									<label className="block text-sm font-medium text-gray-700">Degrees / Certifications</label>
									<input name="degreesCertifications" value={form.degreesCertifications} onChange={handleFormChange} placeholder="Comma separated" className="mt-1 w-full border px-3 py-2 rounded" />
								</div>
								<div className="md:col-span-2">
									<label className="block text-sm font-medium text-gray-700">Institutions Attended</label>
									<input name="institutionsAttended" value={form.institutionsAttended} onChange={handleFormChange} placeholder="Comma separated" className="mt-1 w-full border px-3 py-2 rounded" />
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700">Year of Graduation</label>
									<input name="yearOfGraduation" type="number" value={form.yearOfGraduation} onChange={handleFormChange} className="mt-1 w-full border px-3 py-2 rounded" />
								</div>
								<div className="md:col-span-2">
									<label className="block text-sm font-medium text-gray-700">Research Interests</label>
									<input name="researchInterests" value={form.researchInterests} onChange={handleFormChange} placeholder="Comma separated" className="mt-1 w-full border px-3 py-2 rounded" />
								</div>
								<div className="md:col-span-2">
									<label className="block text-sm font-medium text-gray-700">Publications / Papers</label>
									<input name="publications" value={form.publications} onChange={handleFormChange} placeholder="Comma separated" className="mt-1 w-full border px-3 py-2 rounded" />
								</div>
								<div className="md:col-span-2">
									<label className="block text-sm font-medium text-gray-700">Workshops / Seminars Attended</label>
									<input name="workshops" value={form.workshops} onChange={handleFormChange} placeholder="Comma separated" className="mt-1 w-full border px-3 py-2 rounded" />
								</div>
								<div className="md:col-span-2">
									<label className="block text-sm font-medium text-gray-700">Awards / Recognitions</label>
									<input name="awards" value={form.awards} onChange={handleFormChange} placeholder="Comma separated" className="mt-1 w-full border px-3 py-2 rounded" />
								</div>
							</div>

							<div className="flex justify-end">
								<button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Changes</button>
							</div>
						</form>
					</div>
				)}
			</div>
		</div>
	);
};

export default TeacherProfile;


