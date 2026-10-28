import React, { useState } from 'react';
import {
  Building2,
  Phone,
  Mail,
  User,
  MapPin,
  FileCheck,
  ShieldAlert,
  Users,
  Calendar,
  Check,
  ArrowLeft,
  Navigation as NavigationIcon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TabType } from '../components/Navigation';
import { Factory, RiskLevel } from '../types';

interface NewFactoryViewProps {
  onNavigate: (tab: TabType, id?: string) => void;
}

export const NewFactoryView: React.FC<NewFactoryViewProps> = ({ onNavigate }) => {
  const { addFactory } = useApp();

  const [formData, setFormData] = useState({
    name: '',
    registrationNumber: `FAC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    lat: '13.7563',
    lng: '100.5018',
    sector: 'Automotive & Metal' as Factory['sector'],
    employeeCount: '150',
    establishedYear: '2018',
    riskLevel: 'Medium' as RiskLevel,
    operatingLicenseNo: `LIC-IND-${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'Active' as Factory['status'],
    photoUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80',
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successSaved, setSuccessSaved] = useState(false);

  const samplePhotos = [
    { label: 'Heavy Manufacturing & Metal', url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80' },
    { label: 'Chemical & Refinery Plant', url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=800&auto=format&fit=crop&q=80' },
    { label: 'Textile & Garment Workshop', url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80' },
    { label: 'Electronics & Cleanroom Facility', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80' },
  ];

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData((prev) => ({
            ...prev,
            lat: pos.coords.latitude.toFixed(4),
            lng: pos.coords.longitude.toFixed(4),
          }));
        },
        () => {
          // Fallback simulation
          setFormData((prev) => ({
            ...prev,
            lat: (13.5 + Math.random() * 0.5).toFixed(4),
            lng: (100.5 + Math.random() * 0.5).toFixed(4),
          }));
        }
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Factory Name is required.');
      return;
    }
    if (!formData.ownerName.trim()) {
      setErrorMsg('Factory Owner Name is required.');
      return;
    }
    if (!formData.ownerPhone.trim()) {
      setErrorMsg('Owner Contact Phone Number is required.');
      return;
    }
    if (!formData.address.trim() || !formData.city.trim()) {
      setErrorMsg('Factory Address and City/Industrial Zone are required.');
      return;
    }

    const created = addFactory({
      name: formData.name.trim(),
      registrationNumber: formData.registrationNumber.trim(),
      ownerName: formData.ownerName.trim(),
      ownerPhone: formData.ownerPhone.trim(),
      ownerEmail: formData.ownerEmail.trim() || `${formData.ownerName.toLowerCase().replace(/\s+/g, '.')}@factory.com`,
      address: formData.address.trim(),
      city: formData.city.trim(),
      province: formData.province.trim() || 'Industrial Estate',
      postalCode: formData.postalCode.trim() || '10110',
      coordinates: {
        lat: parseFloat(formData.lat) || 13.7563,
        lng: parseFloat(formData.lng) || 100.5018,
      },
      sector: formData.sector,
      employeeCount: parseInt(formData.employeeCount, 10) || 50,
      establishedYear: parseInt(formData.establishedYear, 10) || 2020,
      riskLevel: formData.riskLevel,
      operatingLicenseNo: formData.operatingLicenseNo,
      photoUrl: formData.photoUrl,
      status: formData.status,
    });

    setSuccessSaved(true);
    setTimeout(() => {
      onNavigate('factories', created.id);
    }, 700);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 sm:pb-8">
      {/* Header */}
      <div className="bg-white border-2 border-slate-200 p-5 flex items-center justify-between">
        <div>
          <button
            onClick={() => onNavigate('factories')}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 uppercase tracking-wider mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Directory
          </button>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#00a8ff]" />
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
              Register New Factory Profile
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Create an official manufacturing facility record for regulatory assessment and compliance tracking.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border-2 border-[#e84118] text-[#e84118] text-xs font-bold uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successSaved && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-500 text-emerald-800 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>Factory profile created successfully! Redirecting...</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white border-2 border-slate-200 p-6 space-y-6 shadow-xs">
        {/* Section 1: General Information */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#00a8ff]" />
            1. General Industrial Profile
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Factory Enterprise Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Bangpoo Precision Stamping Co., Ltd."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full text-xs border border-slate-300 p-2.5 font-medium bg-[#f5f6fa]/40 focus:outline-none focus:border-[#00a8ff]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Factory Registration Number
              </label>
              <input
                type="text"
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                className="w-full text-xs font-mono border border-slate-300 p-2.5 font-medium bg-[#f5f6fa]/40 focus:outline-none focus:border-[#00a8ff]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Industry Sector Classification *
              </label>
              <select
                value={formData.sector}
                onChange={(e) =>
                  setFormData({ ...formData, sector: e.target.value as Factory['sector'] })
                }
                className="w-full text-xs border border-slate-300 p-2.5 font-medium bg-white focus:outline-none focus:border-[#00a8ff]"
              >
                <option value="Automotive & Metal">Automotive & Metal</option>
                <option value="Textile & Garment">Textile & Garment</option>
                <option value="Food & Beverage">Food & Beverage</option>
                <option value="Chemical & Plastics">Chemical & Plastics</option>
                <option value="Electronics & Hardware">Electronics & Hardware</option>
                <option value="Wood & Paper">Wood & Paper</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Operating License Number (Ror.Ngor 4)
              </label>
              <input
                type="text"
                placeholder="e.g. LIC-IND-8821-XX"
                value={formData.operatingLicenseNo}
                onChange={(e) => setFormData({ ...formData, operatingLicenseNo: e.target.value })}
                className="w-full text-xs font-mono border border-slate-300 p-2.5 font-medium bg-[#f5f6fa]/40 focus:outline-none focus:border-[#00a8ff]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Owner & Executive Contact */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-[#00a8ff]" />
            2. Owner & Executive Contact
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Owner / Managing Director Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Somchai Prasertkit"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full text-xs border border-slate-300 p-2.5 font-medium bg-[#f5f6fa]/40 focus:outline-none focus:border-[#00a8ff]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Owner Direct Phone Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  required
                  placeholder="+66 81 234 5678"
                  value={formData.ownerPhone}
                  onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 text-xs font-mono border border-slate-300 bg-[#f5f6fa]/40 focus:outline-none focus:border-[#00a8ff]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Official Contact Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  placeholder="contact@factory.com"
                  value={formData.ownerEmail}
                  onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 text-xs font-mono border border-slate-300 bg-[#f5f6fa]/40 focus:outline-none focus:border-[#00a8ff]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Physical Address & Location */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#00a8ff]" />
            3. Facility Location & GPS Coordinates
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Full Street / Industrial Estate Address *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 128 Moo 5, Bangpoo Industrial Estate Soi 12"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full text-xs border border-slate-300 p-2.5 font-medium bg-[#f5f6fa]/40 focus:outline-none focus:border-[#00a8ff]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  City / District *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mueang"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full text-xs border border-slate-300 p-2.5 font-medium bg-[#f5f6fa]/40 focus:outline-none focus:border-[#00a8ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Province
                </label>
                <input
                  type="text"
                  placeholder="e.g. Samut Prakan"
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  className="w-full text-xs border border-slate-300 p-2.5 font-medium bg-[#f5f6fa]/40 focus:outline-none focus:border-[#00a8ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  placeholder="10280"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full text-xs font-mono border border-slate-300 p-2.5 font-medium bg-[#f5f6fa]/40 focus:outline-none focus:border-[#00a8ff]"
                />
              </div>
            </div>

            {/* GPS input with auto-detect */}
            <div className="bg-[#f5f6fa] border border-slate-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Latitude:</span>
                  <input
                    type="text"
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                    className="w-24 ml-1 px-2 py-1 text-xs font-mono border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Longitude:</span>
                  <input
                    type="text"
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                    className="w-24 ml-1 px-2 py-1 text-xs font-mono border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="text-xs text-[#00a8ff] font-bold hover:underline flex items-center gap-1 uppercase"
              >
                <NavigationIcon className="w-3.5 h-3.5" />
                Capture Current GPS Location
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: Operational Metrics & Risk Assessment */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#00a8ff]" />
            4. Operational Metrics & Inherent Risk
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Total Workforce Headcount
              </label>
              <input
                type="number"
                min="1"
                value={formData.employeeCount}
                onChange={(e) => setFormData({ ...formData, employeeCount: e.target.value })}
                className="w-full text-xs font-mono border border-slate-300 p-2.5 font-medium bg-[#f5f6fa]/40 focus:outline-none focus:border-[#00a8ff]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Facility Establishment Year
              </label>
              <input
                type="number"
                min="1950"
                max="2030"
                value={formData.establishedYear}
                onChange={(e) => setFormData({ ...formData, establishedYear: e.target.value })}
                className="w-full text-xs font-mono border border-slate-300 p-2.5 font-medium bg-[#f5f6fa]/40 focus:outline-none focus:border-[#00a8ff]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Inherent Risk Classification
              </label>
              <select
                value={formData.riskLevel}
                onChange={(e) =>
                  setFormData({ ...formData, riskLevel: e.target.value as RiskLevel })
                }
                className="w-full text-xs border border-slate-300 p-2.5 font-bold uppercase bg-white focus:outline-none focus:border-[#00a8ff]"
              >
                <option value="Low">Low Risk</option>
                <option value="Medium">Medium Risk</option>
                <option value="High">High Risk</option>
                <option value="Critical">Critical Risk</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 5: Photo Reference */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 mb-3">
            5. Facility Visual Reference
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            {samplePhotos.map((photo, i) => (
              <div
                key={i}
                onClick={() => setFormData({ ...formData, photoUrl: photo.url })}
                className={`relative border-2 p-1 cursor-pointer transition-all ${
                  formData.photoUrl === photo.url ? 'border-[#00a8ff]' : 'border-slate-200 opacity-70'
                }`}
              >
                <img
                  src={photo.url}
                  alt={photo.label}
                  className="w-full h-20 object-cover"
                />
                <span className="text-[10px] font-bold line-clamp-1 mt-1 text-slate-700 block">
                  {photo.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => onNavigate('factories')}
            className="px-5 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#00a8ff] hover:bg-[#0090e0] text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-xs"
          >
            <Check className="w-4 h-4" />
            Save & Register Profile
          </button>
        </div>
      </form>
    </div>
  );
};
